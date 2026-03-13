/**
 * 寻道人 - 怪物实体类
 * 差异化3D模型表现
 */

import { getMonster } from "../data/monsters.js";

export default class Monster {
  constructor(monsterId, position = { x: 0, y: 0, z: 0 }) {
    const config = getMonster(monsterId);
    if (!config) {
      throw new Error(`Unknown monster: ${monsterId}`);
    }

    // 复制配置
    this.id = monsterId;
    this.name = config.name;
    this.level = config.level;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.attack = config.attack;
    this.defense = config.defense;
    this.speed = config.speed;
    this.exp = config.exp;
    this.gold = config.gold;
    this.color = config.color;
    this.size = config.size;
    this.aggroRange = config.aggroRange;
    this.attackRange = config.attackRange;
    this.drops = config.drops;

    // 3D表现配置
    this.monsterType = config.monsterType || "default";
    this.emissiveIntensity = config.emissiveIntensity || 0.1;
    this.isElite = config.isElite || false;
    this.eliteColor = config.eliteColor || 0xff0000;

    // 精英怪体型放大1.5倍
    this.scaleMultiplier = this.isElite ? 1.5 : 1.0;

    // 位置
    this.position = { ...position };
    this.spawnPosition = { ...position };
    this.rotation = 0;

    // AI状态
    this.state = "idle"; // idle, patrol, chase, attack, return
    this.target = null;
    this.patrolTarget = null;
    this.lastAttackTime = 0;
    this.attackCooldown = 1500;

    // 巡逻相关
    this.patrolRadius = 5;
    this.patrolTimer = 0;
    this.patrolInterval = 3000 + Math.random() * 2000;

    // 3D对象
    this.mesh = null;
    this.eliteRing = null; // 精英怪脚底光圈

    // 状态
    this.isDead = false;
    this.respawnTime = 10000; // 10秒后重生
    this.deadTimer = 0;

    // 受击闪烁相关
    this.isFlashing = false;
    this.flashTimer = 0;
    this.originalMaterials = []; // 存储原始材质

    // 唯一标识
    this.uuid = Math.random().toString(36).substr(2, 9);
  }

  /**
   * 创建3D模型 - 根据怪物类型差异化
   */
  createMesh() {
    // 创建怪物主体
    this.mesh = new THREE.Group();

    // 先设置用户数据，这样子对象可以引用
    this.mesh.userData = { type: "monster", entity: this };

    switch (this.monsterType) {
      case "rabbit":
        this.createRabbitMesh();
        break;
      case "wood":
        this.createWoodSpiritMesh();
        break;
      case "stone":
        this.createStoneGolemMesh();
        break;
      default:
        this.createDefaultMesh();
    }

    // 应用体型缩放（精英怪1.5倍）
    this.mesh.scale.set(this.scaleMultiplier, this.scaleMultiplier, this.scaleMultiplier);

    // 设置位置
    this.mesh.position.set(this.position.x, this.position.y + (this.size * this.scaleMultiplier) / 2, this.position.z);

    // 精英怪添加脚底光圈
    if (this.isElite) {
      this.createEliteRing();
    }

    return this.mesh;
  }

  /**
   * 为所有子对象设置userData
   */
  setupChildUserData(parentGroup) {
    parentGroup.traverse((child) => {
      if (child.isMesh) {
        child.userData = { type: "monster", entity: this };
      }
    });
  }

  /**
   * 创建兔妖模型 - 球体加锥形耳朵
   */
  createRabbitMesh() {
    const group = new THREE.Group();

    // 身体 - 球体
    const bodyGeom = new THREE.SphereGeometry(this.size * 0.5, 16, 16);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    this.originalMaterials.push(bodyMat);

    // 左耳 - 锥形
    const leftEarGeom = new THREE.ConeGeometry(this.size * 0.12, this.size * 0.5, 8);
    const leftEarMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity * 0.8,
    });
    const leftEar = new THREE.Mesh(leftEarGeom, leftEarMat);
    leftEar.position.set(-this.size * 0.2, this.size * 0.4, this.size * 0.2);
    leftEar.rotation.x = -0.3;
    leftEar.rotation.z = 0.2;
    leftEar.castShadow = true;
    group.add(leftEar);
    this.originalMaterials.push(leftEarMat);

    // 右耳 - 锥形
    const rightEarGeom = new THREE.ConeGeometry(this.size * 0.12, this.size * 0.5, 8);
    const rightEarMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity * 0.8,
    });
    const rightEar = new THREE.Mesh(rightEarGeom, rightEarMat);
    rightEar.position.set(this.size * 0.2, this.size * 0.4, this.size * 0.2);
    rightEar.rotation.x = -0.3;
    rightEar.rotation.z = -0.2;
    rightEar.castShadow = true;
    group.add(rightEar);
    this.originalMaterials.push(rightEarMat);

    // 尾巴 - 小球
    const tailGeom = new THREE.SphereGeometry(this.size * 0.15, 8, 8);
    const tailMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity,
    });
    const tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(0, 0, -this.size * 0.45);
    group.add(tail);
    this.originalMaterials.push(tailMat);

    // 为所有子对象设置userData
    this.setupChildUserData(group);

    this.mesh.add(group);
  }

  /**
   * 创建木精模型 - 圆柱加树枝状突起
   */
  createWoodSpiritMesh() {
    const group = new THREE.Group();

    // 主干 - 圆柱
    const trunkGeom = new THREE.CylinderGeometry(this.size * 0.25, this.size * 0.35, this.size, 8);
    const trunkMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity,
    });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    this.originalMaterials.push(trunkMat);

    // 顶部树冠 - 多个小球组成
    const crownColors = [0x228b22, 0x32cd32, 0x006400];
    for (let i = 0; i < 5; i++) {
      const crownGeom = new THREE.SphereGeometry(this.size * (0.25 + Math.random() * 0.15), 8, 8);
      const crownColor = crownColors[Math.floor(Math.random() * crownColors.length)];
      const crownMat = new THREE.MeshLambertMaterial({
        color: crownColor,
        emissive: new THREE.Color(crownColor),
        emissiveIntensity: this.emissiveIntensity * 1.2,
      });
      const crown = new THREE.Mesh(crownGeom, crownMat);
      const angle = (i / 5) * Math.PI * 2;
      crown.position.set(
        Math.cos(angle) * this.size * 0.2,
        this.size * 0.4 + Math.random() * 0.1,
        Math.sin(angle) * this.size * 0.2
      );
      crown.castShadow = true;
      group.add(crown);
      this.originalMaterials.push(crownMat);
    }

    // 树枝 - 随机分布的小圆柱
    for (let i = 0; i < 4; i++) {
      const branchGeom = new THREE.CylinderGeometry(this.size * 0.05, this.size * 0.08, this.size * 0.4, 6);
      const branchMat = new THREE.MeshLambertMaterial({
        color: 0x8b4513,
        emissive: new THREE.Color(0x8b4513),
        emissiveIntensity: this.emissiveIntensity * 0.5,
      });
      const branch = new THREE.Mesh(branchGeom, branchMat);
      const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
      const height = (Math.random() - 0.5) * this.size * 0.3;
      branch.position.set(Math.cos(angle) * this.size * 0.3, height, Math.sin(angle) * this.size * 0.3);
      branch.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      branch.rotation.y = angle;
      branch.castShadow = true;
      group.add(branch);
      this.originalMaterials.push(branchMat);
    }

    // 为所有子对象设置userData
    this.setupChildUserData(group);

    this.mesh.add(group);
  }

  /**
   * 创建石傀儡模型 - 多面体加尖刺
   */
  createStoneGolemMesh() {
    const group = new THREE.Group();

    // 身体 - 十二面体（多面体）
    const bodyGeom = new THREE.DodecahedronGeometry(this.size * 0.45, 0);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    this.originalMaterials.push(bodyMat);

    // 尖刺 - 分布在身体周围的锥体
    const spikePositions = [
      { x: 0.5, y: 0.3, z: 0 },
      { x: -0.5, y: 0.3, z: 0 },
      { x: 0, y: 0.3, z: 0.5 },
      { x: 0, y: 0.3, z: -0.5 },
      { x: 0.35, y: -0.3, z: 0.35 },
      { x: -0.35, y: -0.3, z: 0.35 },
      { x: 0.35, y: -0.3, z: -0.35 },
      { x: -0.35, y: -0.3, z: -0.35 },
    ];

    spikePositions.forEach((pos) => {
      const spikeGeom = new THREE.ConeGeometry(this.size * 0.1, this.size * 0.3, 6);
      const spikeMat = new THREE.MeshLambertMaterial({
        color: 0x606060,
        emissive: new THREE.Color(0x404040),
        emissiveIntensity: this.emissiveIntensity * 0.5,
      });
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      spike.position.set(pos.x * this.size, pos.y * this.size, pos.z * this.size);
      // 让尖刺朝外
      spike.lookAt(0, pos.y * this.size, 0);
      spike.rotation.x += Math.PI;
      spike.castShadow = true;
      group.add(spike);
      this.originalMaterials.push(spikeMat);
    });

    // 眼睛 - 发光的红色小方块
    const eyeGeom = new THREE.BoxGeometry(this.size * 0.1, this.size * 0.08, this.size * 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-this.size * 0.15, this.size * 0.1, this.size * 0.4);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(this.size * 0.15, this.size * 0.1, this.size * 0.4);
    group.add(rightEye);
    this.originalMaterials.push(eyeMat);

    // 为所有子对象设置userData
    this.setupChildUserData(group);

    this.mesh.add(group);
  }

  /**
   * 创建默认模型 - 立方体（向后兼容）
   */
  createDefaultMesh() {
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: this.emissiveIntensity,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: "monster", entity: this };
    this.mesh.add(mesh);
    this.originalMaterials.push(material);
  }

  /**
   * 创建精英怪脚底光圈
   */
  createEliteRing() {
    const ringGeom = new THREE.RingGeometry(
      this.size * this.scaleMultiplier * 0.6,
      this.size * this.scaleMultiplier * 0.8,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.eliteColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    this.eliteRing = new THREE.Mesh(ringGeom, ringMat);
    this.eliteRing.rotation.x = -Math.PI / 2;
    this.eliteRing.position.set(this.position.x, 0.05, this.position.z);

    // 将光圈添加到场景（需要在创建怪物后由外部添加到场景）
    this.eliteRing.userData = { parentMonster: this };
  }

  /**
   * 获取精英怪光圈（用于添加到场景）
   */
  getEliteRing() {
    return this.eliteRing;
  }

  /**
   * 更新AI
   */
  update(deltaTime, player) {
    if (this.isDead) {
      this.deadTimer += deltaTime * 1000;
      if (this.deadTimer >= this.respawnTime) {
        this.respawn();
      }
      return;
    }

    // 更新受击闪烁
    this.updateFlash(deltaTime);

    const distanceToPlayer = this.getDistanceTo(player.position);
    const distanceToSpawn = this.getDistanceTo(this.spawnPosition);

    switch (this.state) {
      case "idle":
        this.updateIdle(deltaTime, distanceToPlayer);
        break;
      case "patrol":
        this.updatePatrol(deltaTime, distanceToPlayer);
        break;
      case "chase":
        this.updateChase(deltaTime, player, distanceToPlayer, distanceToSpawn);
        break;
      case "attack":
        this.updateAttack(deltaTime, player, distanceToPlayer);
        break;
      case "return":
        this.updateReturn(deltaTime);
        break;
    }

    // 更新3D对象位置
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
      this.mesh.rotation.y = this.rotation;
    }

    // 更新精英怪光圈位置
    if (this.eliteRing) {
      this.eliteRing.position.x = this.position.x;
      this.eliteRing.position.z = this.position.z;
      // 旋转动画
      this.eliteRing.rotation.z += deltaTime * 1.5;
    }
  }

  /**
   * 更新受击闪烁效果
   */
  updateFlash(deltaTime) {
    if (this.isFlashing) {
      this.flashTimer += deltaTime * 1000;

      if (this.flashTimer >= 200) {
        // 0.2秒
        this.isFlashing = false;
        this.flashTimer = 0;
        this.restoreOriginalColors();
      }
    }
  }

  /**
   * 触发受击闪烁（材质闪白）
   */
  triggerHitFlash() {
    if (!this.mesh) return;

    this.isFlashing = true;
    this.flashTimer = 0;

    // 将所有材质变为白色
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        try {
          // 保存原始颜色
          if (!child.userData.originalColor && child.material.color) {
            child.userData.originalColor = child.material.color.getHex();
          }
          if (!child.userData.originalEmissive) {
            child.userData.originalEmissive = child.material.emissive ? child.material.emissive.getHex() : 0x000000;
          }

          // 设置为白色
          if (child.material.color) {
            child.material.color.setHex(0xffffff);
          }
          if (child.material.emissive) {
            child.material.emissive.setHex(0xffffff);
            child.material.emissiveIntensity = 0.5;
          }
        } catch (e) {
          console.warn("设置闪烁效果时出错:", e);
        }
      }
    });
  }

  /**
   * 恢复原始颜色
   */
  restoreOriginalColors() {
    if (!this.mesh) return;

    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        try {
          if (child.userData.originalColor !== undefined && child.material.color) {
            child.material.color.setHex(child.userData.originalColor);
          }
          if (child.material.emissive && child.userData.originalEmissive !== undefined) {
            child.material.emissive.setHex(child.userData.originalEmissive);
            child.material.emissiveIntensity = this.emissiveIntensity;
          }
        } catch (e) {
          console.warn('恢复原始颜色时出错:', e);
        }
      }
    });
  }

  /**
   * 空闲状态
   */
  updateIdle(deltaTime, distanceToPlayer) {
    this.patrolTimer += deltaTime * 1000;

    // 检测玩家
    if (distanceToPlayer <= this.aggroRange) {
      this.state = "chase";
      return;
    }

    // 开始巡逻
    if (this.patrolTimer >= this.patrolInterval) {
      this.patrolTimer = 0;
      this.setRandomPatrolTarget();
      this.state = "patrol";
    }
  }

  /**
   * 巡逻状态
   */
  updatePatrol(deltaTime, distanceToPlayer) {
    // 检测玩家
    if (distanceToPlayer <= this.aggroRange) {
      this.state = "chase";
      return;
    }

    if (!this.patrolTarget) {
      this.state = "idle";
      return;
    }

    const distanceToTarget = this.getDistanceTo(this.patrolTarget);

    if (distanceToTarget < 0.5) {
      this.patrolTarget = null;
      this.state = "idle";
      return;
    }

    this.moveTowards(this.patrolTarget, deltaTime, this.speed * 0.5);
  }

  /**
   * 追击状态
   */
  updateChase(deltaTime, player, distanceToPlayer, distanceToSpawn) {
    // 超出追击范围，返回
    if (distanceToSpawn > this.aggroRange * 3) {
      this.state = "return";
      return;
    }

    // 到达攻击范围
    if (distanceToPlayer <= this.attackRange) {
      this.state = "attack";
      this.target = player;
      return;
    }

    // 丢失目标
    if (distanceToPlayer > this.aggroRange * 2) {
      this.state = "return";
      return;
    }

    this.moveTowards(player.position, deltaTime, this.speed);
  }

  /**
   * 攻击状态
   */
  updateAttack(deltaTime, player, distanceToPlayer) {
    // 目标超出攻击范围
    if (distanceToPlayer > this.attackRange * 1.5) {
      this.state = "chase";
      return;
    }

    // 面向目标
    this.lookAt(player.position);

    // 攻击冷却
    const now = Date.now();
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = now;
      return { type: "attack", target: player, damage: this.attack };
    }

    return null;
  }

  /**
   * 返回状态
   */
  updateReturn(deltaTime) {
    const distance = this.getDistanceTo(this.spawnPosition);

    if (distance < 0.5) {
      this.state = "idle";
      this.hp = this.maxHp; // 回满血
      return;
    }

    this.moveTowards(this.spawnPosition, deltaTime, this.speed);
  }

  /**
   * 移动向目标
   */
  moveTowards(target, deltaTime, speed) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0) {
      const moveAmount = speed * deltaTime * 2;
      this.position.x += (dx / distance) * moveAmount;
      this.position.z += (dz / distance) * moveAmount;
      this.rotation = Math.atan2(dx, dz);
    }
  }

  /**
   * 面向目标
   */
  lookAt(target) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    this.rotation = Math.atan2(dx, dz);
  }

  /**
   * 设置随机巡逻目标
   */
  setRandomPatrolTarget() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.patrolRadius;

    this.patrolTarget = {
      x: this.spawnPosition.x + Math.cos(angle) * distance,
      z: this.spawnPosition.z + Math.sin(angle) * distance,
    };
  }

  /**
   * 计算到目标的距离
   */
  getDistanceTo(target) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 受到伤害
   */
  takeDamage(amount) {
    const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
    this.hp = Math.max(0, this.hp - finalDamage);

    // 进入战斗状态
    if (this.state === "idle" || this.state === "patrol") {
      this.state = "chase";
    }

    // 触发受击闪烁
    this.triggerHitFlash();

    if (this.hp <= 0) {
      this.die();
    }

    return finalDamage;
  }

  /**
   * 死亡
   */
  die() {
    this.isDead = true;
    this.deadTimer = 0;
    this.state = "idle";
    this.target = null;

    if (this.mesh) {
      this.mesh.visible = false;
    }

    // 隐藏精英怪光圈
    if (this.eliteRing) {
      this.eliteRing.visible = false;
    }
  }

  /**
   * 重生
   */
  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.position = { ...this.spawnPosition };
    this.state = "idle";

    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(
        this.position.x,
        this.position.y + (this.size * this.scaleMultiplier) / 2,
        this.position.z
      );
    }

    // 显示精英怪光圈
    if (this.eliteRing) {
      this.eliteRing.visible = true;
    }
  }

  /**
   * 获取掉落物品
   */
  getDrops() {
    const drops = [];

    for (const drop of this.drops) {
      if (Math.random() < drop.chance) {
        const count = Math.floor(Math.random() * (drop.countMax - drop.countMin + 1)) + drop.countMin;
        drops.push({ itemId: drop.itemId, count });
      }
    }

    return drops;
  }
}
