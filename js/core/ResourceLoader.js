/**
 * 寻道人 - 资源加载管理器
 * 优化预加载策略：首屏资源优先，音乐特效按需加载
 * 支持加载优先级、进度追踪、缓存管理
 */

import EventBus from './EventBus.js'

// 资源优先级定义
const PRIORITY = {
    CRITICAL: 1,    // 首屏必需，立即加载
    HIGH: 2,        // 核心资源，优先加载
    MEDIUM: 3,      // 一般资源，按需加载
    LOW: 4,         // 延迟加载
    ON_DEMAND: 5    // 按需加载（音乐、特效等）
}

// 资源类型
const RESOURCE_TYPE = {
    SCRIPT: 'script',
    STYLE: 'style',
    IMAGE: 'image',
    AUDIO: 'audio',
    MODEL: 'model',
    DATA: 'data'
}

class ResourceLoader {
    constructor() {
        // 资源缓存
        this.cache = new Map()
        // 加载队列
        this.queue = []
        // 正在加载
        this.loading = new Set()
        // 最大并发数
        this.maxConcurrent = 6
        // 当前并发数
        this.currentConcurrent = 0
        // 总资源数
        this.totalResources = 0
        // 已加载资源数
        this.loadedResources = 0
        // 是否正在批量加载
        this.isBatchLoading = false
        // 资源基础路径
        this.basePath = ''
    }

    /**
     * 设置基础路径
     */
    setBasePath(path) {
        this.basePath = path.replace(/\/$/, '')
    }

    /**
     * 注册资源
     * @param {string} id - 资源ID
     * @param {string} url - 资源URL
     * @param {string} type - 资源类型
     * @param {number} priority - 优先级
     * @param {Object} options - 额外选项
     */
    register(id, url, type = RESOURCE_TYPE.IMAGE, priority = PRIORITY.MEDIUM, options = {}) {
        // 如果已存在，先移除
        this.unregister(id)

        const resource = {
            id,
            url: this.resolveUrl(url),
            type,
            priority,
            options: {
                lazy: false,
                cache: true,
                retryCount: 3,
                ...options
            },
            status: 'pending', // pending, loading, loaded, error
            data: null,
            error: null,
            loadTime: 0
        }

        this.cache.set(id, resource)

        // 高优先级资源立即加载
        if (priority <= PRIORITY.HIGH && !options.lazy) {
            this.load(id)
        }

        return resource
    }

    /**
     * 批量注册资源
     * @param {Array} resources - 资源数组
     */
    registerBatch(resources) {
        resources.forEach(res => {
            this.register(
                res.id,
                res.url,
                res.type || RESOURCE_TYPE.IMAGE,
                res.priority || PRIORITY.MEDIUM,
                res.options || {}
            )
        })
    }

    /**
     * 注销资源
     */
    unregister(id) {
        const resource = this.cache.get(id)
        if (resource) {
            // 释放资源
            this.releaseResource(resource)
            this.cache.delete(id)
        }
    }

    /**
     * 解析URL
     */
    resolveUrl(url) {
        if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
            return url
        }
        return `${this.basePath}/${url.replace(/^\//, '')}`
    }

    /**
     * 加载单个资源
     */
    async load(id) {
        const resource = this.cache.get(id)
        if (!resource) {
            throw new Error(`资源未注册: ${id}`)
        }

        // 已加载直接返回
        if (resource.status === 'loaded') {
            return resource.data
        }

        // 正在加载中，等待完成
        if (resource.status === 'loading') {
            return this.waitForLoad(id)
        }

        // 开始加载
        return this.doLoad(resource)
    }

    /**
     * 实际加载资源
     */
    async doLoad(resource) {
        resource.status = 'loading'
        this.loading.add(resource.id)
        this.currentConcurrent++

        const startTime = performance.now()

        try {
            let data

            switch (resource.type) {
                case RESOURCE_TYPE.IMAGE:
                    data = await this.loadImage(resource.url, resource.options)
                    break
                case RESOURCE_TYPE.AUDIO:
                    data = await this.loadAudio(resource.url, resource.options)
                    break
                case RESOURCE_TYPE.SCRIPT:
                    data = await this.loadScript(resource.url, resource.options)
                    break
                case RESOURCE_TYPE.STYLE:
                    data = await this.loadStyle(resource.url, resource.options)
                    break
                case RESOURCE_TYPE.MODEL:
                    data = await this.loadModel(resource.url, resource.options)
                    break
                case RESOURCE_TYPE.DATA:
                    data = await this.loadData(resource.url, resource.options)
                    break
                default:
                    data = await this.loadGeneric(resource.url, resource.options)
            }

            resource.data = data
            resource.status = 'loaded'
            resource.loadTime = performance.now() - startTime

            EventBus.emit('resource:loaded', {
                id: resource.id,
                type: resource.type,
                loadTime: resource.loadTime
            })

            return data
        } catch (error) {
            resource.status = 'error'
            resource.error = error

            // 重试逻辑
            if (resource.options.retryCount > 0) {
                resource.options.retryCount--
                await this.delay(1000)
                return this.doLoad(resource)
            }

            EventBus.emit('resource:error', {
                id: resource.id,
                error: error.message
            })

            throw error
        } finally {
            this.loading.delete(resource.id)
            this.currentConcurrent--
            this.processQueue()
        }
    }

    /**
     * 等待资源加载完成
     */
    waitForLoad(id) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const resource = this.cache.get(id)
                if (!resource) {
                    clearInterval(checkInterval)
                    reject(new Error(`资源不存在: ${id}`))
                    return
                }

                if (resource.status === 'loaded') {
                    clearInterval(checkInterval)
                    resolve(resource.data)
                } else if (resource.status === 'error') {
                    clearInterval(checkInterval)
                    reject(resource.error)
                }
            }, 100)
        })
    }

    /**
     * 加载图片
     */
    loadImage(url, options) {
        return new Promise((resolve, reject) => {
            const img = new Image()

            if (options.crossOrigin) {
                img.crossOrigin = options.crossOrigin
            }

            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`图片加载失败: ${url}`))

            img.src = url
        })
    }

    /**
     * 加载音频
     */
    loadAudio(url, options) {
        return new Promise((resolve, reject) => {
            const audio = new Audio()

            audio.oncanplaythrough = () => resolve(audio)
            audio.onerror = () => reject(new Error(`音频加载失败: ${url}`))

            // 按需加载时不自动播放
            if (options.preload) {
                audio.preload = options.preload
            }

            audio.src = url
        })
    }

    /**
     * 加载脚本
     */
    loadScript(url, options) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = url
            script.async = options.async !== false

            script.onload = () => resolve(script)
            script.onerror = () => reject(new Error(`脚本加载失败: ${url}`))

            document.head.appendChild(script)
        })
    }

    /**
     * 加载样式
     */
    loadStyle(url, options) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = url

            link.onload = () => resolve(link)
            link.onerror = () => reject(new Error(`样式加载失败: ${url}`))

            document.head.appendChild(link)
        })
    }

    /**
     * 加载模型（Three.js）
     */
    async loadModel(url, options) {
        // 这里可以根据需要集成 GLTFLoader、OBJLoader 等
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`模型加载失败: ${url}`)
        }
        return await response.arrayBuffer()
    }

    /**
     * 加载数据（JSON等）
     */
    async loadData(url, options) {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`数据加载失败: ${url}`)
        }

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        }

        return await response.text()
    }

    /**
     * 通用加载
     */
    async loadGeneric(url, options) {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`资源加载失败: ${url}`)
        }
        return response
    }

    /**
     * 批量加载（按优先级排序）
     */
    async loadBatch(priorityThreshold = PRIORITY.MEDIUM) {
        if (this.isBatchLoading) return

        this.isBatchLoading = true
        this.totalResources = 0
        this.loadedResources = 0

        // 获取需要加载的资源，按优先级排序
        const resourcesToLoad = Array.from(this.cache.values())
            .filter(r => r.priority <= priorityThreshold && r.status === 'pending')
            .sort((a, b) => a.priority - b.priority)

        this.totalResources = resourcesToLoad.length

        EventBus.emit('resource:batchStart', {
            total: this.totalResources
        })

        try {
            // 按优先级分组加载
            const priorityGroups = this.groupByPriority(resourcesToLoad)

            for (const [priority, resources] of priorityGroups) {
                EventBus.emit('resource:priorityGroupStart', {
                    priority,
                    count: resources.length
                })

                // 并发加载同优先级资源
                await Promise.all(
                    resources.map(async (resource) => {
                        try {
                            await this.load(resource.id)
                            this.loadedResources++
                            this.updateProgress()
                        } catch (error) {
                            console.warn(`资源加载失败: ${resource.id}`, error)
                        }
                    })
                )

                EventBus.emit('resource:priorityGroupComplete', {
                    priority,
                    count: resources.length
                })
            }
        } finally {
            this.isBatchLoading = false
            EventBus.emit('resource:batchComplete', {
                loaded: this.loadedResources,
                total: this.totalResources
            })
        }
    }

    /**
     * 按优先级分组
     */
    groupByPriority(resources) {
        const groups = new Map()

        resources.forEach(resource => {
            if (!groups.has(resource.priority)) {
                groups.set(resource.priority, [])
            }
            groups.get(resource.priority).push(resource)
        })

        return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]))
    }

    /**
     * 更新加载进度
     */
    updateProgress() {
        const progress = this.totalResources > 0
            ? Math.round((this.loadedResources / this.totalResources) * 100)
            : 0

        EventBus.emit('resource:progress', {
            loaded: this.loadedResources,
            total: this.totalResources,
            progress
        })
    }

    /**
     * 按需加载资源（延迟加载）
     */
    async loadOnDemand(id) {
        const resource = this.cache.get(id)
        if (!resource) {
            throw new Error(`资源未注册: ${id}`)
        }

        // 标记为高优先级并立即加载
        resource.priority = PRIORITY.HIGH
        return this.load(id)
    }

    /**
     * 预加载场景资源
     */
    async preloadScene(sceneId, resourceIds) {
        EventBus.emit('resource:scenePreloadStart', { sceneId })

        const promises = resourceIds.map(id => {
            const resource = this.cache.get(id)
            if (resource) {
                resource.priority = PRIORITY.HIGH
                return this.load(id).catch(err => {
                    console.warn(`场景资源预加载失败: ${id}`, err)
                })
            }
            return Promise.resolve()
        })

        await Promise.all(promises)

        EventBus.emit('resource:scenePreloadComplete', { sceneId })
    }

    /**
     * 释放资源
     */
    releaseResource(resource) {
        if (resource.data) {
            // 图片资源释放
            if (resource.type === RESOURCE_TYPE.IMAGE && resource.data.src) {
                resource.data.src = ''
            }
            // 音频资源释放
            if (resource.type === RESOURCE_TYPE.AUDIO && resource.data.pause) {
                resource.data.pause()
                resource.data.src = ''
            }
            resource.data = null
        }
    }

    /**
     * 清理缓存
     */
    clearCache(keepIds = []) {
        const keepSet = new Set(keepIds)

        this.cache.forEach((resource, id) => {
            if (!keepSet.has(id)) {
                this.releaseResource(resource)
                this.cache.delete(id)
            }
        })
    }

    /**
     * 获取资源
     */
    get(id) {
        const resource = this.cache.get(id)
        return resource ? resource.data : null
    }

    /**
     * 获取资源状态
     */
    getStatus(id) {
        const resource = this.cache.get(id)
        return resource ? resource.status : null
    }

    /**
     * 检查资源是否已加载
     */
    isLoaded(id) {
        const resource = this.cache.get(id)
        return resource && resource.status === 'loaded'
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * 处理加载队列
     */
    processQueue() {
        if (this.currentConcurrent >= this.maxConcurrent) return

        // 获取待加载的高优先级资源
        const pendingResources = Array.from(this.cache.values())
            .filter(r => r.status === 'pending')
            .sort((a, b) => a.priority - b.priority)

        while (this.currentConcurrent < this.maxConcurrent && pendingResources.length > 0) {
            const resource = pendingResources.shift()
            this.load(resource.id)
        }
    }

    /**
     * 获取加载统计
     */
    getStats() {
        const all = Array.from(this.cache.values())
        return {
            total: all.length,
            loaded: all.filter(r => r.status === 'loaded').length,
            loading: all.filter(r => r.status === 'loading').length,
            pending: all.filter(r => r.status === 'pending').length,
            error: all.filter(r => r.status === 'error').length,
            cacheSize: this.calculateCacheSize()
        }
    }

    /**
     * 估算缓存大小
     */
    calculateCacheSize() {
        let size = 0
        this.cache.forEach(resource => {
            if (resource.data) {
                if (resource.data instanceof ArrayBuffer) {
                    size += resource.data.byteLength
                } else if (resource.data instanceof Image) {
                    // 图片大小估算
                    size += resource.data.width * resource.data.height * 4
                }
            }
        })
        return size
    }
}

// 导出单例和常量
export const ResourcePriority = PRIORITY
export const ResourceType = RESOURCE_TYPE
export default new ResourceLoader()
