export default class TemporaryStore<T> {
  private store: T[] = [];

  constructor(private timeout = 30000) {}

  public add(item: T): void {
    this.store.push(item);

    setTimeout(() => {
      const index = this.store.indexOf(item);
      if (index >= 0) this.store.splice(index, 1);
    }, this.timeout);
  }

  public findOne(criteria: (item: T) => boolean): T | null {
    for (let i = 0; i < this.store.length; i++) {
      if (criteria(this.store[i])) {
        return this.store.splice(i, 1)[0];
      }
    }

    return null;
  }
}
