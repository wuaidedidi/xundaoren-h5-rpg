/**
 * 寻道人 - 网络状态管理 Store
 * 管理网络连接状态、请求队列等
 */

import { createStore } from "./simpleStore.js";

const networkStore = createStore({
  state: () => ({
    // 连接状态
    isConnected: navigator.onLine,
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000, // 初始重连延迟（毫秒）

    // 请求队列
    pendingQueue: [],
    maxQueueSize: 100,

    // 请求状态
    pendingRequests: new Map(),
    requestTimeout: 30000, // 30秒超时

    // 网络质量
    latency: 0,
    packetLoss: 0,

    // Token状态
    token: null,
    tokenExpiry: null,
    isRefreshingToken: false,

    // 同步状态
    lastSyncTime: null,
    syncInterval: 60000, // 60秒同步一次

    // 错误统计
    errorCount: 0,
    lastErrorTime: null,
  }),

  getters: {
    // 是否可以发送请求
    canSendRequest: (state) => state.isConnected && !state.isReconnecting,

    // 队列长度
    queueLength: (state) => state.pendingQueue.length,

    // 是否有待处理请求
    hasPendingRequests: (state) => state.pendingQueue.length > 0,

    // Token是否有效
    isTokenValid: (state) => {
      if (!state.token || !state.tokenExpiry) return false;
      return Date.now() < state.tokenExpiry - 60000; // 提前1分钟认为过期
    },

    // 需要同步
    needsSync: (state) => {
      if (!state.lastSyncTime) return true;
      return Date.now() - state.lastSyncTime > state.syncInterval;
    },
  },

  actions: {
    // 设置连接状态
    setConnected(connected) {
      this.state.isConnected = connected;
      if (connected) {
        this.state.reconnectAttempts = 0;
        this.state.errorCount = 0;
      }
    },

    // 设置重连状态
    setReconnecting(reconnecting) {
      this.state.isReconnecting = reconnecting;
    },

    // 增加重连次数
    incrementReconnectAttempts() {
      this.state.reconnectAttempts++;
      // 指数退避
      this.state.reconnectDelay = Math.min(30000, 1000 * Math.pow(2, this.state.reconnectAttempts));
    },

    // 重置重连状态
    resetReconnectState() {
      this.state.isReconnecting = false;
      this.state.reconnectAttempts = 0;
      this.state.reconnectDelay = 1000;
    },

    // 添加请求到队列
    queueRequest(request) {
      if (this.state.pendingQueue.length >= this.state.maxQueueSize) {
        this.state.pendingQueue.shift(); // 移除最旧的请求
      }

      this.state.pendingQueue.push({
        ...request,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      });
    },

    // 从队列移除请求
    dequeueRequest(requestId) {
      this.state.pendingQueue = this.state.pendingQueue.filter((r) => r.id !== requestId);
    },

    // 获取队列中的请求
    getQueuedRequest() {
      return this.state.pendingQueue.shift();
    },

    // 清空队列
    clearQueue() {
      this.state.pendingQueue = [];
    },

    // 记录待处理请求
    addPendingRequest(requestId, abortController) {
      this.state.pendingRequests.set(requestId, {
        controller: abortController,
        timestamp: Date.now(),
      });
    },

    // 移除待处理请求
    removePendingRequest(requestId) {
      const request = this.state.pendingRequests.get(requestId);
      if (request && request.controller) {
        request.controller.abort();
      }
      this.state.pendingRequests.delete(requestId);
    },

    // 取消所有待处理请求
    cancelAllPendingRequests() {
      this.state.pendingRequests.forEach((request) => {
        if (request.controller) {
          request.controller.abort();
        }
      });
      this.state.pendingRequests.clear();
    },

    // 清理超时请求
    cleanupTimeoutRequests() {
      const now = Date.now();
      this.state.pendingRequests.forEach((request, id) => {
        if (now - request.timestamp > this.state.requestTimeout) {
          if (request.controller) {
            request.controller.abort();
          }
          this.state.pendingRequests.delete(id);
        }
      });
    },

    // 更新网络质量
    updateNetworkQuality(latency) {
      this.state.latency = latency;
    },

    // 设置Token
    setToken(token, expiresIn = 3600) {
      this.state.token = token;
      this.state.tokenExpiry = Date.now() + expiresIn * 1000;
    },

    // 清除Token
    clearToken() {
      this.state.token = null;
      this.state.tokenExpiry = null;
    },

    // 设置刷新Token状态
    setRefreshingToken(refreshing) {
      this.state.isRefreshingToken = refreshing;
    },

    // 更新同步时间
    updateSyncTime() {
      this.state.lastSyncTime = Date.now();
    },

    // 记录错误
    recordError() {
      this.state.errorCount++;
      this.state.lastErrorTime = Date.now();
    },

    // 重置错误统计
    resetErrorCount() {
      this.state.errorCount = 0;
    },

    // 初始化网络监听
    initNetworkListeners() {
      window.addEventListener("online", () => {
        this.setConnected(true);
      });

      window.addEventListener("offline", () => {
        this.setConnected(false);
      });
    },
  },
});

export default networkStore;
export const useNetworkStore = () => networkStore;
