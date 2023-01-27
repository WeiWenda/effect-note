import localForage from 'localforage';

import EventEmitter from '../utils/eventEmitter';
import DataBackend, { SynchronousDataBackend } from './data_backend';
import { ExtendableError } from '../utils/errors';
import logger from '../utils/logger';
import {getCategory, setCategory} from '../utils/APIUtils';

export type BackendType = 'local' | 'firebase' | 'inmemory' | 'socketserver';

export class MultipleUsersError extends ExtendableError {
  constructor() { super(
    'This document has been modified (in another tab) since opening it in this tab. Please refresh to continue!'
  ); }
}

// NOTE: not very elegant, but this won't collide with other keys
// since prefix always contains either '*save' or 'settings:'.
// Future backends don't need to use this, as long as they prefix the key passed to them.
// Backends can prefix internal usage with internalPrefix to avoid namespace collision.
const internalPrefix: string = 'internal:';

export class SynchronousLocalStorageBackend extends SynchronousDataBackend {
  // constructor() {
  //   super();
  // }

  public get(key: string): string | null {
    const val = localStorage.getItem(key);
    if ((val == null) || (val === 'undefined')) {
      return null;
    }
    return val;
  }

  public set(key: string, value: string): void {
    return localStorage.setItem(key, value);
  }
}

export class LocalStorageBackend extends DataBackend {
  private lastSave: number;
  private docname: string;
  private sync_backend: SynchronousLocalStorageBackend;

  private _lastSaveKey_(): string {
    return `${internalPrefix}${this.docname}:lastSave`;
  }

  constructor(docname = '') {
    super();
    this.docname = docname;
    this.lastSave = Date.now();
    this.sync_backend = new SynchronousLocalStorageBackend();
  }

  public async get(key: string): Promise<string | null> {
    return this.sync_backend.get(key);
  }

  public async set(key: string, value: string): Promise<void> {
    if (this.getLastSave() > this.lastSave) {
      throw new MultipleUsersError();
    }
    this.lastSave = Date.now();
    this.sync_backend.set(this._lastSaveKey_(), this.lastSave + '');
    this.sync_backend.set(key, value);
  }

  // determine last time saved (for multiple tab detection)
  // note that this doesn't cache!
  public getLastSave(): number {
    return JSON.parse(this.sync_backend.get(this._lastSaveKey_()) || '0');
  }
}

export class IndexedDBBackend extends DataBackend {
  private lastSave: number;
  private docname: string;

  private _lastSaveKey_(): string {
    return `${internalPrefix}${this.docname}:lastSave`;
  }

  constructor(docname = '') {
    super();
    this.docname = docname;
    this.lastSave = Date.now();
  }

  public async get(key: string): Promise<string | null> {
    const res = await localForage.getItem(key);
    return res as string;
  }

  public async set(key: string, value: string): Promise<void> {
    if (await this.getLastSave() > this.lastSave) {
      throw new MultipleUsersError();
    }
    this.lastSave = Date.now();
    await localForage.setItem(this._lastSaveKey_(), this.lastSave + '');
    await localForage.setItem(key, value);
    logger.debug('IndexDB set:', key, value);
    return Promise.resolve();
  }

  // determine last time saved (for multiple tab detection)
  // note that this doesn't cache!
  public async getLastSave(): Promise<number> {
    return JSON.parse(await localForage.getItem(this._lastSaveKey_()) || '0');
  }
}

export class HttpBackend extends DataBackend {
  public async get(key: string): Promise<string | null> {
    return getCategory(key).catch((e) => {
      console.log(e);
      return null;
    });
  }

  public async set(key: string, value: string): Promise<void> {
    return setCategory(key, value).then(() => {
      console.log(`set ${key} ${value}`);
    });
  }
}

export class ClientSocketBackend extends DataBackend {
  public events: EventEmitter = new EventEmitter();
  private numPendingSaves: number = 0;
  private callback_table: {[id: string]: (result: any) => void} = {};

  // init is like async constructor
  private ws!: WebSocket;
  private clientId: string;

  constructor() {
    super();
    this.clientId = Date.now() + '-' + ('' + Math.random()).slice(2);
  }

  private async connect(host: string, password: string, docname: string) {
    logger.info('Trying to connect', host);
    this.ws = new WebSocket(`${host}/socket`);
    this.ws.onerror = () => {
      // throw new Error(`Socket connection error: ${err}`);
      logger.info('Socket connection error!');
    };
    this.ws.onclose = () => {
      // throw new Error('Socket connection closed!');
      logger.info('Socket connection closed! Trying to reconnect...');
      setTimeout(() => {
        this.connect(host, password, docname);
      }, 5000);
    };

    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      setTimeout(() => {
        reject('Timed out trying to connect!');
      }, 5000);
    });
    logger.info('Connected', host);

    this.ws.onmessage = (event) => {
      // tslint:disable-next-line no-console
      const message = JSON.parse(event.data);
      if (message.type === 'callback') {
        const id: string = message.id;
        if (!(id in this.callback_table)) {
          throw new Error(`ID ${id} not found in callback table`);
        }
        const callback = this.callback_table[id];
        delete this.callback_table[id];
        callback(message.result);
      } else if (message.type === 'joined') {
        if (message.docname === docname) {
          if (message.clientId !== this.clientId) {
            throw new MultipleUsersError();
          }
        }
      }
    };

    await this.sendMessage({
      type: 'join',
      password: password,
      docname: docname,
    });
  }

  public async init(host: string, password: string, docname = '') {
    this.events.emit('saved');
    await this.connect(host, password, docname);
  }

  private async sendMessage(message: Object): Promise<string | null> {
    return new Promise((resolve: (result: string | null) => void, reject) => {
      const id = Date.now() + '-' + ('' + Math.random()).slice(2);
      if (id in this.callback_table) { throw new Error('Duplicate IDs!?'); }
      this.callback_table[id] = (result) => {
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result.value);
        }
      };
      this.ws.send(JSON.stringify({
        ...message,
        id: id,
        clientId: this.clientId
      }));
    });
  }

  public async get(key: string): Promise<string | null> {
    logger.debug('Socket client: getting', key);
    return await this.sendMessage({
      type: 'get',
      key: key,
    });
  }

  public set(key: string, value: string): Promise<void> {
    if (this.numPendingSaves === 0) {
      this.events.emit('unsaved');
    }
    logger.debug('Socket client: setting', key, 'to', value);
    this.numPendingSaves++;

    this.sendMessage({
      type: 'set',
      key: key,
      value: value,
    }).then(() => {
      this.numPendingSaves--;
      if (this.numPendingSaves === 0) {
        this.events.emit('saved');
      }
    });
    return Promise.resolve();
  }
}
