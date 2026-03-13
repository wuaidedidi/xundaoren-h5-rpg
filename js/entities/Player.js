/**
 * 寻道人 - 玩家实体类
 * 基础几何体拼装角色模型
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

    // 角色身体部件
    this.bodyParts = {
      head: null,
      torso: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
    };

    // 动画状态
    this.animationState = "idle"; // idle, move, attack, cast
    this.animationTime = 0;
    this.targetAnimationState = "idle";
    this.animationTransition = 0;
    this.transitionDuration = 0.2; // 过渡时间（秒）

    // 动作持续时间
    this.actionDuration = 0;
    this.actionTimer = 0;

    // 施法特效
    this.castEffect = null;
    this.castGlow = null;
    this.castLight = null;

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
   * 用基础几何体拼装出简易小人
   */
  createMesh() {
    // 创建根容器
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.userData = { type: "player", entity: this };

    // 身体材质
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x00aaff,
      emissive: 0x002244,
    });

    // 头部 - 球体
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    this.bodyParts.head = new THREE.Mesh(headGeometry, bodyMaterial);
    this.bodyParts.head.position.set(0, 1.6, 0);
    this.bodyParts.head.castShadow = true;
    this.mesh.add(this.bodyParts.head);

    // 躯干 - 圆柱体
    const torsoGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.9, 16);
    this.bodyParts.torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    this.bodyParts.torso.position.set(0, 0.95, 0);
    this.bodyParts.torso.castShadow = true;
    this.mesh.add(this.bodyParts.torso);

    // 左臂 - 圆柱体
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
    this.bodyParts.leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.bodyParts.leftArm.position.set(0.45, 1.2, 0);
    this.bodyParts.leftArm.castShadow = true;
    // 设置旋转中心在肩膀
    this.bodyParts.leftArm.geometry.translate(0, -0.25, 0);
    this.mesh.add(this.bodyParts.leftArm);

    // 右臂 - 圆柱体
    this.bodyParts.rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.bodyParts.rightArm.position.set(-0.45, 1.2, 0);
    this.bodyParts.rightArm.castShadow = true;
    this.bodyParts.rightArm.geometry.translate(0, -0.25, 0);
    this.mesh.add(this.bodyParts.rightArm);

    // 左腿 - 圆柱体
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
    this.bodyParts.leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.bodyParts.leftLeg.position.set(0.2, 0.4, 0);
    this.bodyParts.leftLeg.castShadow = true;
    this.bodyParts.leftLeg.geometry.translate(0, -0.3, 0);
    this.mesh.add(this.bodyParts.leftLeg);

    // 右腿 - 圆柱体
    this.bodyParts.rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.bodyParts.rightLeg.position.set(-0.2, 0.4, 0);
    this.bodyParts.rightLeg.castShadow = true;
    this.bodyParts.rightLeg.geometry.translate(0, -0.3, 0);
    this.mesh.add(this.bodyParts.rightLeg);

    return this.mesh;
  }

  /**
   * 设置动画状态
   */
  setAnimationState(state, duration = 0) {
    if (this.targetAnimationState !== state) {
      this.targetAnimationState = state;
      this.animationTransition = 0;

      // 如果是攻击或施法，设置持续时间
      if (state === "attack" || state === "cast") {
        this.actionDuration = duration > 0 ? duration : 0.8;
        this.actionTimer = 0;
      }
    }
  }

  /**
   * 更新动画
   */
  updateAnimation(deltaTime) {
    this.animationTime += deltaTime;

    // 处理动画状态过渡
    if (this.animationState !== this.targetAnimationState) {
      this.animationTransition += deltaTime / this.transitionDuration;
      if (this.animationTransition >= 1) {
        this.animationTransition = 0;
        this.animationState = this.targetAnimationState;
      }
    }

    // 根据当前状态和目标状态插值
    const t = this.animationTransition;
    const currentPose = this.getAnimationPose(this.animationState, this.animationTime);
    const targetPose = this.getAnimationPose(this.targetAnimationState, this.animationTime);

    // 插值计算当前姿态
    const pose = {
      bodyY: this.lerp(currentPose.bodyY, targetPose.bodyY, t),
      bodyZ: this.lerp(currentPose.bodyZ || 0, targetPose.bodyZ || 0, t),
      bodyTiltX: this.lerp(currentPose.bodyTiltX, targetPose.bodyTiltX, t),
      bodyTiltZ: this.lerp(currentPose.bodyTiltZ, targetPose.bodyTiltZ, t),
      leftArmRotX: this.lerp(currentPose.leftArmRotX, targetPose.leftArmRotX, t),
      leftArmRotZ: this.lerp(currentPose.leftArmRotZ, targetPose.leftArmRotZ, t),
      rightArmRotX: this.lerp(currentPose.rightArmRotX, targetPose.rightArmRotX, t),
      rightArmRotZ: this.lerp(currentPose.rightArmRotZ, targetPose.rightArmRotZ, t),
      leftLegRotX: this.lerp(currentPose.leftLegRotX, targetPose.leftLegRotX, t),
      rightLegRotX: this.lerp(currentPose.rightLegRotX, targetPose.rightLegRotX, t),
    };

    // 应用姿态
    this.applyPose(pose);

    // 更新施法特效
    this.updateCastEffect(deltaTime);
  }

  /**
   * 获取指定动画状态的姿态
   */
  getAnimationPose(state, time) {
    const pose = {
      bodyY: 0,
      bodyZ: 0,
      bodyTiltX: 0,
      bodyTiltZ: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
    };

    switch (state) {
      case "idle":
        // 待机：轻微上下浮动
        pose.bodyY = Math.sin(time * 2) * 0.03;
        pose.leftArmRotZ = 0.1 + Math.sin(time * 1.5) * 0.05;
        pose.rightArmRotZ = -0.1 - Math.sin(time * 1.5 + 0.5) * 0.05;
        break;

      case "move":
        // 移动：身体前倾 + 手臂摆动
        pose.bodyTiltX = 0.15; // 前倾
        pose.bodyY = Math.abs(Math.sin(time * 8)) * 0.05;
        // 手臂摆动
        pose.leftArmRotX = Math.sin(time * 8) * 0.6;
        pose.rightArmRotX = Math.sin(time * 8 + Math.PI) * 0.6;
        // 腿部摆动
        pose.leftLegRotX = Math.sin(time * 8 + Math.PI) * 0.5;
        pose.rightLegRotX = Math.sin(time * 8) * 0.5;
        break;

      case "attack":
        // 攻击：前冲 + 挥手
        // 攻击周期：0-0.3秒准备，0.3-0.5秒挥击，0.5-0.8秒收回
        const attackTime = time % 0.8;
        if (attackTime < 0.3) {
          // 准备阶段：身体后仰，手臂后拉
          const t = attackTime / 0.3;
          pose.bodyTiltX = -0.15 * t; // 后仰
          pose.bodyZ = -0.2 * t; // 后移
          pose.rightArmRotX = -0.3 * t; // 手臂后拉
          pose.rightArmRotZ = 0.2;
        } else if (attackTime < 0.5) {
          // 挥击阶段：身体前倾，手臂前挥
          const t = (attackTime - 0.3) / 0.2;
          pose.bodyTiltX = 0.35 * t; // 前倾
          pose.bodyZ = 0.4 * t; // 前冲
          pose.rightArmRotX = -1.8 * t; // 手臂前挥
          pose.rightArmRotZ = 0.3;
        } else {
          // 收回阶段
          const t = (attackTime - 0.5) / 0.3;
          pose.bodyTiltX = 0.35 * (1 - t);
          pose.bodyZ = 0.4 * (1 - t);
          pose.rightArmRotX = -1.8 * (1 - t);
          pose.rightArmRotZ = 0.3 * (1 - t);
        }
        // 左臂平衡
        pose.leftArmRotX = 0.3;
        pose.leftArmRotZ = 0.2;
        // 腿部姿态
        pose.leftLegRotX = 0.1;
        pose.rightLegRotX = -0.1;
        break;

      case "cast":
        // 施法：双手前伸
        pose.bodyTiltX = 0.05;
        pose.leftArmRotX = -1.2 + Math.sin(time * 3) * 0.1;
        pose.rightArmRotX = -1.2 + Math.sin(time * 3 + 0.5) * 0.1;
        pose.leftArmRotZ = 0.2;
        pose.rightArmRotZ = -0.2;
        break;
    }

    return pose;
  }

  /**
   * 应用姿态到身体部件
   */
  applyPose(pose) {
    if (!this.mesh) return;

    // 身体整体位置和倾斜
    this.mesh.position.y = this.position.y + pose.bodyY;
    // 前冲效果：在角色朝向的方向上移动
    this.mesh.position.x = this.position.x + Math.sin(this.rotation) * (pose.bodyZ || 0);
    this.mesh.position.z = this.position.z + Math.cos(this.rotation) * (pose.bodyZ || 0);
    this.mesh.rotation.x = pose.bodyTiltX;
    this.mesh.rotation.z = pose.bodyTiltZ;

    // 手臂旋转
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.x = pose.leftArmRotX;
      this.bodyParts.leftArm.rotation.z = pose.leftArmRotZ;
    }
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.x = pose.rightArmRotX;
      this.bodyParts.rightArm.rotation.z = pose.rightArmRotZ;
    }

    // 腿部旋转
    if (this.bodyParts.leftLeg) {
      this.bodyParts.leftLeg.rotation.x = pose.leftLegRotX;
    }
    if (this.bodyParts.rightLeg) {
      this.bodyParts.rightLeg.rotation.x = pose.rightLegRotX;
    }
  }

  /**
   * 线性插值
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * 创建施法特效
   */
  createCastEffect() {
    if (this.castEffect) return;

    // 创建发光球体 - 更大的核心
    const geometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });

    this.castEffect = new THREE.Mesh(geometry, material);
    this.mesh.add(this.castEffect);

    // 添加外层光晕
    const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.3,
    });
    this.castGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.castGlow);

    // 添加点光源 - 更强的亮度
    this.castLight = new THREE.PointLight(0x00ffff, 2, 5);
    this.mesh.add(this.castLight);
  }

  /**
   * 移除施法特效
   */
  removeCastEffect() {
    if (this.castEffect) {
      this.mesh.remove(this.castEffect);
      this.castEffect = null;
    }
    if (this.castGlow) {
      this.mesh.remove(this.castGlow);
      this.castGlow = null;
    }
    if (this.castLight) {
      this.mesh.remove(this.castLight);
      this.castLight = null;
    }
  }

  /**
   * 更新施法特效
   */
  updateCastEffect(deltaTime) {
    // 检查是否应该显示特效（当前是施法状态，或正在过渡到施法状态）
    const shouldShowEffect =
      this.animationState === "cast" ||
      (this.targetAnimationState === "cast" && this.animationTransition > 0 && this.animationTransition < 1);

    if (shouldShowEffect) {
      if (!this.castEffect) {
        this.createCastEffect();
      }

      // 特效位置在双手前方
      const time = this.animationTime;
      const effectPos = {
        x: 0,
        y: 1.3,
        z: 0.6 + Math.sin(time * 5) * 0.08,
      };

      this.castEffect.position.set(effectPos.x, effectPos.y, effectPos.z);
      this.castEffect.scale.setScalar(1 + Math.sin(time * 8) * 0.3);

      // 更新光晕
      if (this.castGlow) {
        this.castGlow.position.copy(this.castEffect.position);
        this.castGlow.scale.setScalar(1.2 + Math.sin(time * 6) * 0.2);
      }

      if (this.castLight) {
        this.castLight.position.copy(this.castEffect.position);
        this.castLight.intensity = 1.5 + Math.sin(time * 10) * 0.8;
      }
    } else {
      this.removeCastEffect();
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

    // 更新3D对象位置和旋转
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
      this.mesh.rotation.y = this.rotation;
    }

    // 根据状态设置动画
    this.updateAnimationState(deltaTime);

    // 更新动画
    this.updateAnimation(deltaTime);

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
   * 根据当前状态更新动画状态
   */
  updateAnimationState(deltaTime) {
    // 如果有正在进行的动作（攻击/施法），检查是否完成
    if (this.actionDuration > 0) {
      this.actionTimer += deltaTime;
      if (this.actionTimer < this.actionDuration) {
        // 动作进行中，不改变状态
        return;
      } else {
        // 动作完成，重置
        this.actionDuration = 0;
        this.actionTimer = 0;
      }
    }

    let targetState = "idle";

    if (this.isMoving) {
      targetState = "move";
    }

    // 注意：攻击和施法状态由外部设置（Combat.js中调用）
    // 这里只处理待机和移动

    this.setAnimationState(targetState);
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
