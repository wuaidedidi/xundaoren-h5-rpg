/**
 * 寻道人 - 加密解密模块
 * 使用 AES-GCM 加密 + Base64 混淆存储
 * 防止玩家直接修改控制台数据
 */

class Crypto {
    constructor() {
        // 加密密钥（实际项目中应该从服务器获取或安全存储）
        this.key = null
        this.keyPromise = null
        this.ivLength = 12 // AES-GCM 推荐 IV 长度
    }

    /**
     * 初始化加密密钥
     * 从设备指纹生成密钥，增加破解难度
     */
    async init() {
        if (this.key) return

        if (this.keyPromise) {
            return this.keyPromise
        }

        this.keyPromise = this._deriveKey()
        this.key = await this.keyPromise
        this.keyPromise = null
    }

    /**
     * 从设备信息派生密钥
     * 使用 PBKDF2 增加安全性
     */
    async _deriveKey() {
        // 设备指纹（结合多个特征）
        const deviceFingerprint = this._getDeviceFingerprint()

        // 盐值（固定盐值，实际项目可以从服务器获取）
        const salt = new TextEncoder().encode('XunDaoRen_Salt_2024_v1')

        // 导入原始密钥材料
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(deviceFingerprint),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        )

        // 派生 AES-GCM 密钥
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000, // 高迭代次数增加暴力破解难度
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        )
    }

    /**
     * 获取设备指纹
     */
    _getDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            'XunDaoRen_Game_v1.0' // 应用标识
        ]

        // 简单哈希
        let hash = 0
        const str = components.join('|')
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }

        return `XDR_${Math.abs(hash).toString(16)}_${components[0].length}`
    }

    /**
     * 生成随机 IV
     */
    _generateIV() {
        return crypto.getRandomValues(new Uint8Array(this.ivLength))
    }

    /**
     * 加密数据
     * @param {Object} data - 要加密的数据对象
     * @returns {string} Base64 编码的加密字符串
     */
    async encrypt(data) {
        await this.init()

        try {
            // 序列化数据
            const jsonString = JSON.stringify(data)
            const encoder = new TextEncoder()
            const dataBuffer = encoder.encode(jsonString)

            // 生成随机 IV
            const iv = this._generateIV()

            // 加密
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.key,
                dataBuffer
            )

            // 组合 IV + 密文
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
            combined.set(iv, 0)
            combined.set(new Uint8Array(encryptedBuffer), iv.length)

            // Base64 编码
            return this._arrayBufferToBase64(combined)
        } catch (error) {
            console.error('加密失败:', error)
            throw new Error('数据加密失败')
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedBase64 - Base64 编码的加密字符串
     * @returns {Object} 解密后的数据对象
     */
    async decrypt(encryptedBase64) {
        await this.init()

        try {
            // Base64 解码
            const combined = this._base64ToArrayBuffer(encryptedBase64)

            // 分离 IV 和密文
            const iv = combined.slice(0, this.ivLength)
            const ciphertext = combined.slice(this.ivLength)

            // 解密
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.key,
                ciphertext
            )

            // 解析 JSON
            const decoder = new TextDecoder()
            const jsonString = decoder.decode(decryptedBuffer)
            return JSON.parse(jsonString)
        } catch (error) {
            console.error('解密失败:', error)
            throw new Error('数据解密失败，可能已被篡改')
        }
    }

    /**
     * ArrayBuffer 转 Base64
     */
    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    /**
     * Base64 转 ArrayBuffer
     */
    _base64ToArrayBuffer(base64) {
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }
        return bytes
    }

    /**
     * 简单的 Base64 混淆（用于非敏感数据）
     * @param {string} str - 要混淆的字符串
     * @returns {string} 混淆后的字符串
     */
    obfuscate(str) {
        // 先进行简单的字符替换混淆
        const obfuscated = str.split('').map((char, index) => {
            return String.fromCharCode(char.charCodeAt(0) + (index % 3))
        }).join('')

        // 再 Base64 编码
        return btoa(obfuscated)
    }

    /**
     * 解混淆
     * @param {string} obfuscatedStr - 混淆后的字符串
     * @returns {string} 原始字符串
     */
    deobfuscate(obfuscatedStr) {
        try {
            // Base64 解码
            const decoded = atob(obfuscatedStr)

            // 反向字符替换
            return decoded.split('').map((char, index) => {
                return String.fromCharCode(char.charCodeAt(0) - (index % 3))
            }).join('')
        } catch (error) {
            console.error('解混淆失败:', error)
            return null
        }
    }

    /**
     * 计算数据哈希（用于完整性校验）
     * @param {Object} data - 数据对象
     * @returns {string} SHA-256 哈希值
     */
    async hash(data) {
        const jsonString = JSON.stringify(data)
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(jsonString)

        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    /**
     * 验证数据完整性
     * @param {Object} data - 数据对象
     * @param {string} expectedHash - 期望的哈希值
     * @returns {boolean} 是否有效
     */
    async verifyIntegrity(data, expectedHash) {
        const actualHash = await this.hash(data)
        return actualHash === expectedHash
    }
}

export default new Crypto()
