/**
 * 寻道人 - 游戏全局状态管理 Store
 * 管理游戏设置、状态、存档等
 */

import { createStore } from "./simpleStore.js";

const gameStore = createStore({
  state: () => ({
    // 游戏运行状态
    isRunning: false,
    isPaused: false,
    isLoading: false,
    loadingProgress: 0,
    loadingText: "",

    // 当前界面
    currentScreen: "mainMenu", // mainMenu, createCharacter, saveList, settings, gameUI

    // 当前存档ID
    currentSaveId: null,

    // 游戏设置
    settings: {
      quality: "medium",
      showDamageNumbers: true,
      soundVolume: 0.8,
      musicVolume: 0.5,
      autoSave: true,
    },

    // 时间追踪
    lastTime: 0,
    deltaTime: 0,
    playTime: 0, // 游戏时长（秒）

    // 当前交互NPC
    currentNPC: null,

    // 打开的面板
    openPanels: [],

    // 消息队列
    messageQueue: [],

    // 战斗日志
    combatLogs: [],

    // 资源加载状态
    resourcesLoaded: {
      core: false,
      textures: false,
      models: false,
      sounds: false,
    },

    // 网络状态
    isOnline: navigator.onLine,
    lastSyncTime: null,
  }),

  getters: {
    // 是否在游戏中
    isInGame: (state) => state.currentScreen === "gameUI",

    // 是否可以操作
    canInteract: (state) => state.isRunning && !state.isPaused && !state.isLoading,

    // 获取设置
    getSetting: (state) => (key) => state.settings[key],

    // 获取加载进度百分比
    loadingPercent: (state) => {
      const loaded = Object.values(state.resourcesLoaded).filter((v) => v).length;
      const total = Object.keys(state.resourcesLoaded).length;
      return Math.floor((loaded / total) * 100);
    },
  },

  actions: {
    // 设置游戏运行状态
    setRunning(running) {
      this.state.isRunning = running;
    },

    // 暂停/恢复游戏
    setPaused(paused) {
      this.state.isPaused = paused;
    },

    // 切换暂停状态
    togglePause() {
      this.state.isPaused = !this.state.isPaused;
    },

    // 设置加载状态
    setLoading(loading, progress = 0, text = "") {
      this.state.isLoading = loading;
      this.state.loadingProgress = progress;
      this.state.loadingText = text;
    },

    // 更新加载进度
    updateLoadingProgress(progress, text) {
      this.state.loadingProgress = progress;
      if (text) this.state.loadingText = text;
    },

    // 设置当前界面
    setCurrentScreen(screen) {
      this.state.currentScreen = screen;
    },

    // 设置当前存档ID
    setCurrentSaveId(saveId) {
      this.state.currentSaveId = saveId;
    },

    // 更新设置
    updateSettings(newSettings) {
      this.state.settings = { ...this.state.settings, ...newSettings };
    },

    // 设置单个设置项
    setSetting(key, value) {
      this.state.settings[key] = value;
    },

    // 更新时间
    updateTime(currentTime) {
      if (this.state.lastTime > 0) {
        this.state.deltaTime = Math.min((currentTime - this.state.lastTime) / 1000, 0.1);
        if (this.state.isRunning && !this.state.isPaused) {
          this.state.playTime += this.state.deltaTime;
        }
      }
      this.state.lastTime = currentTime;
    },

    // 重置时间
    resetTime() {
      this.state.lastTime = 0;
      this.state.deltaTime = 0;
    },

    // 设置当前NPC
    setCurrentNPC(npc) {
      this.state.currentNPC = npc;
    },

    // 打开面板
    openPanel(panelName) {
      if (!this.state.openPanels.includes(panelName)) {
        this.state.openPanels.push(panelName);
      }
    },

    // 关闭面板
    closePanel(panelName) {
      this.state.openPanels = this.state.openPanels.filter((p) => p !== panelName);
    },

    // 切换面板
    togglePanel(panelName) {
      if (this.state.openPanels.includes(panelName)) {
        this.closePanel(panelName);
      } else {
        this.openPanel(panelName);
      }
    },

    // 关闭所有面板
    closeAllPanels() {
      this.state.openPanels = [];
    },

    // 添加消息
    addMessage(message, type = "info", duration = 3000) {
      const id = Date.now() + Math.random();
      this.state.messageQueue.push({ id, message, type, duration, timestamp: Date.now() });

      // 限制消息队列长度
      if (this.state.messageQueue.length > 10) {
        this.state.messageQueue.shift();
      }
    },

    // 移除消息
    removeMessage(id) {
      this.state.messageQueue = this.state.messageQueue.filter((m) => m.id !== id);
    },

    // 清空消息
    clearMessages() {
      this.state.messageQueue = [];
    },

    // 添加战斗日志
    addCombatLog(message, type = "normal") {
      this.state.combatLogs.push({
        message,
        type,
        timestamp: Date.now(),
      });

      // 限制日志长度
      if (this.state.combatLogs.length > 50) {
        this.state.combatLogs.shift();
      }
    },

    // 清空战斗日志
    clearCombatLogs() {
      this.state.combatLogs = [];
    },

    // 设置资源加载状态
    setResourceLoaded(resourceType, loaded) {
      this.state.resourcesLoaded[resourceType] = loaded;
    },

    // 设置网络状态
    setOnlineStatus(online) {
      this.state.isOnline = online;
    },

    // 更新同步时间
    updateSyncTime() {
      this.state.lastSyncTime = Date.now();
    },

    // 重置游戏状态
    resetGame() {
      this.state.isRunning = false;
      this.state.isPaused = false;
      this.state.currentScreen = "mainMenu";
      this.state.currentSaveId = null;
      this.state.currentNPC = null;
      this.state.openPanels = [];
      this.state.messageQueue = [];
      this.state.combatLogs = [];
      this.state.playTime = 0;
      this.resetTime();
    },
  },
});

export default gameStore;
export const useGameStore = () => gameStore;
