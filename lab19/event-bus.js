import { EventEmitter } from 'node:events';
export class EventBus extends EventEmitter {
  #subscriptions = new Map();
  #any = [];
  #events = new Map();
  #total = 0;
  #order = 0;
  #subscribe(event, listener, priority, once) {
    if (typeof listener !== 'function' || !Number.isFinite(priority)) throw new TypeError('Nevernyi slushatel ili prioritet');
    const list = this.#subscriptions.get(event) ?? [];
    list.push({ listener, priority, once, order: this.#order++ });
    this.#subscriptions.set(event, list);
    return this;
  }
  on(event, listener, priority = 0) { return this.#subscribe(event, listener, priority, false); }
  addListener(event, listener, priority = 0) { return this.on(event, listener, priority); }
  once(event, listener, priority = 0) { return this.#subscribe(event, listener, priority, true); }
  onAny(listener) { if (typeof listener !== 'function') throw new TypeError('Trebuetsya funkciya'); this.#any.push(listener); return this; }
  offAny(listener) { this.#any = this.#any.filter(item => item !== listener); return this; }
  off(event, listener) {
    const list = this.#subscriptions.get(event) ?? [];
    const index = list.findLastIndex(item => item.listener === listener);
    if (index >= 0) list.splice(index, 1);
    if (!list.length) this.#subscriptions.delete(event);
    return this;
  }
  removeListener(event, listener) { return this.off(event, listener); }
  removeAllListeners(event) { if (event === undefined) { this.#subscriptions.clear(); this.#any = []; } else this.#subscriptions.delete(event); return this; }
  listeners(event) { return (this.#subscriptions.get(event) ?? []).map(item => item.listener); }
  listenerCount(event) { return this.listeners(event).length; }
  eventNames() { return [...this.#subscriptions.keys()]; }
  emit(event, ...args) {
    const entry = this.#events.get(event) ?? { count: 0, errors: 0, lastCalled: null };
    entry.count++; entry.lastCalled = new Date().toISOString(); this.#total++; this.#events.set(event, entry);
    const list = [...(this.#subscriptions.get(event) ?? [])].sort((a, b) => b.priority - a.priority || a.order - b.order);
    if (event === 'error' && !list.length) throw args[0] instanceof Error ? args[0] : new Error(String(args[0]));
    const handle = error => { entry.errors++; if (event === 'error') throw error; this.emit('error', error, event); };
    for (const item of list) {
      const current = this.#subscriptions.get(event) ?? [];
      if (item.once) {
        const index = current.indexOf(item);
        if (index === -1) continue;
        current.splice(index, 1);
        if (!current.length) this.#subscriptions.delete(event);
      }
      try {
        const result = item.listener.apply(this, args);
        if (result && typeof result.then === 'function') result.catch(handle);
      } catch (error) { handle(error); }
    }
    for (const listener of [...this.#any]) {
      try { const result = listener.call(this, event, ...args); if (result && typeof result.then === 'function') result.catch(handle); }
      catch (error) { handle(error); }
    }
    return list.length > 0 || this.#any.length > 0;
  }
  getMetrics() {
    return { group: '477', events: Object.fromEntries([...this.#events].map(([name, value]) => [String(name), { ...value }])), total: this.#total, listeners: Object.fromEntries([...this.#subscriptions].map(([name, list]) => [String(name), list.length])), wildcardListeners: this.#any.length };
  }
}
