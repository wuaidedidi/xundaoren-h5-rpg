/**
 * 寻道人 - 怪物实体类
 * 立方体作为怪物模型
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
    this.emissive = config.emissive || 0.1;
    this.size = config.size;
    this.aggroRange = config.aggroRange;
    this.attackRange = config.attackRange;
    this.drops = config.drops;
    this.monsterType = config.monsterType || "rabbitDemon";
    this.isElite = config.isElite || false;

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
    this.eliteRing = null;
    this.mainMaterial = null;
    this.originalColor = null;
    this.hitFlashTimeout = null;

    // 状态
    this.isDead = false;
    this.respawnTime = 10000; // 10秒后重生
    this.deadTimer = 0;

    // 唯一标识
    this.uuid = Math.random().toString(36).substr(2, 9);
  }

  /**
   * 创建3D模型 - 根据怪物类型创建不同模型
   */
  createMesh() {
    const scale = this.isElite ? 1.5 : 1;
    this.mesh = new THREE.Group();

    switch (this.monsterType) {
      case "rabbitDemon":
        this.createRabbitDemonMesh(scale);
        break;
      case "woodSpirit":
        this.createWoodSpiritMesh(scale);
        break;
      case "stoneGolem":
        this.createStoneGolemMesh(scale);
        break;
      default:
        this.createRabbitDemonMesh(scale);
    }

    if (this.isElite) {
      this.createEliteRing();
    }

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.userData = { type: "monster", entity: this };

    return this.mesh;
  }

  /**
   * 给子mesh添加userData（用于射线检测）
   */
  setMeshUserData(mesh) {
    mesh.userData = { type: "monster", entity: this };
  }

  /**
   * 创建兔妖模型 - 球体身体 + 锥形耳朵
   */
  createRabbitDemonMesh(scale) {
    const bodyGeom = new THREE.SphereGeometry(this.size * 0.5 * scale, 16, 16);
    this.mainMaterial = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(this.emissive),
    });
    const body = new THREE.Mesh(bodyGeom, this.mainMaterial);
    body.position.y = this.size * 0.5 * scale;
    body.castShadow = true;
    body.receiveShadow = true;
    this.setMeshUserData(body);
    this.mesh.add(body);

    const earGeom = new THREE.ConeGeometry(this.size * 0.15 * scale, this.size * 0.4 * scale, 8);
    const earMat = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(this.emissive * 0.5),
    });

    const leftEar = new THREE.Mesh(earGeom, earMat);
    leftEar.position.set(-this.size * 0.15 * scale, this.size * 0.9 * scale, 0);
    leftEar.rotation.z = 0.2;
    this.setMeshUserData(leftEar);
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, earMat);
    rightEar.position.set(this.size * 0.15 * scale, this.size * 0.9 * scale, 0);
    rightEar.rotation.z = -0.2;
    this.setMeshUserData(rightEar);
    this.mesh.add(rightEar);

    const eyeGeom = new THREE.SphereGeometry(this.size * 0.08 * scale, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-this.size * 0.15 * scale, this.size * 0.6 * scale, this.size * 0.4 * scale);
    this.setMeshUserData(leftEye);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(this.size * 0.15 * scale, this.size * 0.6 * scale, this.size * 0.4 * scale);
    this.setMeshUserData(rightEye);
    this.mesh.add(rightEye);

    this.originalColor = this.color;
  }

  /**
   * 创建木精模型 - 圆柱体身体 + 树枝状突起
   */
  createWoodSpiritMesh(scale) {
    const bodyGeom = new THREE.CylinderGeometry(
      this.size * 0.35 * scale,
      this.size * 0.45 * scale,
      this.size * 1.2 * scale,
      12
    );
    this.mainMaterial = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(this.emissive),
    });
    const body = new THREE.Mesh(bodyGeom, this.mainMaterial);
    body.position.y = this.size * 0.6 * scale;
    body.castShadow = true;
    body.receiveShadow = true;
    this.setMeshUserData(body);
    this.mesh.add(body);

    const branchMat = new THREE.MeshLambertMaterial({
      color: 0x4a2f1a,
      emissive: new THREE.Color(0x4a2f1a).multiplyScalar(0.1),
    });

    const branchPositions = [
      { x: 0.3, y: 0.9, z: 0, rotZ: 0.8, rotY: 0 },
      { x: -0.3, y: 0.8, z: 0.2, rotZ: -0.7, rotY: 0.5 },
      { x: 0, y: 1.0, z: -0.3, rotZ: 0.1, rotY: -0.3 },
      { x: 0.25, y: 0.7, z: -0.25, rotZ: 0.6, rotY: -0.8 },
      { x: -0.25, y: 0.85, z: 0.25, rotZ: -0.5, rotY: 1.2 },
    ];

    branchPositions.forEach((pos) => {
      const branchGeom = new THREE.CylinderGeometry(
        this.size * 0.05 * scale,
        this.size * 0.08 * scale,
        this.size * 0.5 * scale,
        6
      );
      const branch = new THREE.Mesh(branchGeom, branchMat);
      branch.position.set(pos.x * this.size * scale, pos.y * this.size * scale, pos.z * this.size * scale);
      branch.rotation.z = pos.rotZ;
      branch.rotation.y = pos.rotY;
      this.setMeshUserData(branch);
      this.mesh.add(branch);
    });

    const leafGeom = new THREE.SphereGeometry(this.size * 0.15 * scale, 8, 8);
    const leafMat = new THREE.MeshLambertMaterial({
      color: 0x44aa44,
      emissive: new THREE.Color(0x44aa44).multiplyScalar(0.2),
    });

    branchPositions.forEach((pos) => {
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(
        pos.x * this.size * scale * 1.5,
        (pos.y + 0.2) * this.size * scale,
        pos.z * this.size * scale * 1.5
      );
      this.setMeshUserData(leaf);
      this.mesh.add(leaf);
    });

    const eyeGeom = new THREE.SphereGeometry(this.size * 0.1 * scale, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-this.size * 0.15 * scale, this.size * 0.8 * scale, this.size * 0.35 * scale);
    this.setMeshUserData(leftEye);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(this.size * 0.15 * scale, this.size * 0.8 * scale, this.size * 0.35 * scale);
    this.setMeshUserData(rightEye);
    this.mesh.add(rightEye);

    this.originalColor = this.color;
  }

  /**
   * 创建石傀儡模型 - 多面体身体 + 尖刺
   */
  createStoneGolemMesh(scale) {
    const bodyGeom = new THREE.DodecahedronGeometry(this.size * 0.5 * scale, 0);
    this.mainMaterial = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(this.emissive),
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeom, this.mainMaterial);
    body.position.y = this.size * 0.6 * scale;
    body.castShadow = true;
    body.receiveShadow = true;
    this.setMeshUserData(body);
    this.mesh.add(body);

    const spikeMat = new THREE.MeshLambertMaterial({
      color: 0x505050,
      emissive: new THREE.Color(0x505050).multiplyScalar(0.05),
      flatShading: true,
    });

    const spikePositions = [
      { x: 0.4, y: 0.5, z: 0.3 },
      { x: -0.4, y: 0.6, z: 0.2 },
      { x: 0.3, y: 0.9, z: -0.2 },
      { x: -0.3, y: 0.4, z: -0.4 },
      { x: 0, y: 1.0, z: 0.3 },
      { x: 0.5, y: 0.7, z: -0.3 },
      { x: -0.5, y: 0.8, z: -0.1 },
    ];

    spikePositions.forEach((pos) => {
      const spikeGeom = new THREE.ConeGeometry(this.size * 0.08 * scale, this.size * 0.3 * scale, 4);
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      spike.position.set(pos.x * this.size * scale, pos.y * this.size * scale, pos.z * this.size * scale);
      spike.rotation.x = (Math.random() - 0.5) * 0.5;
      spike.rotation.z = (Math.random() - 0.5) * 0.5;
      this.setMeshUserData(spike);
      this.mesh.add(spike);
    });

    const eyeGeom = new THREE.OctahedronGeometry(this.size * 0.1 * scale, 0);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-this.size * 0.2 * scale, this.size * 0.7 * scale, this.size * 0.4 * scale);
    this.setMeshUserData(leftEye);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(this.size * 0.2 * scale, this.size * 0.7 * scale, this.size * 0.4 * scale);
    this.setMeshUserData(rightEye);
    this.mesh.add(rightEye);

    this.originalColor = this.color;
  }

  /**
   * 创建精英怪脚底光圈
   */
  createEliteRing() {
    const ringGeom = new THREE.RingGeometry(this.size * 0.6, this.size * 0.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    this.eliteRing = new THREE.Mesh(ringGeom, ringMat);
    this.eliteRing.rotation.x = -Math.PI / 2;
    this.eliteRing.position.y = 0.02;
    this.mesh.add(this.eliteRing);
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

    // 更新精英光圈动画
    this.updateEliteRing(Date.now() * 0.001);
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

    // 受击闪白效果
    this.playHitFlash();

    // 进入战斗状态
    if (this.state === "idle" || this.state === "patrol") {
      this.state = "chase";
    }

    if (this.hp <= 0) {
      this.die();
    }

    return finalDamage;
  }

  /**
   * 受击闪白效果 - 材质闪白0.2秒
   */
  playHitFlash() {
    if (!this.mainMaterial || !this.mesh) return;

    if (this.hitFlashTimeout) {
      clearTimeout(this.hitFlashTimeout);
    }

    this.mainMaterial.color.setHex(0xffffff);
    this.mainMaterial.emissive.setHex(0xffffff);

    this.hitFlashTimeout = setTimeout(() => {
      if (this.mainMaterial && !this.isDead) {
        this.mainMaterial.color.setHex(this.originalColor);
        this.mainMaterial.emissive.setHex(this.originalColor);
        this.mainMaterial.emissive.multiplyScalar(this.emissive);
      }
      this.hitFlashTimeout = null;
    }, 200);
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
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    if (this.mainMaterial && this.originalColor) {
      this.mainMaterial.color.setHex(this.originalColor);
      this.mainMaterial.emissive.setHex(this.originalColor);
      this.mainMaterial.emissive.multiplyScalar(this.emissive);
    }
  }

  /**
   * 更新精英光圈动画
   */
  updateEliteRing(time) {
    if (this.eliteRing && this.isElite) {
      const pulse = 0.5 + Math.sin(time * 3) * 0.2;
      this.eliteRing.material.opacity = pulse;
      this.eliteRing.rotation.z = time * 0.5;
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
