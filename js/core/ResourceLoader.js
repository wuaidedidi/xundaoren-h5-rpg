import { eventBus } from "../utils/EventBus.js";

export class ResourceLoader {
    constructor() {
        this.resources = new Map();
        this.priorityQueue = { high: [], medium: [], low: [] };
        this.loaded = 0;
        this.total = 0;
        this.isLoading = false;
        this.maxConcurrent = 3;
        this.audioContext = null;
    }

    static getInstance() {
        if (!ResourceLoader.instance) {
            ResourceLoader.instance = new ResourceLoader();
        }
        return ResourceLoader.instance;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[Resource] Web Audio API不支持:', e);
        }
    }

    add(key, url, priority = 'medium', type = 'auto') {
        if (type === 'auto') {
            type = this.detectType(url);
        }

        const item = { key, url, type, priority };
        
        switch (priority) {
            case 'high': this.priorityQueue.high.push(item); break;
            case 'low': this.priorityQueue.low.push(item); break;
            default: this.priorityQueue.medium.push(item);
        }

        this.total++;
        return this;
    }

    detectType(url) {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
        if (['json'].includes(ext)) return 'json';
        if (['glb', 'gltf', 'bin'].includes(ext)) return 'model';
        return 'text';
    }

    async loadFirstScreen() {
        console.log('[Resource] 开始加载首屏资源');
        eventBus.emit('resource:loading:firstScreen');

        const highPriority = [...this.priorityQueue.high];
        this.priorityQueue.high = [];

        await this.loadGroup(highPriority, 'high');
        eventBus.emit('resource:loaded:firstScreen');
        console.log('[Resource] 首屏资源加载完成');
    }

    async loadCore() {
        console.log('[Resource] 开始加载核心资源');
        eventBus.emit('resource:loading:core');

        const mediumPriority = [...this.priorityQueue.medium];
        this.priorityQueue.medium = [];

        await this.loadGroup(mediumPriority, 'medium');
        eventBus.emit('resource:loaded:core');
        console.log('[Resource] 核心资源加载完成');
    }

    async loadBackground() {
        console.log('[Resource] 开始加载后台资源');
        eventBus.emit('resource:loading:background');

        const lowPriority = [...this.priorityQueue.low];
        this.priorityQueue.low = [];

        await this.loadGroup(lowPriority, 'low');
        eventBus.emit('resource:loaded:background');
        console.log('[Resource] 后台资源加载完成');
    }

    async loadAll() {
        await this.loadFirstScreen();
        await this.loadCore();
        await this.loadBackground();
    }

    async loadGroup(items, groupName) {
        if (items.length === 0) return;

        const chunks = this.chunkArray(items, this.maxConcurrent);
        
        for (const chunk of chunks) {
            await Promise.all(chunk.map(item => this.loadItem(item)));
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async loadItem(item) {
        if (this.resources.has(item.key)) {
            return this.resources.get(item.key);
        }

        try {
            let resource;
            switch (item.type) {
                case 'image':
                    resource = await this.loadImage(item.url);
                    break;
                case 'audio':
                    resource = await this.loadAudio(item.url);
                    break;
                case 'json':
                    resource = await this.loadJson(item.url);
                    break;
                default:
                    resource = await fetch(item.url).then(r => r.text());
            }

            this.resources.set(item.key, resource);
            this.loaded++;
            this.emitProgress();
            eventBus.emit('resource:loaded:item', { key: item.key, url: item.url });
            return resource;
        } catch (e) {
            console.warn(`[Resource] 加载失败: ${item.url}`, e);
            this.loaded++;
            this.emitProgress();
            eventBus.emit('resource:error', { key: item.key, url: item.url, error: e });
            return null;
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = url;
        });
    }

    loadAudioBuffer(url) {
        if (!this.audioContext) return this.loadAudio(url);
        
        return fetch(url)
            .then(r => r.arrayBuffer())
            .then(buffer => this.audioContext.decodeAudioData(buffer));
    }

    loadJson(url) {
        return fetch(url).then(r => r.json());
    }

    get(key) {
        return this.resources.get(key);
    }

    has(key) {
        return this.resources.has(key);
    }

    getProgress() {
        return this.total > 0 ? this.loaded / this.total : 0;
    }

    emitProgress() {
        const progress = this.getProgress();
        eventBus.emit('resource:progress', { 
            progress, 
            loaded: this.loaded, 
            total: this.total,
            percent: Math.round(progress * 100)
        });
    }

    reset() {
        this.resources.clear();
        this.priorityQueue = { high: [], medium: [], low: [] };
        this.loaded = 0;
        this.total = 0;
    }

    async loadOnDemand(key, url, type = 'auto') {
        if (this.has(key)) return this.get(key);
        return this.loadItem({ key, url, type });
    }
}

export const resourceLoader = ResourceLoader.getInstance();
