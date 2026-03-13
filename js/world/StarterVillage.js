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
    this.effects = null;

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
  create(scene, effectsManager) {
    this.scene = scene;
    this.effects = effectsManager;

    this.createGround();
    this.createWalls();
    this.createBuildings();
    this.createNPCs();
    this.createMonsters();

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

      if (npc.glowMesh) this.scene.add(npc.glowMesh);
      if (npc.hatMesh) this.scene.add(npc.hatMesh);
      if (npc.weaponMesh) this.scene.add(npc.weaponMesh);

      this.npcs.push(npc);
    });

    console.log(`创建了 ${this.npcs.length} 个NPC`);

    this.createFurnace();
    this.createNPCEffects();
  }

  /**
   * 创建铁匠铺的炉子
   */
  createFurnace() {
    const blacksmith = this.getNPC("blacksmith");
    if (!blacksmith) return;

    const furnaceX = blacksmith.position.x - 1.5;
    const furnaceZ = blacksmith.position.z;

    const furnaceGeom = new THREE.CylinderGeometry(0.6, 0.8, 1, 8);
    const furnaceMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0x220000,
      roughness: 0.8,
    });
    const furnace = new THREE.Mesh(furnaceGeom, furnaceMat);
    furnace.position.set(furnaceX, 0.5, furnaceZ);
    furnace.castShadow = true;
    this.scene.add(furnace);

    const fireGeom = new THREE.ConeGeometry(0.3, 0.5, 8);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const fire = new THREE.Mesh(fireGeom, fireMat);
    fire.position.set(furnaceX, 1.2, furnaceZ);
    this.scene.add(fire);

    this.furnaceFire = fire;

    if (this.effects) {
      this.effects.createContinuousEffect("furnace_sparks", {
        position: { x: furnaceX, y: 1.2, z: furnaceZ },
        positionVariation: { x: 0.3, y: 0.2, z: 0.3 },
        color: 0xffaa00,
        size: 0.08,
        spawnRate: 50,
        spawnCount: 2,
        lifetime: 800,
        velocityY: 2,
        velocitySpread: 1,
        gravity: -1,
      });
    }
  }

  /**
   * 创建NPC特殊效果
   */
  createNPCEffects() {
    if (!this.effects) return;

    const trainer = this.getNPC("trainer");
    if (trainer) {
      this.effects.createContinuousEffect("trainer_aura", {
        position: { x: trainer.position.x, y: 0.8, z: trainer.position.z },
        color: 0x44aaff,
        size: 0.12,
        spawnRate: 80,
        spawnCount: 1,
        lifetime: 1500,
        orbital: true,
        orbitalRadius: 1.2,
        orbitalSpeed: 0.5,
      });
    }
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

    // 炉子火焰脉动动画
    if (this.furnaceFire) {
      const firePulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
      this.furnaceFire.scale.setScalar(firePulse);
      this.furnaceFire.material.opacity = 0.7 + Math.sin(Date.now() * 0.008) * 0.2;
    }

    // 更新怪物
    const attackResults = [];
    this.monsters.forEach((monster) => {
      const result = monster.update(deltaTime, player);
      if (result && result.type === "attack") {
        attackResults.push(result);
      }
    });

    return attackResults;
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
