import { ObsidianPropertyType } from './types';

export default class FrontmatterCache {
  static instance: FrontmatterCache;

  private cache: Map<string, ObsidianPropertyType> = new Map<
    string,
    ObsidianPropertyType
  >();

  getPropertyNames(type: ObsidianPropertyType) {
    const keys = [];
    for (const [key, value] of this.cache.entries()) {
      if (value === type) {
        keys.push(key);
      }
    }
    return keys;
  }

  getPropertyType(name: string) {
    return this.cache.get(name);
  }

  setPropertyType(name: string, type: ObsidianPropertyType | null) {
    if (type === null) {
      this.cache.delete(name);
      return;
    }
    this.cache.set(name, type);
  }

  getCache() {
    return this.cache;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new FrontmatterCache();
    }
    return this.instance;
  }
}
