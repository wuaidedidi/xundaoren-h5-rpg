export function createStore(state, actions, options = {}) {
  const strict = options.strict || false;
  const listeners = new Set();
  let isUpdating = false;

  function createDeepProxy(obj, parentProp = null) {
    return new Proxy(obj, {
      set(target, prop, value) {
        if (strict && !isUpdating) {
          console.warn("[Store] 严格模式：禁止在Action外部直接修改状态！");
          return false;
        }
        const oldValue = target[prop];
        target[prop] = value;
        if (oldValue !== value) {
          notify({ prop: parentProp || prop, key: parentProp ? prop : null, oldValue, newValue: value });
        }
        return true;
      },
      get(target, prop) {
        if (typeof target[prop] === "object" && target[prop] !== null) {
          return createDeepProxy(target[prop], parentProp || prop);
        }
        return target[prop];
      },
      deleteProperty(target, prop) {
        if (strict && !isUpdating) {
          console.warn("[Store] 严格模式：禁止在Action外部直接修改状态！");
          return false;
        }
        const oldValue = target[prop];
        const result = delete target[prop];
        if (result) {
          notify({ prop: parentProp || prop, key: parentProp ? prop : null, oldValue, newValue: undefined });
        }
        return result;
      },
    });
  }

  const proxy = createDeepProxy(state);

  function notify(change) {
    listeners.forEach((listener) => listener(change, proxy));
  }

  const boundActions = {};
  for (const key in actions) {
    boundActions[key] = async (...args) => {
      isUpdating = true;
      try {
        const result = await actions[key](proxy, ...args);
        return result;
      } finally {
        isUpdating = false;
      }
    };
  }

  return {
    state: proxy,
    actions: boundActions,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    $patch(updater) {
      isUpdating = true;
      try {
        if (typeof updater === "function") {
          updater(proxy);
        } else {
          Object.assign(proxy, updater);
        }
      } finally {
        isUpdating = false;
      }
    },
  };
}
