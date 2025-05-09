import * as React from 'react';
import $ from 'jquery';
import {Path} from '../share';
import {mimetypeLookup} from '../ts/util';
import AppState from '../components/pdf-to-markdown/models/AppState';

type Props = {
  onSelect?: (filename: string) => void;
  onLoad?: (path: Path, filename: string, contents: string) => void;
  onError?: (error: string) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const load_file = function(file: File): Promise<{name: string, contents: string}> {
  if (mimetypeLookup(file.name) === 'application/pdf') {
    return new Promise((resolve, _reject) => {
      const reader = new FileReader();
      reader.onload = function (evt) {
        const appState = new AppState();
        const fileBuffer = evt.target!.result as ArrayBuffer;
        appState.tranform(new Uint8Array(fileBuffer)).then((contents) => {
          resolve({
            name: file.name + '.md',
            contents
          });
        });
      };
      reader.readAsArrayBuffer(file);
    });
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = function(evt) {
        const content = (evt.target as any).result;
        return resolve({
          name: file.name,
          contents: content,
        });
      };
      reader.onerror = function(err) {
        reject(`Failed to reading file: ${err}`);
      };
    });
  }
};

export default class FileInput extends React.Component<Props, {path: Path}> {
  private id: string;

  constructor(props: Props) {
    super(props);
    this.id = `fileinput.${Math.random()}`;
    this.state = {
      path: Path.root()
    };
  }

  private setPath(path: Path) {
    this.setState({path});
  }

  private handleChange(e: React.FormEvent<HTMLInputElement>) {
    // TODO: what is the right type here?
    const file = (e.target as any).files[0];
    if (!file) { return; } // do nothing, they canceled

    if (this.props.onSelect) {
      this.props.onSelect(file.name);
    }
    load_file(file).then(({ name, contents }) => {
      if (this.props.onLoad) {
        this.props.onLoad(this.state.path, name, contents);
      }
      $(`#${this.id}`).val('');
    }).catch((err: string) => {
      if (this.props.onError) {
        this.props.onError(err);
      }
      $(`#${this.id}`).val('');
    });
  }

  public render() {
    return (
      <div
        style={this.props.style || {position: 'relative'}}
      >
        <input type='file' id='file-uploader'
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%', height: '100%',
            zIndex: 1,
            cursor: 'pointer',
          }}
          onChange={(e) => this.handleChange(e)}
        />
      </div>
    );
  }
}
