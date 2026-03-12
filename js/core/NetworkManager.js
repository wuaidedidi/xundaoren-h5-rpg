import { eventBus } from "../utils/EventBus.js";

export class NetworkManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.retryAttempts = 0;
        this.maxRetryAttempts = 5;
        this.retryDelay = 1000;
        this.offlineQueue = [];
        this.isProcessingQueue = false;
        this.maxQueueSize = 100;
        this.reconnectTimer = null;
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.token = null;
    }

    static getInstance() {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }

    init() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        this.updateNetworkStatus();
        eventBus.emit('network:init', { isOnline: this.isOnline });
    }

    updateNetworkStatus() {
        this.isOnline = navigator.onLine;
        eventBus.emit('network:status', { isOnline: this.isOnline });
    }

    handleOnline() {
        console.log('[Network] 网络已连接');
        this.isOnline = true;
        this.retryAttempts = 0;
        eventBus.emit('network:online');
        this.processOfflineQueue();
    }

    handleOffline() {
        console.log('[Network] 网络已断开');
        this.isOnline = false;
        eventBus.emit('network:offline');
        this.startReconnectTimer();
    }

    startReconnectTimer() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setInterval(() => {
            if (navigator.onLine) {
                this.handleOnline();
                clearInterval(this.reconnectTimer);
                this.reconnectTimer = null;
            } else {
                console.log('[Network] 尝试重连...');
                eventBus.emit('network:reconnecting');
            }
        }, 3000);
    }

    addToQueue(request) {
        if (this.offlineQueue.length >= this.maxQueueSize) {
            this.offlineQueue.shift();
        }
        this.offlineQueue.push({
            ...request,
            timestamp: Date.now()
        });
        eventBus.emit('network:queued', { queueSize: this.offlineQueue.length });
    }

    async processOfflineQueue() {
        if (this.isProcessingQueue || this.offlineQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        console.log(`[Network] 开始处理离线队列，共${this.offlineQueue.length}个请求`);

        while (this.offlineQueue.length > 0 && this.isOnline) {
            const request = this.offlineQueue.shift();
            try {
                await this.executeRequest(request);
                eventBus.emit('network:queue:success', request);
            } catch (e) {
                console.warn('[Network] 离线请求执行失败:', e);
                if (request.retryCount < this.maxRetryAttempts) {
                    request.retryCount = (request.retryCount || 0) + 1;
                    this.offlineQueue.push(request);
                } else {
                    eventBus.emit('network:queue:failed', { request, error: e });
                }
            }
        }

        this.isProcessingQueue = false;
        eventBus.emit('network:queue:processed', { remaining: this.offlineQueue.length });
    }

    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    setToken(token) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    async request(url, options = {}) {
        const request = {
            url,
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: options.body,
            retryCount: 0,
            ...options
        };

        if (!this.isOnline) {
            this.addToQueue(request);
            throw new Error('网络已断开，请求已加入离线队列');
        }

        return this.executeWithRetry(request);
    }

    async executeWithRetry(request) {
        while (request.retryCount <= this.maxRetryAttempts) {
            try {
                return await this.executeRequest(request);
            } catch (e) {
                request.retryCount++;
                if (request.retryCount > this.maxRetryAttempts) {
                    throw e;
                }
                const delay = this.retryDelay * Math.pow(2, request.retryCount - 1);
                console.log(`[Network] 请求失败，${delay}ms后重试 (${request.retryCount}/${this.maxRetryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async executeRequest(request) {
        let finalRequest = { ...request };

        for (const interceptor of this.requestInterceptors) {
            try {
                finalRequest = await interceptor(finalRequest);
            } catch (e) {
                console.warn('[Network] 请求拦截器执行失败:', e);
            }
        }

        if (this.token) {
            finalRequest.headers = {
                ...finalRequest.headers,
                'Authorization': `Bearer ${this.token}`
            };
        }

        try {
            const response = await fetch(finalRequest.url, {
                method: finalRequest.method,
                headers: finalRequest.headers,
                body: finalRequest.body ? JSON.stringify(finalRequest.body) : undefined
            });

            let finalResponse = { response, data: null };

            for (const interceptor of this.responseInterceptors) {
                try {
                    finalResponse = await interceptor(finalResponse);
                } catch (e) {
                    console.warn('[Network] 响应拦截器执行失败:', e);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return finalResponse.data || await response.json();
        } catch (e) {
            if (e.name === 'TypeError' && e.message.includes('fetch')) {
                this.handleOffline();
                this.addToQueue(request);
                throw new Error('网络请求失败，已加入离线队列');
            }
            throw e;
        }
    }

    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', body: data });
    }

    put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', body: data });
    }

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    clearQueue() {
        this.offlineQueue = [];
    }

    getQueueSize() {
        return this.offlineQueue.length;
    }
}

export const networkManager = NetworkManager.getInstance();
