/**
 * 寻道人 - 战斗系统
 * 处理战斗逻辑、伤害计算、技能释放
 */

import { getSkill } from "../data/skills.js";

export default class CombatSystem {
  constructor(game) {
    this.game = game;
    this.player = null;
    this.target = null;
    this.effects = null;
    this.lastAutoAttack = 0;
    this.autoAttackInterval = 1500;
    this.isAutoAttacking = true;
    this.attackCount = 0;
  }

  /**
   * 初始化
   */
  init(player) {
    this.player = player;
  }

  /**
   * 设置效果管理器
   */
  setEffectsManager(effects) {
    this.effects = effects;
  }

  /**
   * 设置目标
   */
  setTarget(target) {
    this.target = target;
    this.player.target = target;

    if (target) {
      this.player.inCombat = true;
    }

    // 显示目标选中圆圈
    if (this.effects) {
      this.effects.setTarget(target);
    }
  }

  /**
   * 清除目标
   */
  clearTarget() {
    this.target = null;
    this.player.target = null;
    this.player.inCombat = false;

    // 隐藏目标选中圆圈
    if (this.effects) {
      this.effects.clearTarget();
    }
  }

  /**
   * 更新战斗
   */
  update(deltaTime) {
    if (!this.target || this.target.isDead) {
      if (this.target && this.target.isDead) {
        this.clearTarget();
      }
      return null;
    }

    // 自动普攻
    if (this.isAutoAttacking) {
      const now = Date.now();
      if (now - this.lastAutoAttack >= this.autoAttackInterval) {
        const distance = this.getDistanceToTarget();
        if (distance <= 2.5) {
          // 近战范围
          this.lastAutoAttack = now;
          return this.autoAttack();
        }
      }
    }

    return null;
  }

  /**
   * 自动普攻
   */
  autoAttack() {
    if (!this.target || this.target.isDead) return null;

    this.attackCount = (this.attackCount || 0) + 1;
    const isCritical = this.attackCount % 3 === 0;

    let damageMultiplier = 1.0;
    if (isCritical) {
      damageMultiplier = 1.5;
    }

    const damage = this.calculateDamage(this.player.attack, this.target.defense, damageMultiplier);
    const actualDamage = this.target.takeDamage(damage);

    if (this.effects) {
      this.effects.playAttackAnimation(this.player);
      this.effects.playHitEffect(this.target);
      this.effects.playSkillEffect("punch", this.player, this.target);

      const targetPos = this.target.mesh ? this.target.mesh.position : this.target.position;
      if (isCritical) {
        this.effects.createFloatingText(targetPos, `${actualDamage}!`, "critical");
      } else {
        this.effects.createFloatingText(targetPos, `${actualDamage}`, "damage");
      }
    }

    const chargeBuff = this.player.buffs.find((b) => b.id === "charge");
    if (chargeBuff) {
      chargeBuff.consumed = true;
      this.player.buffs = this.player.buffs.filter((b) => b.id !== "charge");
    }

    const result = {
      type: "damage",
      source: "player",
      target: this.target,
      damage: actualDamage,
      skill: null,
      isCritical,
    };

    if (this.target.isDead) {
      result.killed = true;
      result.exp = this.target.exp;
      result.gold = this.target.gold;
      result.drops = this.target.getDrops();
    }

    return result;
  }

  /**
   * 使用技能
   */
  useSkill(skillId) {
    const skill = getSkill(skillId);
    if (!skill) return { success: false, message: "技能不存在" };

    // 检查是否已学习
    if (!this.player.learnedSkills.includes(skillId)) {
      return { success: false, message: "尚未学习此技能" };
    }

    // 检查冷却
    if (this.player.skillCooldowns[skillId]) {
      const remaining = Math.ceil(this.player.skillCooldowns[skillId] / 1000);
      return { success: false, message: `技能冷却中(${remaining}s)` };
    }

    // 检查法力
    if (skill.mpCost > this.player.mp) {
      return { success: false, message: "法力不足" };
    }

    // 执行技能
    const result = this.executeSkill(skill);

    if (result.success) {
      // 消耗法力
      this.player.useMp(skill.mpCost);

      // 设置冷却
      if (skill.cooldown > 0) {
        this.player.skillCooldowns[skillId] = skill.cooldown * 1000;
      }
    }

    return result;
  }

  /**
   * 执行技能
   */
  executeSkill(skill) {
    switch (skill.type) {
      case "physical":
      case "magic":
        return this.executeDamageSkill(skill);
      case "heal":
        return this.executeHealSkill(skill);
      case "buff":
        return this.executeBuffSkill(skill);
      case "movement":
        return this.executeMovementSkill(skill);
      case "control":
        return this.executeControlSkill(skill);
      case "debuff":
        return this.executeDebuffSkill(skill);
      default:
        return { success: false, message: "未知技能类型" };
    }
  }

  /**
   * 执行伤害技能
   */
  executeDamageSkill(skill) {
    if (!this.target || this.target.isDead) {
      return { success: false, message: "没有目标" };
    }

    const distance = this.getDistanceToTarget();
    if (distance > skill.range) {
      return { success: false, message: "目标距离过远" };
    }

    this.attackCount = (this.attackCount || 0) + 1;
    const isCritical = this.attackCount % 3 === 0;

    let damageMultiplier = skill.damage;
    if (isCritical) {
      damageMultiplier *= 1.5;
    }

    const baseDamage = skill.type === "magic" ? this.player.attack * 1.2 : this.player.attack;
    const damage = this.calculateDamage(baseDamage, this.target.defense, damageMultiplier);
    const actualDamage = this.target.takeDamage(damage);

    const result = {
      success: true,
      type: "damage",
      source: "player",
      damage: actualDamage,
      skill: skill,
      target: this.target,
      isCritical,
    };

    // 播放技能特效
    if (this.effects) {
      this.effects.playAttackAnimation(this.player);
      this.effects.playSkillEffect(skill.id, this.player, this.target);
      if (actualDamage > 0) {
        this.effects.playHitEffect(this.target);
      }

      const targetPos = this.target.mesh ? this.target.mesh.position : this.target.position;
      if (isCritical) {
        this.effects.createFloatingText(targetPos, `${actualDamage}!`, "critical");
      } else {
        this.effects.createFloatingText(targetPos, `${actualDamage}`, "damage");
      }
    }

    // 击退效果
    if (skill.knockback && !this.target.isDead) {
      const dx = this.target.position.x - this.player.position.x;
      const dz = this.target.position.z - this.player.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0) {
        this.target.position.x += (dx / dist) * skill.knockback;
        this.target.position.z += (dz / dist) * skill.knockback;
        if (this.target.mesh) {
          this.target.mesh.position.x = this.target.position.x;
          this.target.mesh.position.z = this.target.position.z;
        }
      }
    }

    // 目标死亡
    if (this.target.isDead) {
      result.killed = true;
      result.exp = this.target.exp;
      result.gold = this.target.gold;
      result.drops = this.target.getDrops();
    }

    return result;
  }

  /**
   * 执行治疗技能
   */
  executeHealSkill(skill) {
    if (skill.healPercent) {
      const duration = skill.duration || 5;
      const totalHeal = this.player.maxHp * skill.healPercent;

      if (duration > 0) {
        const healPerSecond = totalHeal / duration;

        this.player.buffs.push({
          id: skill.id,
          name: skill.name,
          type: "hot",
          healPerSecond,
          remaining: duration * 1000,
        });

        return {
          success: true,
          type: "buff",
          message: `${skill.name}：每秒回复生命`,
        };
      } else {
        const actualHeal = this.player.heal(Math.floor(totalHeal));

        if (this.effects && actualHeal > 0) {
          const playerPos = this.player.mesh ? this.player.mesh.position : this.player.position;
          this.effects.createFloatingText(playerPos, `+${actualHeal}`, "heal");
        }

        return {
          success: true,
          type: "heal",
          amount: actualHeal,
        };
      }
    }

    if (skill.healAmount) {
      const healAmount = Math.floor(this.player.maxHp * skill.healAmount);
      const actualHeal = this.player.heal(healAmount);

      if (this.effects && actualHeal > 0) {
        const playerPos = this.player.mesh ? this.player.mesh.position : this.player.position;
        this.effects.createFloatingText(playerPos, `+${actualHeal}`, "heal");
      }

      return {
        success: true,
        type: "heal",
        amount: actualHeal,
      };
    }

    return { success: true, type: "heal" };
  }

  /**
   * 执行增益技能
   */
  executeBuffSkill(skill) {
    const buff = {
      id: skill.id,
      name: skill.name,
      remaining: (skill.duration || 10) * 1000,
    };

    if (skill.damageBonus) buff.damageBonus = skill.damageBonus;
    if (skill.damageReduction) buff.damageReduction = skill.damageReduction;
    if (skill.shieldHits) buff.shieldHits = skill.shieldHits;

    // 移除同名buff
    this.player.buffs = this.player.buffs.filter((b) => b.id !== skill.id);
    this.player.buffs.push(buff);

    return {
      success: true,
      type: "buff",
      message: `${skill.name}已激活`,
    };
  }

  /**
   * 执行移动技能
   */
  executeMovementSkill(skill) {
    if (skill.distance) {
      const angle = this.player.rotation + Math.PI;
      this.player.position.x += Math.sin(angle) * skill.distance;
      this.player.position.z += Math.cos(angle) * skill.distance;

      if (this.player.mesh) {
        this.player.mesh.position.x = this.player.position.x;
        this.player.mesh.position.z = this.player.position.z;
      }

      if (this.effects && skill.id === "dodge") {
        const playerPos = this.player.mesh ? this.player.mesh.position : this.player.position;
        this.effects.createFloatingText(playerPos, "闪避", "dodge");
      }
    }

    return {
      success: true,
      type: "movement",
      message: `使用了${skill.name}`,
    };
  }

  /**
   * 执行控制技能
   */
  executeControlSkill(skill) {
    if (!this.target || this.target.isDead) {
      return { success: false, message: "没有目标" };
    }

    const distance = this.getDistanceToTarget();
    if (distance > skill.range) {
      return { success: false, message: "目标距离过远" };
    }

    // 定身效果
    if (skill.stunDuration) {
      this.target.state = "stunned";
      setTimeout(() => {
        if (!this.target.isDead) {
          this.target.state = "chase";
        }
      }, skill.stunDuration * 1000);
    }

    return {
      success: true,
      type: "control",
      message: `${this.target.name}被定身了`,
    };
  }

  /**
   * 执行减益技能
   */
  executeDebuffSkill(skill) {
    // AOE减益暂时简化处理
    return {
      success: true,
      type: "debuff",
      message: `${skill.name}已释放`,
    };
  }

  /**
   * 计算伤害
   */
  calculateDamage(attack, defense, multiplier) {
    const baseDamage = attack * multiplier;
    const reduction = defense * 0.5;
    return Math.max(1, Math.floor(baseDamage - reduction));
  }

  /**
   * 获取到目标的距离
   */
  getDistanceToTarget() {
    if (!this.target) return Infinity;

    const dx = this.target.position.x - this.player.position.x;
    const dz = this.target.position.z - this.player.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 处理怪物攻击
   */
  processMonsterAttack(attackData) {
    if (Math.random() < 0.1) {
      if (this.effects) {
        const playerPos = this.player.mesh ? this.player.mesh.position : this.player.position;
        this.effects.createFloatingText(playerPos, "闪避", "dodge");
      }
      return {
        type: "dodge",
        source: "monster",
        attacker: attackData.target,
        damage: 0,
        playerHp: this.player.hp,
        playerMaxHp: this.player.maxHp,
      };
    }

    const damage = this.player.takeDamage(attackData.damage);

    if (this.effects) {
      this.effects.playMonsterWindup(attackData.target);
      if (damage > 0) {
        this.effects.playHitEffect(this.player);
        this.effects.playGenericHit(this.player.position);

        const playerPos = this.player.mesh ? this.player.mesh.position : this.player.position;
        this.effects.createFloatingText(playerPos, `${damage}`, "damage");
      }
    }

    return {
      type: "damage",
      source: "monster",
      attacker: attackData.target,
      damage: damage,
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
    };
  }
}
