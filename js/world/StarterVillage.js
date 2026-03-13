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

    console.log("新手村场景创建完成");
  }

  /**
   * 创建地面
   */
  createGround() {
    // 主地面
    const groundGeometry = new THREE.PlaneGeometry(this.width, this.height);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5c3d,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // 中央广场（浅色石板）
    const plazaGeometry = new THREE.CircleGeometry(8, 32);
    const plazaMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.1,
    });
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.01;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 练功区（略微深色）
    const trainingGeometry = new THREE.PlaneGeometry(15, 15);
    const trainingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4c2d,
      roughness: 0.9,
      metalness: 0.05,
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
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.85,
      metalness: 0.05,
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
   * 创建建筑物（升级版本）
   */
  createBuildings() {
    this.createBlacksmith();
    this.createTrainingPlatform();

    // 添加一些装饰性的小物件
    this.createDecorations();
  }

  /**
   * 创建铁匠铺
   */
  createBlacksmith() {
    const x = -15;
    const z = 5;
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.1,
    });
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.9,
      metalness: 0.05,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.7,
      metalness: 0.15,
    });

    const baseGeometry = new THREE.BoxGeometry(5, 3.5, 5);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.y = 3.5 / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const doorGeometry = new THREE.BoxGeometry(1.5, 2.2, 0.2);
    const door = new THREE.Mesh(doorGeometry, woodMaterial);
    door.position.set(0, 1.1, 2.6);
    door.castShadow = true;
    group.add(door);

    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), woodMaterial);
    leftFrame.position.set(-0.9, 1.25, 2.5);
    leftFrame.castShadow = true;
    group.add(leftFrame);

    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), woodMaterial);
    rightFrame.position.set(0.9, 1.25, 2.5);
    rightFrame.castShadow = true;
    group.add(rightFrame);

    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 0.3), woodMaterial);
    topFrame.position.set(0, 2.5, 2.5);
    topFrame.castShadow = true;
    group.add(topFrame);

    const roofGeometry = new THREE.ConeGeometry(4.2, 2, 4);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.5 + 1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.2), woodMaterial);
    signBoard.position.set(0, 3.8, 2.9);
    signBoard.castShadow = true;
    group.add(signBoard);

    const signText = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0x332200,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        side: THREE.DoubleSide,
      })
    );
    signText.position.set(0, 3.8, 3.01);
    group.add(signText);

    const lanternGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const lanternMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const lantern1 = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern1.position.set(-2.2, 3.2, 2.8);
    group.add(lantern1);

    const lantern2 = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern2.position.set(2.2, 3.2, 2.8);
    group.add(lantern2);

    const lanternLight1 = new THREE.PointLight(0xff6600, 0.6, 6);
    lanternLight1.position.copy(lantern1.position);
    group.add(lanternLight1);

    const lanternLight2 = new THREE.PointLight(0xff6600, 0.6, 6);
    lanternLight2.position.copy(lantern2.position);
    group.add(lanternLight2);

    group.userData = { name: "铁匠铺" };
    this.scene.add(group);
    this.buildings.push(group);
  }

  /**
   * 创建修炼台
   */
  createTrainingPlatform() {
    const x = 15;
    const z = 10;
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const stoneTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x708090,
      roughness: 0.7,
      metalness: 0.2,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x220000,
    });

    const base1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 8), stoneBaseMaterial);
    base1.position.y = 0.25;
    base1.castShadow = true;
    base1.receiveShadow = true;
    group.add(base1);

    const base2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 6), stoneBaseMaterial);
    base2.position.y = 0.75;
    base2.castShadow = true;
    base2.receiveShadow = true;
    group.add(base2);

    const step1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.25, 1.5), stoneBaseMaterial);
    step1.position.set(0, 0.125, 4);
    step1.castShadow = true;
    step1.receiveShadow = true;
    group.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.5), stoneBaseMaterial);
    step2.position.set(0, 0.375, 3.25);
    step2.castShadow = true;
    step2.receiveShadow = true;
    group.add(step2);

    const step3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 1.5), stoneBaseMaterial);
    step3.position.set(0, 0.625, 2.5);
    step3.castShadow = true;
    step3.receiveShadow = true;
    group.add(step3);

    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 8), stoneBaseMaterial);
    pillar1.position.set(2.5, 1.5, 2.5);
    pillar1.castShadow = true;
    group.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 8), stoneBaseMaterial);
    pillar2.position.set(-2.5, 1.5, 2.5);
    pillar2.castShadow = true;
    group.add(pillar2);

    const pillar3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 8), stoneBaseMaterial);
    pillar3.position.set(2.5, 1.5, -2.5);
    pillar3.castShadow = true;
    group.add(pillar3);

    const pillar4 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 8), stoneBaseMaterial);
    pillar4.position.set(-2.5, 1.5, -2.5);
    pillar4.castShadow = true;
    group.add(pillar4);

    const platformTop = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 8), stoneTopMaterial);
    platformTop.position.y = 1.25;
    platformTop.castShadow = true;
    platformTop.receiveShadow = true;
    group.add(platformTop);

    const centerCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.8, 1),
      new THREE.MeshStandardMaterial({
        color: 0x4169e1,
        emissive: 0x000088,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.8,
      })
    );
    centerCrystal.position.y = 2.0;
    centerCrystal.rotation.set(Math.PI / 4, 0, Math.PI / 4);
    group.add(centerCrystal);

    const crystalLight = new THREE.PointLight(0x4169e1, 0.6, 8);
    crystalLight.position.copy(centerCrystal.position);
    group.add(crystalLight);

    group.userData = { name: "修炼台" };
    this.scene.add(group);
    this.buildings.push(group);
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

    const treeTrunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
      metalness: 0.05,
    });
    const treeCrownMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
      metalness: 0.1,
    });

    treePositions.forEach((pos) => {
      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const trunk = new THREE.Mesh(trunkGeometry, treeTrunkMaterial);
      trunk.position.set(pos.x, 0.75, pos.z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      // 树冠
      const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const crown = new THREE.Mesh(crownGeometry, treeCrownMaterial);
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

    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.95,
      metalness: 0.1,
    });

    rockPositions.forEach((pos) => {
      const geometry = new THREE.DodecahedronGeometry(pos.s);
      const rock = new THREE.Mesh(geometry, rockMaterial);
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
