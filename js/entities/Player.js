/**
 * 寻道人 - 玩家实体类
 * 圆柱体作为角色模型
 */

import { getRealmByLevel, getExpRequired, getRealmBonus } from "../data/realms.js";
import { getClass, getSpecialization } from "../data/classes.js";
import { getBaseSkills, getClassSkills } from "../data/skills.js";
import { usePlayerStore } from "../store/playerStore.js";

export default class Player {
  constructor(name = "玩家") {
    this.store = usePlayerStore;

    if (name !== "玩家") {
      this.store.actions.init({
        name,
        level: 0,
        exp: 0,
        gold: 100,
        hp: 100,
        mp: 50,
      });
    }

    this.target = null;
    this.lastAttackTime = 0;
    this.attackCooldown = 1000;
    this.mesh = null;
    this.nameTag = null;
  }

  get name() {
    return this.store.state.name;
  }
  set name(value) {
    this.store.actions.init({ name: value });
  }

  get level() {
    return this.store.state.level;
  }
  set level(value) {
    this.store.$patch({ level: value });
  }

  get exp() {
    return this.store.state.exp;
  }
  set exp(value) {
    this.store.$patch({ exp: value });
  }

  get gold() {
    return this.store.state.gold;
  }
  set gold(value) {
    this.store.$patch({ gold: value });
  }

  get classId() {
    return this.store.state.classId;
  }
  set classId(value) {
    this.store.$patch({ classId: value });
  }

  get specializationId() {
    return this.store.state.specializationId;
  }
  set specializationId(value) {
    this.store.$patch({ specializationId: value });
  }

  get baseHp() {
    return this.store.state.baseHp;
  }
  set baseHp(value) {
    this.store.$patch({ baseHp: value });
  }
  get baseMp() {
    return this.store.state.baseMp;
  }
  set baseMp(value) {
    this.store.$patch({ baseMp: value });
  }
  get baseAttack() {
    return this.store.state.baseAttack;
  }
  set baseAttack(value) {
    this.store.$patch({ baseAttack: value });
  }
  get baseDefense() {
    return this.store.state.baseDefense;
  }
  set baseDefense(value) {
    this.store.$patch({ baseDefense: value });
  }
  get baseSpeed() {
    return this.store.state.baseSpeed;
  }
  set baseSpeed(value) {
    this.store.$patch({ baseSpeed: value });
  }

  get hp() {
    return this.store.state.hp;
  }
  set hp(value) {
    this.store.$patch({ hp: value });
  }

  get mp() {
    return this.store.state.mp;
  }
  set mp(value) {
    this.store.$patch({ mp: value });
  }

  get position() {
    return this.store.state.position;
  }
  get rotation() {
    return this.store.state.rotation;
  }
  set rotation(value) {
    this.store.actions.setRotation(value);
  }

  get isMoving() {
    return this.store.state.isMoving;
  }
  set isMoving(value) {
    this.store.$patch({ isMoving: value });
  }

  get inCombat() {
    return this.store.state.inCombat;
  }
  set inCombat(value) {
    this.store.$patch({ inCombat: value });
  }

  get inventory() {
    return this.store.state.inventory;
  }
  get maxInventory() {
    return this.store.state.maxInventory;
  }
  get equipment() {
    return this.store.state.equipment;
  }
  get buffs() {
    return this.store.state.buffs;
  }
  get learnedSkills() {
    return this.store.state.learnedSkills;
  }
  get skillCooldowns() {
    return this.store.state.skillCooldowns;
  }
  get quests() {
    return this.store.state.quests;
  }
  get completedQuests() {
    return this.store.state.completedQuests;
  }
  get tutorialComplete() {
    return this.store.state.tutorialComplete;
  }
  set tutorialComplete(value) {
    this.store.$patch({ tutorialComplete: value });
  }
  get foundMysteriousElder() {
    return this.store.state.foundMysteriousElder;
  }
  set foundMysteriousElder(value) {
    this.store.$patch({ foundMysteriousElder: value });
  }

  /**
   * 计算当前境界
   */
  get realm() {
    return getRealmByLevel(this.level);
  }

  /**
   * 计算最大生命值
   */
  get maxHp() {
    let base = this.baseHp;

    // 职业加成
    if (this.classId) {
      const cls = getClass(this.classId);
      if (cls) base = cls.baseStats.hp;
    }

    // 专精加成
    if (this.classId && this.specializationId) {
      const spec = getSpecialization(this.classId, this.specializationId);
      if (spec && spec.bonusStats.hp) {
        base *= spec.bonusStats.hp;
      }
    }

    // 境界加成
    base *= getRealmBonus(this.level);

    // 装备加成
    if (this.equipment.armor && this.equipment.armor.stats.hp) {
      base += this.equipment.armor.stats.hp;
    }

    return Math.floor(base);
  }

  /**
   * 计算最大法力值
   */
  get maxMp() {
    let base = this.baseMp;

    if (this.classId) {
      const cls = getClass(this.classId);
      if (cls) base = cls.baseStats.mp;
    }

    if (this.classId && this.specializationId) {
      const spec = getSpecialization(this.classId, this.specializationId);
      if (spec && spec.bonusStats.mp) {
        base *= spec.bonusStats.mp;
      }
    }

    base *= getRealmBonus(this.level);

    return Math.floor(base);
  }

  /**
   * 计算攻击力
   */
  get attack() {
    let base = this.baseAttack;

    if (this.classId) {
      const cls = getClass(this.classId);
      if (cls) base = cls.baseStats.attack;
    }

    if (this.classId && this.specializationId) {
      const spec = getSpecialization(this.classId, this.specializationId);
      if (spec && spec.bonusStats.attack) {
        base *= spec.bonusStats.attack;
      }
    }

    base *= getRealmBonus(this.level);

    if (this.equipment.weapon && this.equipment.weapon.stats.attack) {
      base += this.equipment.weapon.stats.attack;
    }

    // 蓄力buff
    const chargeBuff = this.buffs.find((b) => b.id === "charge");
    if (chargeBuff) {
      base *= 1 + chargeBuff.damageBonus;
    }

    return Math.floor(base);
  }

  /**
   * 计算防御力
   */
  get defense() {
    let base = this.baseDefense;

    if (this.classId) {
      const cls = getClass(this.classId);
      if (cls) base = cls.baseStats.defense;
    }

    if (this.classId && this.specializationId) {
      const spec = getSpecialization(this.classId, this.specializationId);
      if (spec && spec.bonusStats.defense) {
        base *= spec.bonusStats.defense;
      }
    }

    base *= getRealmBonus(this.level);

    if (this.equipment.armor && this.equipment.armor.stats.defense) {
      base += this.equipment.armor.stats.defense;
    }

    return Math.floor(base);
  }

  /**
   * 计算移动速度
   */
  get speed() {
    let base = this.baseSpeed;

    if (this.classId) {
      const cls = getClass(this.classId);
      if (cls) base = cls.baseStats.speed;
    }

    return base;
  }

  /**
   * 获取职业名称
   */
  get className() {
    if (!this.classId) return null;
    const cls = getClass(this.classId);
    return cls ? cls.name : null;
  }

  /**
   * 获取专精名称
   */
  get specializationName() {
    if (!this.classId || !this.specializationId) return null;
    const spec = getSpecialization(this.classId, this.specializationId);
    return spec ? spec.name : null;
  }

  /**
   * 创建3D模型
   */
  createMesh() {
    // 创建圆柱体（角色）
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
    const material = new THREE.MeshLambertMaterial({
      color: 0x00aaff,
      emissive: 0x002244,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y + 0.9, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { type: "player", entity: this };

    return this.mesh;
  }

  /**
   * 更新位置
   */
  update(deltaTime, direction) {
    // 移动处理
    if (direction.x !== 0 || direction.z !== 0) {
      const moveSpeed = this.speed * deltaTime * 5;

      this.position.x += direction.x * moveSpeed;
      this.position.z += direction.z * moveSpeed;

      // 旋转朝向移动方向
      this.rotation = Math.atan2(direction.x, direction.z);

      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // 更新3D对象
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
      this.mesh.rotation.y = this.rotation;
    }

    // 更新buff持续时间
    this.updateBuffs(deltaTime);

    // 更新技能冷却
    this.updateCooldowns(deltaTime);

    // 生命/法力回复（脱战时）
    if (!this.inCombat) {
      this.regenTick(deltaTime);
    }
  }

  /**
   * 更新buff
   */
  updateBuffs(deltaTime) {
    this.store.actions.updateBuffs(deltaTime);
  }

  /**
   * 更新冷却
   */
  updateCooldowns(deltaTime) {
    this.store.actions.updateCooldowns(deltaTime);
  }

  /**
   * 脱战回复
   */
  regenTick(deltaTime) {
    this.store.actions.regenTick(deltaTime);
  }

  /**
   * 受到伤害
   */
  takeDamage(amount) {
    return this.store.actions.takeDamage(amount);
  }

  /**
   * 治疗
   */
  heal(amount) {
    return this.store.actions.heal(amount);
  }

  /**
   * 消耗法力
   */
  useMp(amount) {
    return this.store.actions.useMp(amount);
  }

  /**
   * 获得经验
   */
  gainExp(amount) {
    return this.store.actions.gainExp(amount);
  }

  /**
   * 获得金币
   */
  gainGold(amount) {
    return this.store.actions.gainGold(amount);
  }

  /**
   * 选择职业
   */
  learnSkill(skillId) {
    return this.store.actions.learnSkill(skillId);
  }

  unlearnSkill(skillId) {
    this.store.actions.unlearnSkill(skillId);
  }

  selectClass(classId) {
    if (this.level < 10) return false;
    if (this.classId) return false;

    this.store.actions.setClass(classId);

    // 学习职业技能
    const classSkills = getClassSkills(classId);
    classSkills.forEach((skill) => {
      this.store.actions.learnSkill(skill.id);
    });

    // 更新属性
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    return true;
  }

  /**
   * 选择专精
   */
  selectSpecialization(specId) {
    if (this.level < 30) return false;
    if (!this.classId) return false;
    if (this.specializationId) return false;

    const spec = getSpecialization(this.classId, specId);
    if (!spec) return false;

    this.specializationId = specId;

    // 更新属性
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    return true;
  }

  /**
   * 添加物品到背包
   */
  addItem(item, count = 1) {
    return this.store.actions.addItem(item, count);
  }

  /**
   * 移除物品
   */
  removeItem(itemId, count = 1) {
    return this.store.actions.removeItem(itemId, count);
  }

  addBuff(buff) {
    this.store.actions.addBuff(buff);
  }

  removeBuff(buffId) {
    this.store.actions.removeBuff(buffId);
  }

  setCooldown(skillId, cooldownMs) {
    this.store.actions.setCooldown(skillId, cooldownMs);
  }

  /**
   * 检查是否有物品
   */
  hasItem(itemId, count = 1) {
    const item = this.inventory.find((inv) => inv.itemId === itemId);
    return item && item.count >= count;
  }

  /**
   * 边界检查
   */
  clampPosition(minX, maxX, minZ, maxZ) {
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));

    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
    }
  }

  /**
   * 转换为存档数据
   */
  toSaveData() {
    return {
      name: this.name,
      level: this.level,
      exp: this.exp,
      gold: this.gold,
      classId: this.classId,
      specializationId: this.specializationId,
      hp: this.hp,
      mp: this.mp,
      position: { ...this.position },
      inventory: [...this.inventory],
      equipment: { ...this.equipment },
      learnedSkills: [...this.learnedSkills],
      quests: [...this.quests],
      completedQuests: [...this.completedQuests],
      tutorialComplete: this.tutorialComplete,
      foundMysteriousElder: this.foundMysteriousElder,
    };
  }

  /**
   * 从存档数据恢复
   */
  loadFromSaveData(data) {
    Object.assign(this, data);
    this.hp = Math.min(this.hp, this.maxHp);
    this.mp = Math.min(this.mp, this.maxMp);
  }
}
