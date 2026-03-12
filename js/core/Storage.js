/**
 * 寻道人 - IndexedDB存储模块
 * 处理游戏存档和设置的本地存储
 */

import { CryptoUtils } from "../utils/CryptoUtils.js";

const DB_NAME = "XunDaoRenDB";
const DB_VERSION = 2;
const CURRENT_SAVE_VERSION = 2;

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
        console.error("IndexedDB打开失败:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log("IndexedDB初始化成功");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建存档存储
        if (!db.objectStoreNames.contains("saves")) {
          const savesStore = db.createObjectStore("saves", { keyPath: "id", autoIncrement: true });
          savesStore.createIndex("name", "name", { unique: false });
          savesStore.createIndex("createTime", "createTime", { unique: false });
        }

        // 创建设置存储
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }

        console.log("IndexedDB结构创建完成");
      };
    });
  }

  /**
   * 保存游戏存档
   */
  async saveGame(saveData) {
    if (!this.isReady) {
      throw new Error("数据库未初始化");
    }

    const dataToSave = {
      ...saveData,
      updateTime: Date.now(),
      version: CURRENT_SAVE_VERSION,
    };

    if (!dataToSave.createTime) {
      dataToSave.createTime = Date.now();
    }

    const encrypted = await CryptoUtils.obfuscate(dataToSave);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["saves"], "readwrite");
      const store = transaction.objectStore("saves");

      const record = {
        id: saveData.id,
        encryptedData: encrypted,
        createTime: dataToSave.createTime,
        updateTime: dataToSave.updateTime,
        version: CURRENT_SAVE_VERSION,
      };

      const request = saveData.id ? store.put(record) : store.add(record);

      request.onsuccess = () => {
        console.log("存档保存成功:", request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("存档保存失败:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取所有存档
   */
  async getAllSaves() {
    if (!this.isReady) {
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["saves"], "readonly");
      const store = transaction.objectStore("saves");
      const request = store.getAll();

      request.onsuccess = async () => {
        try {
          const saves = [];
          for (const record of request.result) {
            const decrypted = await this.decryptSaveData(record);
            if (decrypted) {
              saves.push(decrypted);
            }
          }
          saves.sort((a, b) => b.updateTime - a.updateTime);
          resolve(saves);
        } catch (e) {
          reject(e);
        }
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
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["saves"], "readonly");
      const store = transaction.objectStore("saves");
      const request = store.get(id);

      request.onsuccess = async () => {
        try {
          const decrypted = await this.decryptSaveData(request.result);
          resolve(decrypted);
        } catch (e) {
          reject(e);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 解密存档数据并处理版本迁移
   */
  async decryptSaveData(record) {
    if (!record) return null;

    let data;
    if (record.encryptedData) {
      data = await CryptoUtils.deobfuscate(record.encryptedData);
    } else {
      data = { ...record };
    }

    if (!data) return null;

    return this.migrateSaveData(data);
  }

  /**
   * 存档数据版本迁移
   */
  migrateSaveData(data) {
    const version = data.version || 1;

    if (version < 2) {
      data = this.migrateV1ToV2(data);
    }

    data.version = CURRENT_SAVE_VERSION;
    return data;
  }

  /**
   * 版本1迁移到版本2
   */
  migrateV1ToV2(data) {
    console.log("正在迁移存档数据 v1 -> v2");
    if (!data.player) {
      return data;
    }
    if (!data.player.buffs) data.player.buffs = [];
    if (!data.player.stats) data.player.stats = {};
    if (!data.player.skills) data.player.skills = [];
    if (!data.player.achievements) data.player.achievements = [];
    if (!data.gameSettings) data.gameSettings = {};
    if (!data.playTime) data.playTime = 0;
    return data;
  }

  /**
   * 删除存档
   */
  async deleteSave(id) {
    if (!this.isReady) {
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["saves"], "readwrite");
      const store = transaction.objectStore("saves");
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("存档删除成功:", id);
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
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
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
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
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
      quality: "medium",
      showDamageNumbers: true,
    };
  }
}

export default new Storage();
