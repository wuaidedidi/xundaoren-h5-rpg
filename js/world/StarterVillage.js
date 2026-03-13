/**
 * 寻道人 - 新手村场景
 * 包含地形、建筑、NPC和怪物
 */

import NPC from "../entities/NPC.js";
import Monster from "../entities/Monster.js";
import { getAllNPCs, getVisibleNPCs } from "../data/npcs.js";

export default class StarterVillage {
  constructor() {
    // 地图尺寸
    this.width = 50;
    this.height = 50;
    this.bounds = {
      minX: -this.width / 2,
      maxX: this.width / 2,
      minZ: -this.height / 2,
      maxZ: this.height / 2,
    };

    // 场景对象
    this.ground = null;
    this.walls = [];
    this.buildings = [];
    this.npcs = [];
    this.monsters = [];

    // 水面相关
    this.water = null;
    this.waterGeometry = null;
    this.waterTime = 0;
    this.spiritSpring = null;
    this.spiritParticles = [];

    // 怪物生成点
    this.monsterSpawns = [
      {
        monsterId: "rabbitDemon",
        positions: [
          { x: -20, y: 0, z: -15 },
          { x: -22, y: 0, z: -18 },
          { x: -18, y: 0, z: -20 },
        ],
      },
      {
        monsterId: "woodSpirit",
        positions: [
          { x: 20, y: 0, z: -20 },
          { x: 22, y: 0, z: -18 },
        ],
      },
      { monsterId: "stoneGolem", positions: [{ x: 0, y: 0, z: -22 }] },
    ];
  }

  /**
   * 创建场景
   */
  create(scene) {
    this.scene = scene;

    this.createGround();
    this.createWalls();
    this.createBuildings();
    this.createNPCs();
    this.createMonsters();
    this.createWater();

    console.log("新手村场景创建完成");
  }

  /**
   * 创建地面
   */
  createGround() {
    // 主地面
    const groundGeometry = new THREE.PlaneGeometry(this.width, this.height);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x3d5c3d,
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // 中央广场（浅色石板）
    const plazaGeometry = new THREE.CircleGeometry(8, 32);
    const plazaMaterial = new THREE.MeshLambertMaterial({
      color: 0x808080,
    });
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.01;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 练功区（略微深色）
    const trainingGeometry = new THREE.PlaneGeometry(15, 15);
    const trainingMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d4c2d,
    });
    const training = new THREE.Mesh(trainingGeometry, trainingMaterial);
    training.rotation.x = -Math.PI / 2;
    training.position.set(-18, 0.01, -18);
    training.receiveShadow = true;
    this.scene.add(training);
  }

  /**
   * 创建围墙边界
   */
  createWalls() {
    const wallHeight = 3;
    const wallThickness = 1;
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x5c4033,
    });

    // 创建四面墙
    const wallConfigs = [
      { w: this.width, h: wallThickness, x: 0, z: -this.height / 2 - wallThickness / 2 }, // 北
      { w: this.width, h: wallThickness, x: 0, z: this.height / 2 + wallThickness / 2 }, // 南
      { w: wallThickness, h: this.height, x: -this.width / 2 - wallThickness / 2, z: 0 }, // 西
      { w: wallThickness, h: this.height, x: this.width / 2 + wallThickness / 2, z: 0 }, // 东
    ];

    wallConfigs.forEach((config) => {
      const geometry = new THREE.BoxGeometry(config.w, wallHeight, config.h);
      const wall = new THREE.Mesh(geometry, wallMaterial);
      wall.position.set(config.x, wallHeight / 2, config.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
      this.walls.push(wall);
    });
  }

  /**
   * 创建建筑物（简单立方体）
   */
  createBuildings() {
    const buildingConfigs = [
      { name: "铁匠铺", x: -15, z: 5, w: 5, h: 3.5, d: 5, color: 0x654321 },
      { name: "修炼台", x: 15, z: 10, w: 4, h: 2, d: 4, color: 0x4169e1 },
    ];

    buildingConfigs.forEach((config) => {
      const geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
      const material = new THREE.MeshLambertMaterial({
        color: config.color,
      });

      const building = new THREE.Mesh(geometry, material);
      building.position.set(config.x, config.h / 2, config.z);
      building.castShadow = true;
      building.receiveShadow = true;
      building.userData = { name: config.name };

      this.scene.add(building);
      this.buildings.push(building);
    });

    // 添加一些装饰性的小物件
    this.createDecorations();
  }

  /**
   * 创建装饰物
   */
  createDecorations() {
    // 树木（圆锥 + 圆柱）
    const treePositions = [
      { x: -10, z: 15 },
      { x: 10, z: 18 },
      { x: -8, z: -8 },
      { x: 8, z: -10 },
      { x: -20, z: 8 },
    ];

    treePositions.forEach((pos) => {
      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 0.75, pos.z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      // 树冠
      const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(pos.x, 3, pos.z);
      crown.castShadow = true;
      this.scene.add(crown);
    });

    // 岩石
    const rockPositions = [
      { x: -22, z: -10, s: 1 },
      { x: 20, z: 15, s: 0.8 },
      { x: 5, z: -20, s: 1.2 },
    ];

    rockPositions.forEach((pos) => {
      const geometry = new THREE.DodecahedronGeometry(pos.s);
      const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, pos.s * 0.5, pos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    });
  }

  /**
   * 创建NPC
   */
  createNPCs() {
    const npcConfigs = getVisibleNPCs();

    npcConfigs.forEach((config) => {
      const npc = new NPC(config.id);
      const mesh = npc.createMesh();

      this.scene.add(mesh);

      if (npc.glowMesh) {
        this.scene.add(npc.glowMesh);
      }

      this.npcs.push(npc);
    });

    console.log(`创建了 ${this.npcs.length} 个NPC`);
  }

  /**
   * 创建怪物
   */
  createMonsters() {
    this.monsterSpawns.forEach((spawn) => {
      spawn.positions.forEach((pos) => {
        const monster = new Monster(spawn.monsterId, pos);
        const mesh = monster.createMesh();

        this.scene.add(mesh);
        this.monsters.push(monster);
      });
    });

    console.log(`创建了 ${this.monsters.length} 个怪物`);
  }

  /**
   * 更新场景
   */
  update(deltaTime, player) {
    // 更新NPC
    this.npcs.forEach((npc) => {
      npc.update(deltaTime);
    });

    // 更新怪物
    const attackResults = [];
    this.monsters.forEach((monster) => {
      const result = monster.update(deltaTime, player);
      if (result && result.type === "attack") {
        attackResults.push(result);
      }
    });

    this.updateWater(deltaTime);

    return attackResults;
  }

  /**
   * 创建水面
   */
  createWater() {
    const waterCenter = { x: 15, z: -10 };
    const waterRadius = 8;

    const pondBaseGeometry = new THREE.CircleGeometry(waterRadius, 32);
    const pondBaseMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a3333,
      side: THREE.DoubleSide,
    });
    const pondBase = new THREE.Mesh(pondBaseGeometry, pondBaseMaterial);
    pondBase.rotation.x = -Math.PI / 2;
    pondBase.position.set(waterCenter.x, -0.5, waterCenter.z);
    pondBase.receiveShadow = true;
    this.scene.add(pondBase);

    const sandGeometry = new THREE.RingGeometry(waterRadius - 0.5, waterRadius + 0.8, 32);
    const sandMaterial = new THREE.MeshLambertMaterial({
      color: 0xc2b280,
      side: THREE.DoubleSide,
    });
    const sand = new THREE.Mesh(sandGeometry, sandMaterial);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(waterCenter.x, -0.1, waterCenter.z);
    sand.receiveShadow = true;
    this.scene.add(sand);

    this.waterGeometry = new THREE.PlaneGeometry(waterRadius * 2, waterRadius * 2, 32, 32);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x3399ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      shininess: 150,
      specular: 0xaaddff,
      reflectivity: 0.5,
      emissive: 0x114488,
      emissiveIntensity: 0.2,
    });

    this.water = new THREE.Mesh(this.waterGeometry, waterMaterial);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(waterCenter.x, 0.1, waterCenter.z);
    this.water.receiveShadow = true;

    const positions = this.waterGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      if (distanceFromCenter > waterRadius) {
        positions[i + 2] = -10;
      }
    }
    this.waterGeometry.attributes.position.needsUpdate = true;

    this.scene.add(this.water);

    this.createSpiritSpring(waterCenter);
  }

  /**
   * 创建灵泉粒子效果
   */
  createSpiritSpring(center) {
    const particleCount = 80;
    this.spiritGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.spiritParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.0;
      positions[i3] = center.x + Math.cos(angle) * radius;
      positions[i3 + 1] = 0.1 + Math.random() * 0.5;
      positions[i3 + 2] = center.z + Math.sin(angle) * radius;

      this.spiritParticles.push({
        velocity: {
          x: (Math.random() - 0.5) * 0.3,
          y: 0.8 + Math.random() * 1.2,
          z: (Math.random() - 0.5) * 0.3,
        },
        life: Math.random() * 3,
        maxLife: 3,
        center: center,
        index: i3,
      });
    }

    this.spiritGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xaaffff,
      size: 0.8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      emissive: 0x66ffff,
      emissiveIntensity: 0.8,
      sizeAttenuation: true,
    });

    this.spiritSpring = new THREE.Points(this.spiritGeometry, particleMat);
    this.scene.add(this.spiritSpring);
  }

  /**
   * 更新水面
   */
  updateWater(deltaTime) {
    this.waterTime += deltaTime * 2;

    const positions = this.waterGeometry.attributes.position.array;
    const waterRadius = 8;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const distanceFromCenter = Math.sqrt(x * x + z * z);

      if (distanceFromCenter <= waterRadius) {
        const wave1 = Math.sin(x * 0.8 + this.waterTime) * 0.08;
        const wave2 = Math.sin(z * 0.8 + this.waterTime * 0.8) * 0.05;
        const wave3 = Math.sin((x + z) * 0.5 + this.waterTime * 0.5) * 0.03;
        positions[i + 1] = wave1 + wave2 + wave3;
      }
    }

    this.waterGeometry.attributes.position.needsUpdate = true;
    this.waterGeometry.computeVertexNormals();

    const spiritPositions = this.spiritGeometry.attributes.position.array;
    this.spiritParticles.forEach((particle) => {
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.0;
        spiritPositions[particle.index] = particle.center.x + Math.cos(angle) * radius;
        spiritPositions[particle.index + 1] = 0.1;
        spiritPositions[particle.index + 2] = particle.center.z + Math.sin(angle) * radius;
        particle.life = particle.maxLife;
        particle.velocity.y = 0.8 + Math.random() * 1.2;
      } else {
        spiritPositions[particle.index] += particle.velocity.x * deltaTime;
        spiritPositions[particle.index + 1] += particle.velocity.y * deltaTime;
        spiritPositions[particle.index + 2] += particle.velocity.z * deltaTime;
      }
    });
    this.spiritGeometry.attributes.position.needsUpdate = true;
  }

  /**
   * 获取可选中的对象
   */
  getSelectableObjects() {
    const objects = [];

    this.npcs.forEach((npc) => {
      if (npc.mesh) objects.push(npc.mesh);
    });

    this.monsters.forEach((monster) => {
      if (monster.mesh && !monster.isDead) objects.push(monster.mesh);
    });

    return objects;
  }

  /**
   * 获取存活的怪物
   */
  getAliveMonsters() {
    return this.monsters.filter((m) => !m.isDead);
  }

  /**
   * 获取NPC
   */
  getNPC(npcId) {
    return this.npcs.find((npc) => npc.id === npcId);
  }

  /**
   * 检查位置是否在边界内
   */
  isInBounds(x, z) {
    return x >= this.bounds.minX && x <= this.bounds.maxX && z >= this.bounds.minZ && z <= this.bounds.maxZ;
  }

  /**
   * 约束位置到边界内
   */
  clampToBounds(position) {
    return {
      x: Math.max(this.bounds.minX + 1, Math.min(this.bounds.maxX - 1, position.x)),
      z: Math.max(this.bounds.minZ + 1, Math.min(this.bounds.maxZ - 1, position.z)),
    };
  }
}
