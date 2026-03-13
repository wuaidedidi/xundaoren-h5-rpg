/**
 * 寻道人 - 玩家实体类
 * 圆柱体作为角色模型
 */

import { getRealmByLevel, getExpRequired, getRealmBonus } from "../data/realms.js";
import { getClass, getSpecialization } from "../data/classes.js";
import { getBaseSkills, getClassSkills } from "../data/skills.js";

export default class Player {
  constructor(name = "玩家") {
    // 基础信息
    this.name = name;
    this.level = 0;
    this.exp = 0;
    this.gold = 100;

    // 职业信息
    this.classId = null;
    this.specializationId = null;

    // 基础属性
    this.baseHp = 100;
    this.baseMp = 50;
    this.baseAttack = 10;
    this.baseDefense = 5;
    this.baseSpeed = 5;

    // 装备（需要在hp/mp计算前初始化）
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null,
    };

    // 增益效果
    this.buffs = [];

    // 当前属性
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    // 位置和移动
    this.position = { x: 0, y: 0, z: 5 };
    this.rotation = 0;
    this.isMoving = false;
    this.velocity = { x: 0, z: 0 };

    // 战斗状态
    this.target = null;
    this.inCombat = false;
    this.lastAttackTime = 0;
    this.attackCooldown = 1000; // 普攻冷却1秒
    this.lastSkillTime = 0;
    this.lastSkillType = null;

    // 技能冷却
    this.skillCooldowns = {};

    // 背包
    this.inventory = [];
    this.maxInventory = 24;

    // 已学技能
    this.learnedSkills = ["punch", "breathe", "dodge", "charge"];

    // 任务进度
    this.quests = [];
    this.completedQuests = [];

    // 3D对象
    this.mesh = null;
    this.nameTag = null;

    // 标记
    this.tutorialComplete = false;
    this.foundMysteriousElder = false;
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
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.userData = { type: "player", entity: this };

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, emissive: 0x002244 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffe0bd });
    const limbMat = new THREE.MeshLambertMaterial({ color: 0x3366cc });

    const bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.body.position.y = 1.0;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    const headGeom = new THREE.SphereGeometry(0.25, 16, 16);
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.y = 1.6;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    const armGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    this.leftArm = new THREE.Mesh(armGeom, limbMat);
    this.leftArm.position.set(-0.4, 1.1, 0);
    this.leftArm.rotation.z = Math.PI / 8;
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, limbMat);
    this.rightArm.position.set(0.4, 1.1, 0);
    this.rightArm.rotation.z = -Math.PI / 8;
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    const legGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
    this.leftLeg = new THREE.Mesh(legGeom, limbMat);
    this.leftLeg.position.set(-0.2, 0.35, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, limbMat);
    this.rightLeg.position.set(0.2, 0.35, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    this.animationTime = 0;
    this.currentState = "idle";
    this.targetState = "idle";
    this.blendWeight = 1;
    this.blendSpeed = 5;

    this.bodyBaseY = 1.0;
    this.headBaseY = 1.6;
    this.leftArmBase = { x: -0.4, y: 1.1, rotZ: Math.PI / 8, rotX: 0 };
    this.rightArmBase = { x: 0.4, y: 1.1, rotZ: -Math.PI / 8, rotX: 0 };
    this.leftLegBase = { x: -0.2, y: 0.35, rotX: 0 };
    this.rightLegBase = { x: 0.2, y: 0.35, rotX: 0 };

    return this.mesh;
  }

  resetPose() {
    this.body.position.y = this.bodyBaseY;
    this.head.position.y = this.headBaseY;
    this.head.rotation.x = 0;
    this.body.rotation.x = 0;

    this.leftArm.position.x = this.leftArmBase.x;
    this.leftArm.position.y = this.leftArmBase.y;
    this.leftArm.rotation.z = this.leftArmBase.rotZ;
    this.leftArm.rotation.x = this.leftArmBase.rotX;

    this.rightArm.position.x = this.rightArmBase.x;
    this.rightArm.position.y = this.rightArmBase.y;
    this.rightArm.rotation.z = this.rightArmBase.rotZ;
    this.rightArm.rotation.x = this.rightArmBase.rotX;

    this.leftLeg.position.x = this.leftLegBase.x;
    this.leftLeg.position.y = this.leftLegBase.y;
    this.leftLeg.rotation.x = this.leftLegBase.rotX;

    this.rightLeg.position.x = this.rightLegBase.x;
    this.rightLeg.position.y = this.rightLegBase.y;
    this.rightLeg.rotation.x = this.rightLegBase.rotX;
  }

  idlePose() {
    const bob = Math.sin(this.animationTime * 2) * 0.05;
    this.body.position.y = this.bodyBaseY + bob;
    this.head.position.y = this.headBaseY + bob;
  }

  walkPose() {
    const swing = Math.sin(this.animationTime * 8) * 0.3;
    const lift = Math.abs(Math.sin(this.animationTime * 8)) * 0.1;

    this.body.rotation.x = 0.15;
    this.body.position.y = this.bodyBaseY - 0.05 + Math.sin(this.animationTime * 4) * 0.03;
    this.head.position.y = this.headBaseY + Math.sin(this.animationTime * 4) * 0.03;

    this.leftArm.rotation.x = -swing;
    this.rightArm.rotation.x = swing;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;

    this.leftLeg.position.y = this.leftLegBase.y + (swing > 0 ? lift : 0);
    this.rightLeg.position.y = this.rightLegBase.y + (swing < 0 ? lift : 0);
  }

  attackPose() {
    const punch = Math.min(1, this.animationTime * 5);
    const recoil = Math.max(0, Math.sin(this.animationTime * 10) * 0.2);

    this.body.rotation.x = 0.3;
    this.body.position.y = this.bodyBaseY - punch * 0.1;

    this.rightArm.rotation.x = -Math.PI / 2 + punch * 0.8 - recoil;
    this.rightArm.position.y = this.rightArmBase.y + punch * 0.2;
    this.leftArm.rotation.x = 0.3;

    this.head.rotation.x = 0.1;
  }

  castPose() {
    const glow = 0.5 + Math.sin(this.animationTime * 6) * 0.5;

    this.body.position.y = this.bodyBaseY + Math.sin(this.animationTime * 3) * 0.05;
    this.head.rotation.x = -0.1;

    this.leftArm.rotation.x = -Math.PI / 3;
    this.leftArm.rotation.z = 0;
    this.leftArm.position.x = -0.2;
    this.leftArm.position.y = 1.3;

    this.rightArm.rotation.x = -Math.PI / 3;
    this.rightArm.rotation.z = 0;
    this.rightArm.position.x = 0.2;
    this.rightArm.position.y = 1.3;

    if (this.body.material.emissive) {
      this.body.material.emissive.setRGB(glow * 0.2, glow * 0.2, glow * 0.5);
    }
  }

  blendPoses(poseFunc1, poseFunc2, weight) {
    this.resetPose();

    const tempGroup = new THREE.Group();
    tempGroup.add(this.body.clone());
    tempGroup.add(this.head.clone());
    tempGroup.add(this.leftArm.clone());
    tempGroup.add(this.rightArm.clone());
    tempGroup.add(this.leftLeg.clone());
    tempGroup.add(this.rightLeg.clone());

    poseFunc1.call(this);

    const p1 = {
      body: { y: this.body.position.y, rotX: this.body.rotation.x },
      head: { y: this.head.position.y, rotX: this.head.rotation.x },
      leftArm: {
        x: this.leftArm.position.x,
        y: this.leftArm.position.y,
        rotX: this.leftArm.rotation.x,
        rotZ: this.leftArm.rotation.z,
      },
      rightArm: {
        x: this.rightArm.position.x,
        y: this.rightArm.position.y,
        rotX: this.rightArm.rotation.x,
        rotZ: this.rightArm.rotation.z,
      },
      leftLeg: { x: this.leftLeg.position.x, y: this.leftLeg.position.y, rotX: this.leftLeg.rotation.x },
      rightLeg: { x: this.rightLeg.position.x, y: this.rightLeg.position.y, rotX: this.rightLeg.rotation.x },
    };

    this.resetPose();
    poseFunc2.call(this);

    this.body.position.y = p1.body.y * (1 - weight) + this.body.position.y * weight;
    this.body.rotation.x = p1.body.rotX * (1 - weight) + this.body.rotation.x * weight;
    this.head.position.y = p1.head.y * (1 - weight) + this.head.position.y * weight;
    this.head.rotation.x = p1.head.rotX * (1 - weight) + this.head.rotation.x * weight;

    this.leftArm.position.x = p1.leftArm.x * (1 - weight) + this.leftArm.position.x * weight;
    this.leftArm.position.y = p1.leftArm.y * (1 - weight) + this.leftArm.position.y * weight;
    this.leftArm.rotation.x = p1.leftArm.rotX * (1 - weight) + this.leftArm.rotation.x * weight;
    this.leftArm.rotation.z = p1.leftArm.rotZ * (1 - weight) + this.leftArm.rotation.z * weight;

    this.rightArm.position.x = p1.rightArm.x * (1 - weight) + this.rightArm.position.x * weight;
    this.rightArm.position.y = p1.rightArm.y * (1 - weight) + this.rightArm.position.y * weight;
    this.rightArm.rotation.x = p1.rightArm.rotX * (1 - weight) + this.rightArm.rotation.x * weight;
    this.rightArm.rotation.z = p1.rightArm.rotZ * (1 - weight) + this.rightArm.rotation.z * weight;

    this.leftLeg.position.x = p1.leftLeg.x * (1 - weight) + this.leftLeg.position.x * weight;
    this.leftLeg.position.y = p1.leftLeg.y * (1 - weight) + this.leftLeg.position.y * weight;
    this.leftLeg.rotation.x = p1.leftLeg.rotX * (1 - weight) + this.leftLeg.rotation.x * weight;

    this.rightLeg.position.x = p1.rightLeg.x * (1 - weight) + this.rightLeg.position.x * weight;
    this.rightLeg.position.y = p1.rightLeg.y * (1 - weight) + this.rightLeg.position.y * weight;
    this.rightLeg.rotation.x = p1.rightLeg.rotX * (1 - weight) + this.rightLeg.rotation.x * weight;
  }

  updateAnimation(deltaTime) {
    this.animationTime += deltaTime;

    if (this.currentState !== this.targetState) {
      this.blendWeight += deltaTime * this.blendSpeed;
      if (this.blendWeight >= 1) {
        this.blendWeight = 1;
        this.currentState = this.targetState;
      }
    } else {
      this.blendWeight = 1;
    }

    this.resetPose();

    if (this.currentState === this.targetState) {
      switch (this.currentState) {
        case "idle":
          this.idlePose();
          break;
        case "walk":
          this.walkPose();
          break;
        case "attack":
          this.attackPose();
          break;
        case "cast":
          this.castPose();
          break;
      }
    } else {
      const poses = {
        idle: this.idlePose,
        walk: this.walkPose,
        attack: this.attackPose,
        cast: this.castPose,
      };
      this.blendPoses(poses[this.currentState], poses[this.targetState], this.blendWeight);
    }

    if (this.currentState !== "cast" && this.targetState !== "cast") {
      if (this.body.material.emissive) {
        this.body.material.emissive.setRGB(0, 0.08, 0.16);
      }
    }
  }

  setAnimationState(state) {
    if (this.targetState !== state) {
      this.targetState = state;
      this.blendWeight = 0;
      if (state === "attack" || state === "cast") {
        this.animationTime = 0;
      }
    }
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

    // 动画状态机
    const now = Date.now();
    const timeSinceSkill = now - this.lastSkillTime;
    const timeSinceAttack = now - this.lastAttackTime;

    if (this.lastSkillType === "magic" && timeSinceSkill < 1000) {
      this.setAnimationState("cast");
    } else if (timeSinceAttack < 500 || (this.inCombat && this.target)) {
      this.setAnimationState("attack");
    } else if (this.isMoving) {
      this.setAnimationState("walk");
    } else {
      this.setAnimationState("idle");
    }

    // 更新动画
    if (this.mesh && this.updateAnimation) {
      this.updateAnimation(deltaTime);
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
    this.buffs = this.buffs.filter((buff) => {
      buff.remaining -= deltaTime * 1000;
      return buff.remaining > 0;
    });
  }

  /**
   * 更新冷却
   */
  updateCooldowns(deltaTime) {
    for (const skillId in this.skillCooldowns) {
      this.skillCooldowns[skillId] -= deltaTime * 1000;
      if (this.skillCooldowns[skillId] <= 0) {
        delete this.skillCooldowns[skillId];
      }
    }
  }

  /**
   * 脱战回复
   */
  regenTick(deltaTime) {
    // 每秒回复1%
    const regenRate = 0.01 * deltaTime;
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regenRate);
    this.mp = Math.min(this.maxMp, this.mp + this.maxMp * regenRate);
  }

  /**
   * 受到伤害
   */
  takeDamage(amount) {
    // 检查金刚不坏buff
    const vajraBuff = this.buffs.find((b) => b.id === "vajraBody");
    if (vajraBuff) {
      amount *= 1 - vajraBuff.damageReduction;
    }

    // 检查灵盾buff
    const shieldBuff = this.buffs.find((b) => b.id === "spiritShield");
    if (shieldBuff) {
      this.buffs = this.buffs.filter((b) => b.id !== "spiritShield");
      return 0; // 完全吸收
    }

    const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
    this.hp = Math.max(0, this.hp - finalDamage);
    this.inCombat = true;

    return finalDamage;
  }

  /**
   * 治疗
   */
  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    this.hp += actualHeal;
    return actualHeal;
  }

  /**
   * 消耗法力
   */
  useMp(amount) {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  /**
   * 获得经验
   */
  gainExp(amount) {
    // 设置蓄力buff使用后清除
    const chargeBuff = this.buffs.find((b) => b.id === "charge" && b.consumed);
    if (chargeBuff) {
      this.buffs = this.buffs.filter((b) => b !== chargeBuff);
    }

    this.exp += amount;

    const results = [];

    // 检查升级
    while (this.level < 81) {
      const required = getExpRequired(this.level);
      if (this.exp >= required) {
        this.exp -= required;
        this.level++;
        results.push({ type: "levelUp", level: this.level });

        // 升级回满血蓝
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        // 检查境界突破
        const newRealm = getRealmByLevel(this.level);
        const oldRealm = getRealmByLevel(this.level - 1);
        if (newRealm.name !== oldRealm.name) {
          results.push({ type: "realmUp", realm: newRealm.name });
        }
      } else {
        break;
      }
    }

    return results;
  }

  /**
   * 获得金币
   */
  gainGold(amount) {
    this.gold += amount;
  }

  /**
   * 选择职业
   */
  selectClass(classId) {
    if (this.level < 10) return false;
    if (this.classId) return false;

    this.classId = classId;

    // 学习职业技能
    const classSkills = getClassSkills(classId);
    classSkills.forEach((skill) => {
      if (!this.learnedSkills.includes(skill.id)) {
        this.learnedSkills.push(skill.id);
      }
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
    // 检查是否可堆叠
    if (item.stackable) {
      const existing = this.inventory.find((inv) => inv.itemId === item.id);
      if (existing) {
        existing.count = Math.min(item.maxStack, existing.count + count);
        return true;
      }
    }

    // 检查背包空间
    if (this.inventory.length >= this.maxInventory) {
      return false;
    }

    this.inventory.push({ itemId: item.id, count });
    return true;
  }

  /**
   * 移除物品
   */
  removeItem(itemId, count = 1) {
    const index = this.inventory.findIndex((inv) => inv.itemId === itemId);
    if (index === -1) return false;

    this.inventory[index].count -= count;
    if (this.inventory[index].count <= 0) {
      this.inventory.splice(index, 1);
    }

    return true;
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
