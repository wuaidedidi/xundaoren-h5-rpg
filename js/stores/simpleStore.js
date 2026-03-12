/**
 * 寻道人 - 简易状态管理
 * 不依赖 Vue/Pinia，纯原生实现
 * 支持订阅监听，严格模式
 */

class SimpleStore {
  constructor(options) {
    this._state = options.state ? options.state() : {};
    this._getters = options.getters || {};
    this._actions = options.actions || {};
    this._subscribers = [];
    this._isStrict = true;
    this._isCommitting = false;

    // 包装 getters
    this.getters = {};
    this._wrapGetters();

    // 创建响应式 state
    this.state = this._createReactive(this._state);
  }

  /**
   * 创建响应式对象
   */
  _createReactive(obj, path = "") {
    const store = this;

    return new Proxy(obj, {
      get(target, key) {
        const value = target[key];
        if (typeof value === "object" && value !== null) {
          return store._createReactive(value, path ? `${path}.${key}` : key);
        }
        return value;
      },

      set(target, key, value) {
        const fullPath = path ? `${path}.${key}` : key;

        // 严格模式检查
        if (store._isStrict && !store._isCommitting) {
          console.error(`[SimpleStore] 错误：不能在 Action 外修改状态 "${fullPath}"`);
          console.error("请使用 Action 来修改状态");
          return false;
        }

        const oldValue = target[key];
        target[key] = value;

        // 通知订阅者
        if (oldValue !== value) {
          store._notify(fullPath, value, oldValue);
        }

        return true;
      },
    });
  }

  /**
   * 包装 getters
   */
  _wrapGetters() {
    Object.keys(this._getters).forEach((key) => {
      Object.defineProperty(this.getters, key, {
        get: () => this._getters[key](this.state),
      });
    });
  }

  /**
   * 通知订阅者
   */
  _notify(path, newValue, oldValue) {
    this._subscribers.forEach((callback) => {
      try {
        callback(path, newValue, oldValue);
      } catch (error) {
        console.error("[SimpleStore] 订阅者错误:", error);
      }
    });
  }

  /**
   * 订阅状态变化
   */
  subscribe(callback) {
    this._subscribers.push(callback);
    return () => {
      const index = this._subscribers.indexOf(callback);
      if (index > -1) {
        this._subscribers.splice(index, 1);
      }
    };
  }

  /**
   * 调用 Action
   */
  dispatch(actionName, ...args) {
    if (!this._actions[actionName]) {
      console.error(`[SimpleStore] Action "${actionName}" 不存在`);
      return Promise.reject(new Error(`Action "${actionName}" not found`));
    }

    // 设置提交标志，允许状态修改
    this._isCommitting = true;

    try {
      const result = this._actions[actionName].call(this, ...args);
      this._isCommitting = false;
      return Promise.resolve(result);
    } catch (error) {
      this._isCommitting = false;
      return Promise.reject(error);
    }
  }

  /**
   * 批量修改状态（绕过严格模式检查）
   */
  patch(patcher) {
    this._isCommitting = true;
    try {
      if (typeof patcher === "function") {
        patcher(this.state);
      } else {
        Object.assign(this.state, patcher);
      }
    } finally {
      this._isCommitting = false;
    }
  }

  /**
   * 重置状态
   */
  reset() {
    this._isCommitting = true;
    try {
      Object.keys(this._state).forEach((key) => {
        delete this.state[key];
      });
      const newState = this._state.constructor ? new this._state.constructor() : {};
      Object.assign(this.state, newState);
    } finally {
      this._isCommitting = false;
    }
  }
}

/**
 * 创建 Store 工厂函数
 */
export function createStore(options) {
  return new SimpleStore(options);
}

export default SimpleStore;
