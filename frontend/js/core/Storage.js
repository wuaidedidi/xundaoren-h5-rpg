/**
 * 寻道人 - IndexedDB存储模块
 * 处理游戏存档和设置的本地存储
 */

const DB_NAME = 'XunDaoRenDB';
const DB_VERSION = 1;

class Storage {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('IndexedDB初始化成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建存档存储
                if (!db.objectStoreNames.contains('saves')) {
                    const savesStore = db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
                    savesStore.createIndex('name', 'name', { unique: false });
                    savesStore.createIndex('createTime', 'createTime', { unique: false });
                }

                // 创建设置存储
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }

                console.log('IndexedDB结构创建完成');
            };
        });
    }

    /**
     * 保存游戏存档
     */
    async saveGame(saveData) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['saves'], 'readwrite');
            const store = transaction.objectStore('saves');

            const data = {
                ...saveData,
                updateTime: Date.now()
            };

            // 如果有id则更新，否则新建
            const request = saveData.id ? store.put(data) : store.add({
                ...data,
                createTime: Date.now()
            });

            request.onsuccess = () => {
                console.log('存档保存成功:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('存档保存失败:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 获取所有存档
     */
    async getAllSaves() {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.getAll();

            request.onsuccess = () => {
                // 按更新时间倒序排列
                const saves = request.result.sort((a, b) => b.updateTime - a.updateTime);
                resolve(saves);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 获取单个存档
     */
    async getSave(id) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 删除存档
     */
    async deleteSave(id) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['saves'], 'readwrite');
            const store = transaction.objectStore('saves');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('存档删除成功:', id);
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 保存设置
     */
    async saveSettings(settings) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ id: 1, ...settings });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 获取设置
     */
    async getSettings() {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(1);

            request.onsuccess = () => {
                resolve(request.result || this.getDefaultSettings());
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            quality: 'medium',
            showDamageNumbers: true
        };
    }
}

export default new Storage();
