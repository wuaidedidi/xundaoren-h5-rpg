import { createStore } from './createStore.js';

const initialState = {
    isRunning: false,
    isPaused: false,
    currentSaveId: null,
    settings: {
        quality: 'medium',
        showDamageNumbers: true,
        musicVolume: 1,
        soundVolume: 1
    },
    currentNPC: null,
    networkStatus: 'online',
    lastSaveTime: 0
};

const actions = {
    setRunning(state, value) {
        state.isRunning = value;
    },

    setPaused(state, value) {
        state.isPaused = value;
    },

    setCurrentSaveId(state, saveId) {
        state.currentSaveId = saveId;
    },

    updateSettings(state, newSettings) {
        Object.assign(state.settings, newSettings);
    },

    setCurrentNPC(state, npc) {
        state.currentNPC = npc;
    },

    setNetworkStatus(state, status) {
        state.networkStatus = status;
    },

    updateLastSaveTime(state) {
        state.lastSaveTime = Date.now();
    }
};

export const useGameStore = createStore(initialState, actions, { strict: true });
