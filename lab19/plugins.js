import { EventEmitter } from 'node:events';
export class PluginManager extends EventEmitter {
  plugins = new Map();
  constructor() {
    super();
    this.on('newListener', (event, listener) => console.log(`[477] newListener: ${event}, ${listener.name || 'anonymous'}`));
    this.on('removeListener', (event, listener) => console.log(`[477] removeListener: ${event}, ${listener.name || 'anonymous'}`));
  }
  register(name, event, listener) {
    if (this.plugins.has(name)) throw new Error('Plagin uzhe zaregistrirovan');
    this.plugins.set(name, { event, listener }); this.on(event, listener); this.emit('plugin:registered', name);
  }
  remove(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    this.removeListener(plugin.event, plugin.listener); this.plugins.delete(name); this.emit('plugin:removed', name); return true;
  }
}
