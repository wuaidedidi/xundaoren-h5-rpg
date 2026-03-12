/**
 * 寻道人 - 状态管理入口
 * 使用自定义 SimpleStore，不依赖 Vue/Pinia
 */

export { default as playerStore, usePlayerStore } from "./playerStore.js";
export { default as gameStore, useGameStore } from "./gameStore.js";
export { default as networkStore, useNetworkStore } from "./networkStore.js";
export { createStore } from "./simpleStore.js";
