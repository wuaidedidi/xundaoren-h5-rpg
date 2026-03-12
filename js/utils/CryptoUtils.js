export class CryptoUtils {
    static getSecretKey() {
        return 'xunDaoRen_2024_Game_Secret_Key_32Byte';
    }

    static async getKeyFromString(keyString) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(keyString.padEnd(32, ' ').slice(0, 32));
        return crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonString);

            const key = await this.getKeyFromString(this.getSecretKey());
            const iv = crypto.getRandomValues(new Uint8Array(12));

            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );

            const encryptedArray = new Uint8Array(encryptedBuffer);
            const combined = new Uint8Array(iv.length + encryptedArray.length);
            combined.set(iv, 0);
            combined.set(encryptedArray, iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.warn('AES加密失败，回退到Base64:', e);
            return this.base64Encrypt(data);
        }
    }

    static async decrypt(encryptedData) {
        try {
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const key = await this.getKeyFromString(this.getSecretKey());

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decryptedBuffer);
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn('AES解密失败，尝试Base64:', e);
            return this.base64Decrypt(encryptedData);
        }
    }

    static base64Encrypt(data) {
        const jsonString = JSON.stringify(data);
        const encoded = btoa(unescape(encodeURIComponent(jsonString)));
        return 'B64::' + encoded.split('').reverse().join('');
    }

    static base64Decrypt(encodedData) {
        try {
            if (encodedData.startsWith('B64::')) {
                encodedData = encodedData.slice(5);
            }
            const reversed = encodedData.split('').reverse().join('');
            const decoded = decodeURIComponent(escape(atob(reversed)));
            return JSON.parse(decoded);
        } catch (e) {
            console.warn('Base64解密失败:', e);
            return null;
        }
    }

    static async obfuscate(data) {
        const encrypted = await this.encrypt(data);
        return 'GAME::' + btoa(encrypted).split('').map(c => 
            String.fromCharCode(c.charCodeAt(0) + 10)
        ).join('');
    }

    static async deobfuscate(obfuscated) {
        try {
            if (obfuscated.startsWith('GAME::')) {
                obfuscated = obfuscated.slice(6);
            }
            const decoded = obfuscated.split('').map(c => 
                String.fromCharCode(c.charCodeAt(0) - 10)
            ).join('');
            return await this.decrypt(atob(decoded));
        } catch (e) {
            console.warn('反混淆失败:', e);
            return null;
        }
    }
}
