/**
 * 寻道人 - 全局事件总线
 * 用于模块间解耦通信
 * 支持事件订阅、发布、取消订阅
 */

class EventBus {
    constructor() {
        // 事件映射表
        this.events = new Map()
        // 一次性事件
        this.onceEvents = new Map()
        // 事件历史（用于新订阅者获取最新状态）
        this.eventHistory = new Map()
        // 最大历史记录数
        this.maxHistorySize = 10
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项 { once: boolean, priority: number }
     * @returns {Function} 取消订阅函数
     */
    on(event, callback, options = {}) {
        if (typeof callback !== 'function') {
            console.error('EventBus: callback must be a function')
            return () => {}
        }

        const { once = false, priority = 0 } = options

        if (!this.events.has(event)) {
            this.events.set(event, [])
        }

        const listeners = this.events.get(event)
        const listener = { callback, priority, once }

        // 按优先级插入
        const insertIndex = listeners.findIndex(l => l.priority < priority)
        if (insertIndex === -1) {
            listeners.push(listener)
        } else {
            listeners.splice(insertIndex, 0, listener)
        }

        // 如果是 once 事件，记录到 onceEvents
        if (once) {
            if (!this.onceEvents.has(event)) {
                this.onceEvents.set(event, new Set())
            }
            this.onceEvents.get(event).add(callback)
        }

        // 返回取消订阅函数
        return () => this.off(event, callback)
    }

    /**
     * 一次性订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    once(event, callback) {
        return this.on(event, callback, { once: true })
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数（可选，不传则取消所有）
     */
    off(event, callback) {
        if (!this.events.has(event)) return

        if (!callback) {
            // 取消所有订阅
            this.events.delete(event)
            this.onceEvents.delete(event)
            return
        }

        const listeners = this.events.get(event)
        const index = listeners.findIndex(l => l.callback === callback)

        if (index !== -1) {
            listeners.splice(index, 1)

            // 从 onceEvents 中移除
            if (this.onceEvents.has(event)) {
                this.onceEvents.get(event).delete(callback)
            }
        }

        // 清理空数组
        if (listeners.length === 0) {
            this.events.delete(event)
        }
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {...any} args - 传递参数
     * @returns {Promise<Array>} 所有回调的返回值
     */
    async emit(event, ...args) {
        // 记录到历史
        this.addToHistory(event, args)

        if (!this.events.has(event)) {
            return []
        }

        const listeners = this.events.get(event)
        const results = []
        const toRemove = []

        // 复制数组避免在迭代时修改
        const listenersCopy = [...listeners]

        for (const listener of listenersCopy) {
            try {
                const result = await listener.callback(...args)
                results.push(result)

                // 标记一次性事件
                if (listener.once || (this.onceEvents.has(event) &&
                    this.onceEvents.get(event).has(listener.callback))) {
                    toRemove.push(listener.callback)
                }
            } catch (error) {
                console.error(`EventBus: Error in event "${event}" handler:`, error)
                results.push(undefined)
            }
        }

        // 移除一次性事件
        toRemove.forEach(callback => this.off(event, callback))

        return results
    }

    /**
     * 同步发布事件（不等待回调完成）
     * @param {string} event - 事件名称
     * @param {...any} args - 传递参数
     */
    emitSync(event, ...args) {
        // 记录到历史
        this.addToHistory(event, args)

        if (!this.events.has(event)) return

        const listeners = this.events.get(event)
        const toRemove = []

        listeners.forEach(listener => {
            try {
                listener.callback(...args)

                if (listener.once || (this.onceEvents.has(event) &&
                    this.onceEvents.get(event).has(listener.callback))) {
                    toRemove.push(listener.callback)
                }
            } catch (error) {
                console.error(`EventBus: Error in event "${event}" handler:`, error)
            }
        })

        // 移除一次性事件
        toRemove.forEach(callback => this.off(event, callback))
    }

    /**
     * 添加事件到历史记录
     */
    addToHistory(event, args) {
        if (!this.eventHistory.has(event)) {
            this.eventHistory.set(event, [])
        }

        const history = this.eventHistory.get(event)
        history.push({
            timestamp: Date.now(),
            args: args
        })

        // 限制历史记录数量
        if (history.length > this.maxHistorySize) {
            history.shift()
        }
    }

    /**
     * 获取事件历史
     * @param {string} event - 事件名称
     * @param {number} count - 获取数量
     * @returns {Array} 历史记录
     */
    getHistory(event, count = 1) {
        if (!this.eventHistory.has(event)) return []

        const history = this.eventHistory.get(event)
        return history.slice(-count)
    }

    /**
     * 获取最新事件数据
     * @param {string} event - 事件名称
     * @returns {any} 最新事件数据
     */
    getLastEvent(event) {
        const history = this.getHistory(event, 1)
        return history.length > 0 ? history[0].args : null
    }

    /**
     * 订阅并立即获取最新值（用于状态类事件）
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    subscribe(event, callback) {
        // 先获取历史值
        const lastEvent = this.getLastEvent(event)
        if (lastEvent) {
            callback(...lastEvent)
        }

        // 订阅未来事件
        return this.on(event, callback)
    }

    /**
     * 等待事件触发（Promise 风格）
     * @param {string} event - 事件名称
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<any>}
     */
    waitFor(event, timeout = 0) {
        return new Promise((resolve, reject) => {
            const unsubscribe = this.once(event, (...args) => {
                if (timeoutId) clearTimeout(timeoutId)
                resolve(args.length === 1 ? args[0] : args)
            })

            let timeoutId = null
            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    unsubscribe()
                    reject(new Error(`等待事件 "${event}" 超时`))
                }, timeout)
            }
        })
    }

    /**
     * 检查是否有订阅者
     * @param {string} event - 事件名称
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.events.has(event) && this.events.get(event).length > 0
    }

    /**
     * 获取订阅者数量
     * @param {string} event - 事件名称
     * @returns {number}
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0
    }

    /**
     * 获取所有事件名称
     * @returns {Array<string>}
     */
    getEventNames() {
        return Array.from(this.events.keys())
    }

    /**
     * 清空所有订阅
     */
    clear() {
        this.events.clear()
        this.onceEvents.clear()
        this.eventHistory.clear()
    }

    /**
     * 清空特定事件的历史
     * @param {string} event - 事件名称
     */
    clearHistory(event) {
        if (event) {
            this.eventHistory.delete(event)
        } else {
            this.eventHistory.clear()
        }
    }

    /**
     * 调试信息
     */
    debug() {
        console.group('EventBus Debug Info')
        console.log('Events:', this.getEventNames())
        this.events.forEach((listeners, event) => {
            console.log(`  ${event}: ${listeners.length} listeners`)
        })
        console.log('History:', this.eventHistory.size, 'events')
        console.groupEnd()
    }
}

// 创建单例
const eventBus = new EventBus()

export default eventBus
