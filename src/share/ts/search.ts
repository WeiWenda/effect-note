import {Row} from './types';
import Path from './path';
import Session from './session';

/*
Represents the menu shown in menu mode.
Functions for paging through and selecting results, and for rendering.
Internally uses an entire session object (this is sorta weird..)
*/

type Query = string;
type SearchFn = (query: Query) => Promise<{rows: Set<Row>, accentMap: Map<number, number[]>}>;

export default class Search {
  private searchFn: SearchFn;
  public results: {rows: Set<Row>, accentMap: Map<number, number[]>};
  public lastQuery: Query | null = null;
  public session: Session;
  constructor(searchFn: SearchFn, session: Session) {
    this.searchFn = searchFn;
    this.session = session;
    this.results = {
      rows: new Set<Row>(),
      accentMap: new Map<number, number[]>()
    };
  }

  public async update(query: Query) {
    if ((JSON.stringify(query)) !== (JSON.stringify(this.lastQuery))) {
      this.lastQuery = query;
      // const t = Date.now();
      // console.log('updating results');
      this.results = await this.searchFn(query);
      this.session.emit('updateInner');
      // console.log('updating results took', Date.now() - t);
    }
  }
}
