import { networkManager } from "./NetworkManager.js";
import { eventBus } from "../utils/EventBus.js";

export class ApiInterceptor {
    constructor() {
        this.isRefreshingToken = false;
        this.refreshSubscribers = [];
        this.init();
    }

    static getInstance() {
        if (!ApiInterceptor.instance) {
            ApiInterceptor.instance = new ApiInterceptor();
        }
        return ApiInterceptor.instance;
    }

    init() {
        networkManager.addRequestInterceptor(this.requestInterceptor.bind(this));
        networkManager.addResponseInterceptor(this.responseInterceptor.bind(this));
    }

    async requestInterceptor(request) {
        try {
            console.log(`[API] 请求: ${request.method} ${request.url}`);
            eventBus.emit('api:request', { url: request.url, method: request.method });
            return request;
        } catch (e) {
            console.warn('[API] 请求拦截异常:', e);
            return request;
        }
    }

    async responseInterceptor(result) {
        const { response } = result;

        if (response.status === 401) {
            return this.handleTokenRefresh(result);
        }

        if (!response.ok) {
            return this.handleErrorResponse(result);
        }

        try {
            const data = await response.json();
            eventBus.emit('api:response', { url: response.url, status: response.status, data });
            return { ...result, data };
        } catch (e) {
            return result;
        }
    }

    async handleTokenRefresh(result) {
        const originalRequest = result.request;
        
        if (!this.isRefreshingToken) {
            this.isRefreshingToken = true;
            try {
                const newToken = await this.refreshToken();
                networkManager.setToken(newToken);
                this.isRefreshingToken = false;
                this.onRefreshToken(newToken);
                return this.retryRequest(originalRequest);
            } catch (e) {
                this.isRefreshingToken = false;
                this.onRefreshTokenFailed(e);
                throw e;
            }
        }

        return new Promise((resolve) => {
            this.refreshSubscribers.push((token) => {
                resolve(this.retryRequest({ ...originalRequest, token }));
            });
        });
    }

    async refreshToken() {
        console.log('[API] 正在刷新Token');
        eventBus.emit('api:token:refreshing');
        
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('无可用的刷新令牌');
        }

        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token刷新失败');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        
        return data.accessToken;
    }

    onRefreshToken(token) {
        console.log('[API] Token刷新成功');
        eventBus.emit('api:token:refreshed', { token });
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    onRefreshTokenFailed(error) {
        console.error('[API] Token刷新失败:', error);
        eventBus.emit('api:token:failed', { error });
        networkManager.clearToken();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.refreshSubscribers = [];
    }

    async retryRequest(request) {
        console.log('[API] 重试请求:', request.url);
        return networkManager.executeRequest(request);
    }

    async handleErrorResponse(result) {
        const { response } = result;
        let errorData = {};

        try {
            errorData = await response.json();
        } catch (e) {}

        const error = {
            status: response.status,
            statusText: response.statusText,
            message: errorData.message || '请求失败',
            code: errorData.code,
            data: errorData
        };

        console.error('[API] 请求错误:', error);
        eventBus.emit('api:error', error);

        switch (response.status) {
            case 400:
                this.showErrorMessage('请求参数错误');
                break;
            case 403:
                this.showErrorMessage('无权限访问');
                break;
            case 404:
                this.showErrorMessage('请求资源不存在');
                break;
            case 500:
                this.showErrorMessage('服务器内部错误');
                break;
            case 502:
            case 503:
            case 504:
                this.showErrorMessage('服务器暂时不可用');
                break;
            default:
                if (response.status >= 500) {
                    this.showErrorMessage('服务器错误');
                }
        }

        throw error;
    }

    showErrorMessage(message) {
        eventBus.emit('game:message', { type: 'error', message });
    }

    static setupGlobalErrorHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.warn('[API] 未处理的Promise异常:', event.reason);
            event.preventDefault();
        });

        window.addEventListener('error', (event) => {
            console.error('[API] 全局错误:', event.error);
        });
    }
}

ApiInterceptor.setupGlobalErrorHandler();

export const apiInterceptor = ApiInterceptor.getInstance();
