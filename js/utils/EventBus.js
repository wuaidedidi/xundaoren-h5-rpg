export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
    }

    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        return this;
    }

    once(eventName, callback) {
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }
        this.onceEvents.get(eventName).push(callback);
        return this;
    }

    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const callbacks = this.events.get(eventName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        if (this.onceEvents.has(eventName)) {
            const callbacks = this.onceEvents.get(eventName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        return this;
    }

    emit(eventName, ...args) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`[EventBus] 事件 ${eventName} 回调执行失败:`, e);
                }
            });
        }
        if (this.onceEvents.has(eventName)) {
            const callbacks = this.onceEvents.get(eventName);
            this.onceEvents.delete(eventName);
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`[EventBus] 一次性事件 ${eventName} 回调执行失败:`, e);
                }
            });
        }
        return this;
    }

    clear(eventName) {
        if (eventName) {
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
        } else {
            this.events.clear();
            this.onceEvents.clear();
        }
        return this;
    }

    hasListeners(eventName) {
        return (this.events.has(eventName) && this.events.get(eventName).length > 0) ||
               (this.onceEvents.has(eventName) && this.onceEvents.get(eventName).length > 0);
    }
}

export const eventBus = EventBus.getInstance();
