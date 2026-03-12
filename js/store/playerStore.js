import { createStore } from "./createStore.js";
import { getRealmByLevel, getExpRequired, getRealmBonus } from "../data/realms.js";
import { getClass, getSpecialization } from "../data/classes.js";

const initialState = {
  name: "玩家",
  level: 0,
  exp: 0,
  gold: 100,
  classId: null,
  specializationId: null,
  baseHp: 100,
  baseMp: 50,
  baseAttack: 10,
  baseDefense: 5,
  baseSpeed: 5,
  hp: 100,
  mp: 50,
  position: { x: 0, y: 0, z: 5 },
  rotation: 0,
  isMoving: false,
  inCombat: false,
  inventory: [],
  maxInventory: 24,
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
  },
  buffs: [],
  learnedSkills: ["punch", "breathe", "dodge", "charge"],
  skillCooldowns: {},
  quests: [],
  completedQuests: [],
  tutorialComplete: false,
  foundMysteriousElder: false,
};

const actions = {
  init(state, playerData) {
    Object.assign(state, playerData);
  },

  takeDamage(state, amount) {
    const vajraBuff = state.buffs.find((b) => b.id === "vajraBody");
    if (vajraBuff) {
      amount *= 1 - vajraBuff.damageReduction;
    }

    const shieldBuff = state.buffs.find((b) => b.id === "spiritShield");
    if (shieldBuff) {
      state.buffs = state.buffs.filter((b) => b.id !== "spiritShield");
      return 0;
    }

    const defense = calculateDefense(state);
    const finalDamage = Math.max(1, Math.floor(amount - defense * 0.5));
    state.hp = Math.max(0, state.hp - finalDamage);
    state.inCombat = true;
    return finalDamage;
  },

  heal(state, amount) {
    const maxHp = calculateMaxHp(state);
    const actualHeal = Math.min(amount, maxHp - state.hp);
    state.hp += actualHeal;
    return actualHeal;
  },

  useMp(state, amount) {
    if (state.mp < amount) return false;
    state.mp -= amount;
    return true;
  },

  gainExp(state, amount) {
    const chargeBuff = state.buffs.find((b) => b.id === "charge" && b.consumed);
    if (chargeBuff) {
      state.buffs = state.buffs.filter((b) => b !== chargeBuff);
    }

    state.exp += amount;
    const results = [];

    while (state.level < 81) {
      const required = getExpRequired(state.level);
      if (state.exp >= required) {
        state.exp -= required;
        state.level++;
        results.push({ type: "levelUp", level: state.level });

        state.hp = calculateMaxHp(state);
        state.mp = calculateMaxMp(state);

        const newRealm = getRealmByLevel(state.level);
        const oldRealm = getRealmByLevel(state.level - 1);
        if (newRealm.name !== oldRealm.name) {
          results.push({ type: "realmUp", realm: newRealm.name });
        }
      } else {
        break;
      }
    }

    return results;
  },

  gainGold(state, amount) {
    state.gold += amount;
  },

  addItem(state, item, count = 1) {
    if (item.stackable) {
      const existing = state.inventory.find((inv) => inv.itemId === item.id);
      if (existing) {
        existing.count = Math.min(item.maxStack || 99, existing.count + count);
        return true;
      }
    }

    if (state.inventory.length >= state.maxInventory) {
      return false;
    }

    state.inventory.push({ itemId: item.id, count });
    return true;
  },

  removeItem(state, itemId, count = 1) {
    const index = state.inventory.findIndex((inv) => inv.itemId === itemId);
    if (index === -1) return false;

    state.inventory[index].count -= count;
    if (state.inventory[index].count <= 0) {
      state.inventory.splice(index, 1);
    }
    return true;
  },

  updateBuffs(state, deltaTime) {
    state.buffs = state.buffs.filter((buff) => {
      buff.remaining -= deltaTime * 1000;
      return buff.remaining > 0;
    });
  },

  updateCooldowns(state, deltaTime) {
    for (const skillId in state.skillCooldowns) {
      state.skillCooldowns[skillId] -= deltaTime * 1000;
      if (state.skillCooldowns[skillId] <= 0) {
        delete state.skillCooldowns[skillId];
      }
    }
  },

  setCooldown(state, skillId, cooldownMs) {
    state.skillCooldowns[skillId] = cooldownMs;
  },

  regenTick(state, deltaTime) {
    const regenRate = 0.01 * deltaTime;
    const maxHp = calculateMaxHp(state);
    const maxMp = calculateMaxMp(state);
    state.hp = Math.min(maxHp, state.hp + maxHp * regenRate);
    state.mp = Math.min(maxMp, state.mp + maxMp * regenRate);
  },

  setPosition(state, x, y, z) {
    state.position.x = x;
    state.position.y = y;
    state.position.z = z;
  },

  setRotation(state, rotation) {
    state.rotation = rotation;
  },

  learnSkill(state, skillId) {
    if (!state.learnedSkills.includes(skillId)) {
      state.learnedSkills.push(skillId);
      return true;
    }
    return false;
  },

  unlearnSkill(state, skillId) {
    state.learnedSkills = state.learnedSkills.filter((id) => id !== skillId);
  },

  addBuff(state, buff) {
    state.buffs.push({ ...buff, remaining: buff.duration || 0 });
  },

  removeBuff(state, buffId) {
    state.buffs = state.buffs.filter((b) => b.id !== buffId);
  },

  setClass(state, classId) {
    state.classId = classId;
  },

  setSpecialization(state, specId) {
    state.specializationId = specId;
  },
};

function calculateMaxHp(state) {
  let base = state.baseHp;
  if (state.classId) {
    const cls = getClass(state.classId);
    if (cls) base = cls.baseStats.hp;
  }
  if (state.classId && state.specializationId) {
    const spec = getSpecialization(state.classId, state.specializationId);
    if (spec && spec.bonusStats.hp) base *= spec.bonusStats.hp;
  }
  base *= getRealmBonus(state.level);
  if (state.equipment.armor && state.equipment.armor.stats.hp) {
    base += state.equipment.armor.stats.hp;
  }
  return Math.floor(base);
}

function calculateMaxMp(state) {
  let base = state.baseMp;
  if (state.classId) {
    const cls = getClass(state.classId);
    if (cls) base = cls.baseStats.mp;
  }
  if (state.classId && state.specializationId) {
    const spec = getSpecialization(state.classId, state.specializationId);
    if (spec && spec.bonusStats.mp) base *= spec.bonusStats.mp;
  }
  base *= getRealmBonus(state.level);
  return Math.floor(base);
}

function calculateDefense(state) {
  let base = state.baseDefense;
  if (state.classId) {
    const cls = getClass(state.classId);
    if (cls) base = cls.baseStats.defense;
  }
  if (state.classId && state.specializationId) {
    const spec = getSpecialization(state.classId, state.specializationId);
    if (spec && spec.bonusStats.defense) base *= spec.bonusStats.defense;
  }
  base *= getRealmBonus(state.level);
  if (state.equipment.armor && state.equipment.armor.stats.defense) {
    base += state.equipment.armor.stats.defense;
  }
  return Math.floor(base);
}

export const usePlayerStore = createStore(initialState, actions, { strict: true });
