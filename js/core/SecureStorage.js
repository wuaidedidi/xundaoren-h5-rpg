/**
 * 寻道人 - 安全存储模块
 * 使用 AES 加密存储游戏数据，防止篡改
 * 支持存档版本控制
 */

import Crypto from './Crypto.js'

const DB_NAME = 'XunDaoRenSecureDB'
const DB_VERSION = 2 // 版本升级

class SecureStorage {
    constructor() {
        this.db = null
        this.isReady = false
        this.currentSaveVersion = '1.0.0' // 当前存档版本
    }

    /**
     * 初始化数据库
     */
    async init() {
        if (this.isReady) return

        // 初始化加密模块
        await Crypto.init()

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => {
                console.error('安全存储初始化失败:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                this.db = request.result
                this.isReady = true
                console.log('安全存储初始化成功')
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = event.target.result

                // 创建加密存档存储
                if (!db.objectStoreNames.contains('encryptedSaves')) {
                    const savesStore = db.createObjectStore('encryptedSaves', {
                        keyPath: 'id',
                        autoIncrement: true
                    })
                    savesStore.createIndex('name', 'name', { unique: false })
                    savesStore.createIndex('createTime', 'createTime', { unique: false })
                    savesStore.createIndex('version', 'version', { unique: false })
                }

                // 创建设置存储
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' })
                }

                // 创建元数据存储（用于存档完整性校验）
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'saveId' })
                }

                console.log('安全存储结构创建完成')
            }
        })
    }

    /**
     * 保存游戏存档（加密存储）
     * @param {Object} saveData - 存档数据
     * @returns {Promise<number>} 存档ID
     */
    async saveGame(saveData) {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        try {
            // 添加版本信息
            const dataWithVersion = {
                ...saveData,
                version: this.currentSaveVersion,
                saveTime: Date.now()
            }

            // 计算数据哈希（用于完整性校验）
            const dataHash = await Crypto.hash(dataWithVersion)

            // 加密数据
            const encryptedData = await Crypto.encrypt(dataWithVersion)

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    ['encryptedSaves', 'metadata'],
                    'readwrite'
                )
                const savesStore = transaction.objectStore('encryptedSaves')
                const metaStore = transaction.objectStore('metadata')

                const data = {
                    ...saveData,
                    encryptedData: encryptedData,
                    updateTime: Date.now()
                }

                // 如果有id则更新，否则新建
                const request = saveData.id
                    ? savesStore.put(data)
                    : savesStore.add({
                        ...data,
                        createTime: Date.now()
                    })

                request.onsuccess = () => {
                    const saveId = request.result

                    // 保存元数据（哈希等）
                    metaStore.put({
                        saveId: saveId,
                        hash: dataHash,
                        version: this.currentSaveVersion,
                        updateTime: Date.now()
                    })

                    console.log('加密存档保存成功:', saveId)
                    resolve(saveId)
                }

                request.onerror = () => {
                    console.error('存档保存失败:', request.error)
                    reject(request.error)
                }
            })
        } catch (error) {
            console.error('加密存档失败:', error)
            throw error
        }
    }

    /**
     * 获取所有存档（解密）
     * @returns {Promise<Array>} 存档列表
     */
    async getAllSaves() {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['encryptedSaves'], 'readonly')
            const store = transaction.objectStore('encryptedSaves')
            const request = store.getAll()

            request.onsuccess = async () => {
                try {
                    const saves = []

                    for (const encryptedSave of request.result) {
                        try {
                            // 解密数据
                            const decryptedData = await Crypto.decrypt(
                                encryptedSave.encryptedData
                            )

                            // 版本兼容性处理
                            const migratedData = this._migrateSaveData(decryptedData)

                            saves.push({
                                id: encryptedSave.id,
                                name: migratedData.name || encryptedSave.name,
                                player: migratedData.player || migratedData,
                                createTime: encryptedSave.createTime,
                                updateTime: encryptedSave.updateTime,
                                version: migratedData.version || '1.0.0'
                            })
                        } catch (error) {
                            console.warn('存档解密失败，可能已被篡改:', encryptedSave.id)
                            // 继续处理其他存档
                        }
                    }

                    // 按更新时间倒序排列
                    saves.sort((a, b) => b.updateTime - a.updateTime)
                    resolve(saves)
                } catch (error) {
                    reject(error)
                }
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    /**
     * 获取单个存档（解密）
     * @param {number} id - 存档ID
     * @returns {Promise<Object>} 存档数据
     */
    async getSave(id) {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                ['encryptedSaves', 'metadata'],
                'readonly'
            )
            const store = transaction.objectStore('encryptedSaves')
            const metaStore = transaction.objectStore('metadata')

            const request = store.get(id)

            request.onsuccess = async () => {
                if (!request.result) {
                    resolve(null)
                    return
                }

                try {
                    // 解密数据
                    const decryptedData = await Crypto.decrypt(
                        request.result.encryptedData
                    )

                    // 验证完整性
                    const metaRequest = metaStore.get(id)
                    metaRequest.onsuccess = async () => {
                        const metadata = metaRequest.result
                        if (metadata) {
                            const currentHash = await Crypto.hash(decryptedData)
                            if (currentHash !== metadata.hash) {
                                console.warn('存档完整性校验失败:', id)
                                // 可以选择拒绝加载或记录警告
                            }
                        }
                    }

                    // 版本兼容性处理
                    const migratedData = this._migrateSaveData(decryptedData)

                    resolve({
                        id: request.result.id,
                        ...migratedData
                    })
                } catch (error) {
                    console.error('存档解密失败:', error)
                    reject(new Error('存档数据已损坏或被篡改'))
                }
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    /**
     * 删除存档
     * @param {number} id - 存档ID
     */
    async deleteSave(id) {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                ['encryptedSaves', 'metadata'],
                'readwrite'
            )
            const savesStore = transaction.objectStore('encryptedSaves')
            const metaStore = transaction.objectStore('metadata')

            const request = savesStore.delete(id)

            request.onsuccess = () => {
                // 同时删除元数据
                metaStore.delete(id)
                console.log('存档删除成功:', id)
                resolve()
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    /**
     * 存档版本迁移
     * 处理老版本存档的兼容性问题
     * @param {Object} saveData - 存档数据
     * @returns {Object} 迁移后的数据
     */
    _migrateSaveData(saveData) {
        const saveVersion = saveData.version || '1.0.0'
        let migratedData = { ...saveData }

        // 版本 1.0.0 -> 1.0.1 迁移示例
        if (this._compareVersions(saveVersion, '1.0.1') < 0) {
            // 添加新字段的默认值
            if (!migratedData.player.spiritStones) {
                migratedData.player.spiritStones = migratedData.player.gold || 0
            }
        }

        // 版本 1.0.1 -> 1.0.2 迁移示例
        if (this._compareVersions(saveVersion, '1.0.2') < 0) {
            // 重命名字段
            if (migratedData.player.cultivation !== undefined) {
                migratedData.player.cultivationExp = migratedData.player.cultivation
                delete migratedData.player.cultivation
            }
        }

        // 更新到当前版本
        migratedData.version = this.currentSaveVersion

        return migratedData
    }

    /**
     * 比较版本号
     * @param {string} v1 - 版本1
     * @param {string} v2 - 版本2
     * @returns {number} -1: v1<v2, 0: v1=v2, 1: v1>v2
     */
    _compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number)
        const parts2 = v2.split('.').map(Number)

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0
            const p2 = parts2[i] || 0

            if (p1 < p2) return -1
            if (p1 > p2) return 1
        }

        return 0
    }

    /**
     * 保存设置（简单混淆）
     * @param {Object} settings - 设置数据
     */
    async saveSettings(settings) {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite')
            const store = transaction.objectStore('settings')

            // 对设置进行简单混淆
            const obfuscated = Crypto.obfuscate(JSON.stringify(settings))

            const request = store.put({ id: 1, data: obfuscated })

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    /**
     * 获取设置（解混淆）
     * @returns {Promise<Object>} 设置数据
     */
    async getSettings() {
        if (!this.isReady) {
            throw new Error('安全存储未初始化')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly')
            const store = transaction.objectStore('settings')
            const request = store.get(1)

            request.onsuccess = () => {
                if (!request.result) {
                    resolve(this.getDefaultSettings())
                    return
                }

                try {
                    const deobfuscated = Crypto.deobfuscate(request.result.data)
                    const settings = JSON.parse(deobfuscated)
                    resolve(settings)
                } catch (error) {
                    console.warn('设置数据损坏，使用默认设置')
                    resolve(this.getDefaultSettings())
                }
            }

            request.onerror = () => reject(request.error)
        })
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            quality: 'medium',
            showDamageNumbers: true,
            soundVolume: 0.8,
            musicVolume: 0.5,
            autoSave: true
        }
    }

    /**
     * 导出存档（用于备份）
     * @param {number} id - 存档ID
     * @returns {Promise<string>} Base64 编码的存档数据
     */
    async exportSave(id) {
        const save = await this.getSave(id)
        if (!save) throw new Error('存档不存在')

        // 添加导出标记
        const exportData = {
            ...save,
            exportTime: Date.now(),
            exportVersion: this.currentSaveVersion
        }

        return Crypto.obfuscate(JSON.stringify(exportData))
    }

    /**
     * 导入存档
     * @param {string} exportedData - Base64 编码的存档数据
     * @returns {Promise<number>} 新存档ID
     */
    async importSave(exportedData) {
        try {
            const deobfuscated = Crypto.deobfuscate(exportedData)
            const saveData = JSON.parse(deobfuscated)

            // 验证数据
            if (!saveData.player || !saveData.name) {
                throw new Error('无效的存档数据')
            }

            // 迁移数据
            const migratedData = this._migrateSaveData(saveData)

            // 移除ID以创建新存档
            delete migratedData.id

            return await this.saveGame(migratedData)
        } catch (error) {
            console.error('导入存档失败:', error)
            throw new Error('存档导入失败，数据可能已损坏')
        }
    }
}

export default new SecureStorage()
