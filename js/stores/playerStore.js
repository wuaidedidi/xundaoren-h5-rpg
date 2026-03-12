/**
 * 寻道人 - 玩家状态管理 Store
 * 管理玩家修为、灵石等核心数据
 * 严格模式：只能在 Action 中修改状态
 */

import { createStore } from "./simpleStore.js";
import { getRealmByLevel, getExpRequired, getRealmBonus } from "../data/realms.js";
import { getClass, getSpecialization } from "../data/classes.js";
import { getClassSkills } from "../data/skills.js";

const playerStore = createStore({
  state: () => ({
    // 基础信息
    name: "玩家",
    level: 0,
    exp: 0,
    gold: 100,

    // 职业信息
    classId: null,
    specializationId: null,

    // 基础属性
    baseHp: 100,
    baseMp: 50,
    baseAttack: 10,
    baseDefense: 5,
    baseSpeed: 5,

    // 当前属性
    hp: 100,
    mp: 50,

    // 装备
    equipment: {
      weapon: null,
      armor: null,
      accessory: null,
    },

    // 增益效果
    buffs: [],

    // 位置和移动
    position: { x: 0, y: 0, z: 5 },
    rotation: 0,
    isMoving: false,
    velocity: { x: 0, z: 0 },

    // 战斗状态
    target: null,
    inCombat: false,
    lastAttackTime: 0,
    attackCooldown: 1000,

    // 技能冷却
    skillCooldowns: {},

    // 背包
    inventory: [],
    maxInventory: 24,

    // 已学技能
    learnedSkills: ["punch", "breathe", "dodge", "charge"],

    // 任务进度
    quests: [],
    completedQuests: [],

    // 3D对象引用（不序列化）
    mesh: null,
    nameTag: null,

    // 标记
    tutorialComplete: false,
    foundMysteriousElder: false,
  }),

  getters: {
    // 计算当前境界
    realm: (state) => getRealmByLevel(state.level),

    // 计算最大生命值
    maxHp: (state) => {
      let base = state.baseHp;

      // 职业加成
      if (state.classId) {
        const cls = getClass(state.classId);
        if (cls) base = cls.baseStats.hp;
      }

      // 专精加成
      if (state.classId && state.specializationId) {
        const spec = getSpecialization(state.classId, state.specializationId);
        if (spec && spec.bonusStats.hp) {
          base *= spec.bonusStats.hp;
        }
      }

      // 境界加成
      base *= getRealmBonus(state.level);

      // 装备加成
      if (state.equipment.armor && state.equipment.armor.stats.hp) {
        base += state.equipment.armor.stats.hp;
      }

      return Math.floor(base);
    },

    // 计算最大法力值
    maxMp: (state) => {
      let base = state.baseMp;

      if (state.classId) {
        const cls = getClass(state.classId);
        if (cls) base = cls.baseStats.mp;
      }

      if (state.classId && state.specializationId) {
        const spec = getSpecialization(state.classId, state.specializationId);
        if (spec && spec.bonusStats.mp) {
          base *= spec.bonusStats.mp;
        }
      }

      base *= getRealmBonus(state.level);

      return Math.floor(base);
    },

    // 计算攻击力
    attack: (state) => {
      let base = state.baseAttack;

      if (state.classId) {
        const cls = getClass(state.classId);
        if (cls) base = cls.baseStats.attack;
      }

      if (state.classId && state.specializationId) {
        const spec = getSpecialization(state.classId, state.specializationId);
        if (spec && spec.bonusStats.attack) {
          base *= spec.bonusStats.attack;
        }
      }

      base *= getRealmBonus(state.level);

      if (state.equipment.weapon && state.equipment.weapon.stats.attack) {
        base += state.equipment.weapon.stats.attack;
      }

      // 蓄力buff
      const chargeBuff = state.buffs.find((b) => b.id === "charge");
      if (chargeBuff) {
        base *= 1 + chargeBuff.damageBonus;
      }

      return Math.floor(base);
    },

    // 计算防御力
    defense: (state) => {
      let base = state.baseDefense;

      if (state.classId) {
        const cls = getClass(state.classId);
        if (cls) base = cls.baseStats.defense;
      }

      if (state.classId && state.specializationId) {
        const spec = getSpecialization(state.classId, state.specializationId);
        if (spec && spec.bonusStats.defense) {
          base *= spec.bonusStats.defense;
        }
      }

      base *= getRealmBonus(state.level);

      if (state.equipment.armor && state.equipment.armor.stats.defense) {
        base += state.equipment.armor.stats.defense;
      }

      return Math.floor(base);
    },

    // 计算移动速度
    speed: (state) => {
      let base = state.baseSpeed;

      if (state.classId) {
        const cls = getClass(state.classId);
        if (cls) base = cls.baseStats.speed;
      }

      return base;
    },

    // 获取职业名称
    className: (state) => {
      if (!state.classId) return null;
      const cls = getClass(state.classId);
      return cls ? cls.name : null;
    },

    // 获取专精名称
    specializationName: (state) => {
      if (!state.classId || !state.specializationId) return null;
      const spec = getSpecialization(state.classId, state.specializationId);
      return spec ? spec.name : null;
    },

    // 获取当前经验需求
    expRequired: (state) => getExpRequired(state.level),

    // 获取经验百分比
    expPercent: (state) => {
      const required = getExpRequired(state.level);
      if (required === 0) return 100;
      return Math.min(100, Math.floor((state.exp / required) * 100));
    },

    // 获取生命值百分比
    hpPercent: (state) => {
      const max = Math.floor(state.baseHp * getRealmBonus(state.level));
      return max > 0 ? Math.min(100, Math.floor((state.hp / max) * 100)) : 0;
    },

    // 获取法力值百分比
    mpPercent: (state) => {
      const max = Math.floor(state.baseMp * getRealmBonus(state.level));
      return max > 0 ? Math.min(100, Math.floor((state.mp / max) * 100)) : 0;
    },
  },

  actions: {
    // 初始化玩家
    initPlayer(name) {
      this.state.name = name;
      this.state.level = 0;
      this.state.exp = 0;
      this.state.gold = 100;
      this.state.classId = null;
      this.state.specializationId = null;
      this.state.hp = this.getters.maxHp;
      this.state.mp = this.getters.maxMp;
      this.state.position = { x: 0, y: 0, z: 5 };
      this.state.rotation = 0;
      this.state.inventory = [];
      this.state.learnedSkills = ["punch", "breathe", "dodge", "charge"];
      this.state.quests = [];
      this.state.completedQuests = [];
      this.state.tutorialComplete = false;
      this.state.foundMysteriousElder = false;
      this.state.skillCooldowns = {};
      this.state.buffs = [];
    },

    // 更新位置
    updatePosition(deltaTime, direction) {
      if (direction.x !== 0 || direction.z !== 0) {
        const moveSpeed = this.getters.speed * deltaTime * 5;

        this.state.position.x += direction.x * moveSpeed;
        this.state.position.z += direction.z * moveSpeed;

        // 旋转朝向移动方向
        this.state.rotation = Math.atan2(direction.x, direction.z);

        this.state.isMoving = true;
      } else {
        this.state.isMoving = false;
      }

      // 更新3D对象
      if (this.state.mesh) {
        this.state.mesh.position.x = this.state.position.x;
        this.state.mesh.position.z = this.state.position.z;
        this.state.mesh.rotation.y = this.state.rotation;
      }
    },

    // 边界限制
    clampPosition(minX, maxX, minZ, maxZ) {
      this.state.position.x = Math.max(minX, Math.min(maxX, this.state.position.x));
      this.state.position.z = Math.max(minZ, Math.min(maxZ, this.state.position.z));

      if (this.state.mesh) {
        this.state.mesh.position.x = this.state.position.x;
        this.state.mesh.position.z = this.state.position.z;
      }
    },

    // 更新buff
    updateBuffs(deltaTime) {
      this.state.buffs = this.state.buffs.filter((buff) => {
        buff.remaining -= deltaTime * 1000;
        return buff.remaining > 0;
      });
    },

    // 更新技能冷却
    updateCooldowns(deltaTime) {
      for (const skillId in this.state.skillCooldowns) {
        this.state.skillCooldowns[skillId] -= deltaTime * 1000;
        if (this.state.skillCooldowns[skillId] <= 0) {
          delete this.state.skillCooldowns[skillId];
        }
      }
    },

    // 脱战回复
    regenTick(deltaTime) {
      // 每秒回复1%
      const regenRate = 0.01 * deltaTime;
      this.state.hp = Math.min(this.getters.maxHp, this.state.hp + this.getters.maxHp * regenRate);
      this.state.mp = Math.min(this.getters.maxMp, this.state.mp + this.getters.maxMp * regenRate);
    },

    // 受到伤害
    takeDamage(amount) {
      // 检查金刚不坏buff
      const vajraBuff = this.state.buffs.find((b) => b.id === "vajraBody");
      if (vajraBuff) {
        amount *= 1 - vajraBuff.damageReduction;
      }

      // 检查灵盾buff
      const shieldBuff = this.state.buffs.find((b) => b.id === "spiritShield");
      if (shieldBuff) {
        this.state.buffs = this.state.buffs.filter((b) => b.id !== "spiritShield");
        return 0;
      }

      const finalDamage = Math.max(1, Math.floor(amount - this.getters.defense * 0.5));
      this.state.hp = Math.max(0, this.state.hp - finalDamage);
      this.state.inCombat = true;

      return finalDamage;
    },

    // 治疗
    heal(amount) {
      const actualHeal = Math.min(amount, this.getters.maxHp - this.state.hp);
      this.state.hp += actualHeal;
      return actualHeal;
    },

    // 消耗法力
    useMp(amount) {
      if (this.state.mp < amount) return false;
      this.state.mp -= amount;
      return true;
    },

    // 获得经验
    gainExp(amount) {
      // 设置蓄力buff使用后清除
      const chargeBuff = this.state.buffs.find((b) => b.id === "charge" && b.consumed);
      if (chargeBuff) {
        this.state.buffs = this.state.buffs.filter((b) => b !== chargeBuff);
      }

      this.state.exp += amount;

      const results = [];

      // 检查升级
      while (this.state.level < 81) {
        const required = getExpRequired(this.state.level);
        if (this.state.exp >= required) {
          this.state.exp -= required;
          this.state.level++;
          results.push({ type: "levelUp", level: this.state.level });

          // 升级回满血蓝
          this.state.hp = this.getters.maxHp;
          this.state.mp = this.getters.maxMp;

          // 检查境界突破
          const newRealm = getRealmByLevel(this.state.level);
          const oldRealm = getRealmByLevel(this.state.level - 1);
          if (newRealm.name !== oldRealm.name) {
            results.push({ type: "realmUp", realm: newRealm.name });
          }
        } else {
          break;
        }
      }

      return results;
    },

    // 获得金币
    gainGold(amount) {
      this.state.gold += amount;
    },

    // 消费金币
    spendGold(amount) {
      if (this.state.gold < amount) return false;
      this.state.gold -= amount;
      return true;
    },

    // 选择职业
    selectClass(classId) {
      if (this.state.level < 10) return false;
      if (this.state.classId) return false;

      this.state.classId = classId;

      // 学习职业技能
      const classSkills = getClassSkills(classId);
      classSkills.forEach((skill) => {
        if (!this.state.learnedSkills.includes(skill.id)) {
          this.state.learnedSkills.push(skill.id);
        }
      });

      // 更新属性
      this.state.hp = this.getters.maxHp;
      this.state.mp = this.getters.maxMp;

      return true;
    },

    // 选择专精
    selectSpecialization(specId) {
      if (this.state.level < 30) return false;
      if (!this.state.classId) return false;
      if (this.state.specializationId) return false;

      const spec = getSpecialization(this.state.classId, specId);
      if (!spec) return false;

      this.state.specializationId = specId;

      // 更新属性
      this.state.hp = this.getters.maxHp;
      this.state.mp = this.getters.maxMp;

      return true;
    },

    // 添加物品到背包
    addItem(item, count = 1) {
      // 检查是否可堆叠
      if (item.stackable) {
        const existing = this.state.inventory.find((inv) => inv.itemId === item.id);
        if (existing) {
          existing.count = Math.min(item.maxStack, existing.count + count);
          return true;
        }
      }

      // 检查背包空间
      if (this.state.inventory.length >= this.state.maxInventory) {
        return false;
      }

      this.state.inventory.push({ itemId: item.id, count });
      return true;
    },

    // 移除物品
    removeItem(itemId, count = 1) {
      const index = this.state.inventory.findIndex((inv) => inv.itemId === itemId);
      if (index === -1) return false;

      this.state.inventory[index].count -= count;
      if (this.state.inventory[index].count <= 0) {
        this.state.inventory.splice(index, 1);
      }

      return true;
    },

    // 检查是否有物品
    hasItem(itemId, count = 1) {
      const item = this.state.inventory.find((inv) => inv.itemId === itemId);
      return item && item.count >= count;
    },

    // 学习技能
    learnSkill(skillId) {
      if (this.state.learnedSkills.includes(skillId)) return false;
      this.state.learnedSkills.push(skillId);
      return true;
    },

    // 设置技能冷却
    setSkillCooldown(skillId, cooldownMs) {
      this.state.skillCooldowns[skillId] = cooldownMs;
    },

    // 添加buff
    addBuff(buff) {
      // 移除同类型buff
      this.state.buffs = this.state.buffs.filter((b) => b.id !== buff.id);
      this.state.buffs.push(buff);
    },

    // 移除buff
    removeBuff(buffId) {
      this.state.buffs = this.state.buffs.filter((b) => b.id !== buffId);
    },

    // 设置战斗状态
    setCombatState(inCombat) {
      this.state.inCombat = inCombat;
    },

    // 复活
    revive() {
      this.state.hp = this.getters.maxHp;
      this.state.mp = this.getters.maxMp;
      this.state.position = { x: 0, y: 0, z: 5 };
      this.state.inCombat = false;

      if (this.state.mesh) {
        this.state.mesh.position.set(0, 0.9, 5);
      }
    },

    // 设置3D网格
    setMesh(mesh) {
      this.state.mesh = mesh;
    },

    // 创建3D模型
    createMesh() {
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
      const material = new THREE.MeshLambertMaterial({
        color: 0x00aaff,
        emissive: 0x002244,
      });

      this.state.mesh = new THREE.Mesh(geometry, material);
      this.state.mesh.position.set(this.state.position.x, this.state.position.y + 0.9, this.state.position.z);
      this.state.mesh.castShadow = true;
      this.state.mesh.receiveShadow = true;
      this.state.mesh.userData = { type: "player", entity: this };

      return this.state.mesh;
    },

    // 转换为存档数据
    toSaveData() {
      return {
        name: this.state.name,
        level: this.state.level,
        exp: this.state.exp,
        gold: this.state.gold,
        classId: this.state.classId,
        specializationId: this.state.specializationId,
        hp: this.state.hp,
        mp: this.state.mp,
        position: { ...this.state.position },
        inventory: [...this.state.inventory],
        equipment: { ...this.state.equipment },
        learnedSkills: [...this.state.learnedSkills],
        quests: [...this.state.quests],
        completedQuests: [...this.state.completedQuests],
        tutorialComplete: this.state.tutorialComplete,
        foundMysteriousElder: this.state.foundMysteriousElder,
      };
    },

    // 从存档数据恢复
    loadFromSaveData(data) {
      Object.assign(this.state, data);
      this.state.hp = Math.min(this.state.hp, this.getters.maxHp);
      this.state.mp = Math.min(this.state.mp, this.getters.maxMp);
      this.state.skillCooldowns = {};
      this.state.buffs = [];
    },
  },
});

export default playerStore;
export const usePlayerStore = () => playerStore;
