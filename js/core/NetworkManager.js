/**
 * 寻道人 - 网络管理模块
 * 封装断线重连、请求重试、操作队列
 * 所有异步请求必须加 try-catch 防卡死
 */

import { useNetworkStore } from "../stores/networkStore.js";
import EventBus from "./EventBus.js";

class NetworkManager {
  constructor() {
    this.store = null;
    this.baseURL = ""; // API 基础地址
    this.defaultTimeout = 30000;
    this.retryDelay = 1000;
    this.maxRetries = 3;
    this.isInitialized = false;

    // 重连定时器
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 30000; // 30秒心跳

    // 请求拦截器
    this.requestInterceptors = [];
    // 响应拦截器
    this.responseInterceptors = [];
  }

  /**
   * 初始化网络管理器
   */
  init(baseURL = "") {
    if (this.isInitialized) return;

    this.baseURL = baseURL;
    this.store = useNetworkStore();

    // 设置网络状态监听
    this._setupNetworkListeners();

    // 启动心跳检测
    this.startHeartbeat();

    // 监听网络恢复
    window.addEventListener("online", () => {
      this.handleNetworkRestore();
    });

    this.isInitialized = true;
    console.log("网络管理器初始化完成");
  }

  /**
   * 设置网络状态监听
   */
  _setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.store.dispatch("setConnected", true);
    });

    window.addEventListener("offline", () => {
      this.store.dispatch("setConnected", false);
    });
  }

  /**
   * 处理网络恢复
   */
  async handleNetworkRestore() {
    console.log("网络已恢复，开始处理队列...");
    this.store.dispatch("setConnected", true);
    EventBus.emit("network:restored");

    // 处理队列中的请求
    await this.processQueue();
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnection();
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 检查连接状态
   */
  async checkConnection() {
    try {
      const startTime = Date.now();
      await this.request("/ping", { method: "HEAD", timeout: 5000 });
      const latency = Date.now() - startTime;
      this.store.dispatch("updateNetworkQuality", latency);
    } catch (error) {
      // 心跳失败，可能是网络问题
      console.warn("心跳检测失败:", error.message);
    }
  }

  /**
   * 发起请求（带重试机制）
   * @param {string} url - 请求地址
   * @param {Object} options - 请求选项
   * @returns {Promise<any>}
   */
  async request(url, options = {}) {
    // 确保已初始化
    if (!this.isInitialized) {
      this.init();
    }

    const requestId = this.generateRequestId();
    const fullURL = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    const config = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
      retries: this.maxRetries,
      ...options,
    };

    // 添加认证Token
    if (this.store.state.token) {
      config.headers["Authorization"] = `Bearer ${this.store.state.token}`;
    }

    // 执行请求拦截器
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      try {
        finalConfig = await interceptor(finalConfig);
      } catch (error) {
        console.error("请求拦截器错误:", error);
        throw error;
      }
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, finalConfig.timeout);

    this.store.dispatch("addPendingRequest", requestId, controller);

    try {
      const response = await fetch(fullURL, {
        ...finalConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.store.dispatch("removePendingRequest", requestId);

      // 处理响应
      let result = await this.handleResponse(response);

      // 执行响应拦截器
      for (const interceptor of this.responseInterceptors) {
        try {
          result = await interceptor(result, response);
        } catch (error) {
          console.error("响应拦截器错误:", error);
          throw error;
        }
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      this.store.dispatch("removePendingRequest", requestId);

      // 判断是否需要重试
      if (config.retries > 0 && this.shouldRetry(error)) {
        console.warn(`请求失败，${config.retries}秒后重试...`);
        await this.delay(this.retryDelay);
        return this.request(url, {
          ...options,
          retries: config.retries - 1,
        });
      }

      // 网络错误时加入队列
      if (this.isNetworkError(error) && config.queueOnFailure !== false) {
        this.store.dispatch("queueRequest", {
          id: requestId,
          url: fullURL,
          options: config,
          timestamp: Date.now(),
        });
        EventBus.emit("network:queued", { url, error: error.message });
      }

      throw error;
    }
  }

  /**
   * 处理响应
   */
  async handleResponse(response) {
    // Token 过期
    if (response.status === 401) {
      await this.handleTokenExpired();
      throw new Error("Token 已过期");
    }

    // 其他错误状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // 解析响应数据
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * 处理 Token 过期
   */
  async handleTokenExpired() {
    if (this.store.state.isRefreshingToken) {
      // 等待刷新完成
      await this.waitForTokenRefresh();
      return;
    }

    this.store.dispatch("setRefreshingToken", true);

    try {
      // 尝试刷新 Token
      const newToken = await this.refreshToken();
      this.store.dispatch("setToken", newToken);
      EventBus.emit("auth:tokenRefreshed", newToken);
    } catch (error) {
      console.error("Token 刷新失败:", error);
      this.store.dispatch("clearToken");
      EventBus.emit("auth:logout");
    } finally {
      this.store.dispatch("setRefreshingToken", false);
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken() {
    // 这里实现实际的 Token 刷新逻辑
    // 例如调用 /auth/refresh 接口
    throw new Error("Token 刷新未实现");
  }

  /**
   * 等待 Token 刷新完成
   */
  async waitForTokenRefresh() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.store.state.isRefreshingToken) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(error) {
    // 网络错误、超时错误可以重试
    if (error.name === "TypeError" || error.name === "AbortError") {
      return true;
    }

    // 5xx 服务器错误可以重试
    if (error.message && error.message.includes("HTTP 5")) {
      return true;
    }

    return false;
  }

  /**
   * 判断是否为网络错误
   */
  isNetworkError(error) {
    return error.name === "TypeError" || error.name === "AbortError" || !navigator.onLine;
  }

  /**
   * 处理请求队列
   */
  async processQueue() {
    while (this.store.getters.hasPendingRequests && navigator.onLine) {
      const request = this.store.dispatch("getQueuedRequest");
      if (!request) break;

      try {
        await this.request(request.url, {
          ...request.options,
          queueOnFailure: false, // 不再加入队列，避免无限循环
        });
        console.log("队列请求成功:", request.url);
      } catch (error) {
        console.error("队列请求失败:", error);
        // 失败的请求不再重新加入队列
      }
    }
  }

  /**
   * 开始断线重连
   */
  startReconnect() {
    if (this.store.state.isReconnecting) return;

    this.store.dispatch("setReconnecting", true);
    EventBus.emit("network:reconnecting");

    const attemptReconnect = async () => {
      if (this.store.state.reconnectAttempts >= this.store.state.maxReconnectAttempts) {
        console.error("重连次数超限");
        this.store.dispatch("setReconnecting", false);
        EventBus.emit("network:reconnectFailed");
        return;
      }

      this.store.dispatch("incrementReconnectAttempts");
      console.log(`第 ${this.store.state.reconnectAttempts} 次重连尝试...`);

      try {
        await this.checkConnection();
        this.store.dispatch("resetReconnectState");
        this.handleNetworkRestore();
      } catch (error) {
        // 继续重试
        this.reconnectTimer = setTimeout(attemptReconnect, this.store.state.reconnectDelay);
      }
    };

    attemptReconnect();
  }

  /**
   * 停止重连
   */
  stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.store.dispatch("setReconnecting", false);
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * GET 请求
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: "GET" });
  }

  /**
   * POST 请求
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: "DELETE" });
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 销毁
   */
  destroy() {
    this.stopHeartbeat();
    this.stopReconnect();
    this.store.dispatch("cancelAllPendingRequests");
    this.store.dispatch("clearQueue");
  }
}

export default new NetworkManager();
