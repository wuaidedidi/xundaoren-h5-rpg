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
   * 创建3D模型 - 拼装简易小人
   */
  createMesh() {
    this.mesh = new THREE.Group();
    this.mesh.userData = { type: "player", entity: this };

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, emissive: 0x002244 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x0066aa });

    this.bodyParts = {};

    // 身体
    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.0, 12);
    this.bodyParts.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.bodyParts.body.position.y = 1.1;
    this.bodyParts.body.castShadow = true;
    this.mesh.add(this.bodyParts.body);

    // 头部
    const headGeom = new THREE.SphereGeometry(0.3, 16, 12);
    this.bodyParts.head = new THREE.Mesh(headGeom, skinMat);
    this.bodyParts.head.position.y = 1.85;
    this.bodyParts.head.castShadow = true;
    this.mesh.add(this.bodyParts.head);

    // 左臂
    this.bodyParts.leftArmGroup = new THREE.Group();
    this.bodyParts.leftArmGroup.position.set(-0.5, 1.4, 0);
    const leftArmGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8);
    this.bodyParts.leftArm = new THREE.Mesh(leftArmGeom, bodyMat);
    this.bodyParts.leftArm.position.y = -0.25;
    this.bodyParts.leftArm.castShadow = true;
    this.bodyParts.leftArmGroup.add(this.bodyParts.leftArm);
    this.mesh.add(this.bodyParts.leftArmGroup);

    // 右臂
    this.bodyParts.rightArmGroup = new THREE.Group();
    this.bodyParts.rightArmGroup.position.set(0.5, 1.4, 0);
    const rightArmGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8);
    this.bodyParts.rightArm = new THREE.Mesh(rightArmGeom, bodyMat);
    this.bodyParts.rightArm.position.y = -0.25;
    this.bodyParts.rightArm.castShadow = true;
    this.bodyParts.rightArmGroup.add(this.bodyParts.rightArm);
    this.mesh.add(this.bodyParts.rightArmGroup);

    // 左腿
    this.bodyParts.leftLegGroup = new THREE.Group();
    this.bodyParts.leftLegGroup.position.set(-0.18, 0.6, 0);
    const leftLegGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
    this.bodyParts.leftLeg = new THREE.Mesh(leftLegGeom, darkMat);
    this.bodyParts.leftLeg.position.y = -0.3;
    this.bodyParts.leftLeg.castShadow = true;
    this.bodyParts.leftLegGroup.add(this.bodyParts.leftLeg);
    this.mesh.add(this.bodyParts.leftLegGroup);

    // 右腿
    this.bodyParts.rightLegGroup = new THREE.Group();
    this.bodyParts.rightLegGroup.position.set(0.18, 0.6, 0);
    const rightLegGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
    this.bodyParts.rightLeg = new THREE.Mesh(rightLegGeom, darkMat);
    this.bodyParts.rightLeg.position.y = -0.3;
    this.bodyParts.rightLeg.castShadow = true;
    this.bodyParts.rightLegGroup.add(this.bodyParts.rightLeg);
    this.mesh.add(this.bodyParts.rightLegGroup);

    // 施法光效
    const glowGeom = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0 });
    this.bodyParts.leftGlow = new THREE.Mesh(glowGeom, glowMat.clone());
    this.bodyParts.rightGlow = new THREE.Mesh(glowGeom, glowMat.clone());
    this.bodyParts.leftGlow.position.set(0, -0.5, 0);
    this.bodyParts.rightGlow.position.set(0, -0.5, 0);
    this.bodyParts.leftArmGroup.add(this.bodyParts.leftGlow);
    this.bodyParts.rightArmGroup.add(this.bodyParts.rightGlow);

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    // 动画状态
    this.animationState = "idle";
    this.animationTime = 0;
    this.transitionProgress = 1;
    this.transitionDuration = 0.2;
    this.previousAnimationState = "idle";
    this.animationLockTime = 0; // 动画锁定时间，防止被打断

    return this.mesh;
  }

  /**
   * 更新位置和动画
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

      // 更新动画
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
   * 设置动画状态
   * @param {string} newState - 新动画状态
   * @param {number} lockDuration - 动画锁定时间（秒），期间不会被其他状态打断
   */
  setAnimationState(newState, lockDuration = 0) {
    if (this.animationState !== newState) {
      this.previousAnimationState = this.animationState;
      this.animationState = newState;
      this.transitionProgress = 0;
    }
    // 设置动画锁定时间
    if (lockDuration > 0) {
      this.animationLockTime = lockDuration;
    }
  }

  /**
   * 更新动画
   */
  updateAnimation(deltaTime) {
    if (!this.bodyParts) return;

    // 更新动画锁定时间
    if (this.animationLockTime > 0) {
      this.animationLockTime -= deltaTime;
    }

    this.animationTime += deltaTime;

    // 过渡进度
    if (this.transitionProgress < 1) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      this.transitionProgress = Math.min(1, this.transitionProgress);
    }

    const t = this.transitionProgress;
    const easeT = t * t * (3 - 2 * t); // smoothstep

    const currentPose = this.calculatePose(this.animationState, this.animationTime);
    const prevPose = this.calculatePose(this.previousAnimationState, this.animationTime);

    const pose = this.lerpPose(prevPose, currentPose, easeT);
    this.applyPose(pose);
  }

  /**
   * 计算姿势
   */
  calculatePose(state, time) {
    const pose = {
      bodyTilt: 0,
      bodyBob: 0,
      leftArmAngle: 0,
      rightArmAngle: 0,
      leftLegAngle: 0,
      rightLegAngle: 0,
      leftGlowOpacity: 0,
      rightGlowOpacity: 0,
    };

    switch (state) {
      case "idle":
        // 待机：轻微上下浮动
        pose.bodyBob = Math.sin(time * 2) * 0.03;
        pose.leftArmAngle = Math.sin(time * 1.5) * 0.05;
        pose.rightArmAngle = -Math.sin(time * 1.5) * 0.05;
        break;

      case "move":
        // 移动：身体前倾 + 手臂腿部摆动
        pose.bodyTilt = 0.15;
        pose.leftArmAngle = Math.sin(time * 10) * 0.6;
        pose.rightArmAngle = -Math.sin(time * 10) * 0.6;
        pose.leftLegAngle = -Math.sin(time * 10) * 0.5;
        pose.rightLegAngle = Math.sin(time * 10) * 0.5;
        break;

      case "attack":
        // 攻击：前冲挥手
        const attackPhase = (time % 0.5) / 0.5;
        if (attackPhase < 0.3) {
          // 蓄力后拉
          pose.rightArmAngle = -1.5 * (attackPhase / 0.3);
          pose.bodyTilt = 0.2 * (attackPhase / 0.3);
        } else {
          // 前冲挥击
          pose.rightArmAngle = -1.5 + 2.5 * ((attackPhase - 0.3) / 0.7);
          pose.bodyTilt = 0.2 + 0.1 * ((attackPhase - 0.3) / 0.7);
        }
        pose.leftArmAngle = -0.3;
        break;

      case "cast":
        // 施法：双手前伸发光
        pose.leftArmAngle = -Math.PI / 2;
        pose.rightArmAngle = -Math.PI / 2;
        pose.leftGlowOpacity = 0.5 + Math.sin(time * 8) * 0.3;
        pose.rightGlowOpacity = 0.5 + Math.sin(time * 8 + 1) * 0.3;
        pose.bodyBob = Math.sin(time * 3) * 0.02;
        break;
    }

    return pose;
  }

  /**
   * 插值姿势
   */
  lerpPose(poseA, poseB, t) {
    return {
      bodyTilt: poseA.bodyTilt + (poseB.bodyTilt - poseA.bodyTilt) * t,
      bodyBob: poseA.bodyBob + (poseB.bodyBob - poseA.bodyBob) * t,
      leftArmAngle: poseA.leftArmAngle + (poseB.leftArmAngle - poseA.leftArmAngle) * t,
      rightArmAngle: poseA.rightArmAngle + (poseB.rightArmAngle - poseA.rightArmAngle) * t,
      leftLegAngle: poseA.leftLegAngle + (poseB.leftLegAngle - poseA.leftLegAngle) * t,
      rightLegAngle: poseA.rightLegAngle + (poseB.rightLegAngle - poseA.rightLegAngle) * t,
      leftGlowOpacity: poseA.leftGlowOpacity + (poseB.leftGlowOpacity - poseA.leftGlowOpacity) * t,
      rightGlowOpacity: poseA.rightGlowOpacity + (poseB.rightGlowOpacity - poseA.rightGlowOpacity) * t,
    };
  }

  /**
   * 应用姿势
   */
  applyPose(pose) {
    // 身体倾斜和浮动
    this.bodyParts.body.rotation.x = pose.bodyTilt;
    this.bodyParts.body.position.y = 1.1 + pose.bodyBob;
    this.bodyParts.head.position.y = 1.85 + pose.bodyBob;

    // 手臂
    this.bodyParts.leftArmGroup.rotation.x = pose.leftArmAngle;
    this.bodyParts.rightArmGroup.rotation.x = pose.rightArmAngle;

    // 腿部
    this.bodyParts.leftLegGroup.rotation.x = pose.leftLegAngle;
    this.bodyParts.rightLegGroup.rotation.x = pose.rightLegAngle;

    // 施法光效
    this.bodyParts.leftGlow.material.opacity = pose.leftGlowOpacity;
    this.bodyParts.rightGlow.material.opacity = pose.rightGlowOpacity;
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
