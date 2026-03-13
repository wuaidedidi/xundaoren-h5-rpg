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
   * 创建建筑物
   */
  createBuildings() {
    // 创建铁匠铺
    this.createBlacksmithShop();

    // 创建修炼台
    this.createTrainingPlatform();

    // 添加一些装饰性的小物件
    this.createDecorations();
  }

  /**
   * 创建铁匠铺 - 包含屋顶、门框、招牌
   */
  createBlacksmithShop() {
    const x = -15,
      z = 5;
    const buildingGroup = new THREE.Group();
    buildingGroup.userData = { name: "铁匠铺" };

    // 石头材质 - 墙壁
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
    // 木头材质 - 框架和门
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    // 屋顶材质
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    // 自发光材质 - 招牌
    const signEmissiveMaterial = new THREE.MeshLambertMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.5,
    });
    // 自发光材质 - 灯笼
    const lanternEmissiveMaterial = new THREE.MeshLambertMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.8,
    });

    // 1. 主墙体 (石头材质)
    const wallGeometry = new THREE.BoxGeometry(5, 3, 5);
    const walls = new THREE.Mesh(wallGeometry, stoneMaterial);
    walls.position.set(0, 1.5, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    buildingGroup.add(walls);

    // 2. 屋顶 (四面锥体) - 缩小底面半径让屋檐不遮挡招牌
    const roofGeometry = new THREE.ConeGeometry(3.2, 2, 4);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 4, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    buildingGroup.add(roof);

    // 3. 门框
    const doorFrameGeometry = new THREE.BoxGeometry(1.4, 2.2, 0.3);
    const doorFrame = new THREE.Mesh(doorFrameGeometry, woodMaterial);
    doorFrame.position.set(0, 1.1, 2.4);
    doorFrame.castShadow = true;
    buildingGroup.add(doorFrame);

    // 4. 门 (深色木头)
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
    const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1, 2.5);
    buildingGroup.add(door);

    // 5. 招牌 (伸出屋檐，使用支架)
    // 支架
    const bracketGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const leftBracket = new THREE.Mesh(bracketGeometry, woodMaterial);
    leftBracket.position.set(-0.6, 2.9, 2.9);
    buildingGroup.add(leftBracket);
    const rightBracket = new THREE.Mesh(bracketGeometry, woodMaterial);
    rightBracket.position.set(0.6, 2.9, 2.9);
    buildingGroup.add(rightBracket);

    // 招牌板
    const signBoardGeometry = new THREE.BoxGeometry(2, 0.6, 0.15);
    const signBoard = new THREE.Mesh(signBoardGeometry, woodMaterial);
    signBoard.position.set(0, 2.9, 3.3);
    signBoard.castShadow = true;
    buildingGroup.add(signBoard);

    // 招牌文字背景 (发光的铁砧形状)
    const anvilGeometry = new THREE.BoxGeometry(1.2, 0.35, 0.05);
    const anvil = new THREE.Mesh(anvilGeometry, signEmissiveMaterial);
    anvil.position.set(0, 2.9, 3.38);
    buildingGroup.add(anvil);

    // 6. 灯笼 (两侧，挂在招牌下方)
    const lanternGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const hookGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);

    // 左侧灯笼
    const leftLantern = new THREE.Mesh(lanternGeometry, lanternEmissiveMaterial);
    leftLantern.position.set(-0.7, 2.4, 3.3);
    buildingGroup.add(leftLantern);

    // 灯笼挂钩
    const leftHook = new THREE.Mesh(hookGeometry, woodMaterial);
    leftHook.position.set(-0.7, 2.7, 3.3);
    buildingGroup.add(leftHook);

    // 右侧灯笼
    const rightLantern = new THREE.Mesh(lanternGeometry, lanternEmissiveMaterial);
    rightLantern.position.set(0.7, 2.4, 3.3);
    buildingGroup.add(rightLantern);

    const rightHook = new THREE.Mesh(hookGeometry, woodMaterial);
    rightHook.position.set(0.7, 2.7, 3.3);
    buildingGroup.add(rightHook);

    // 7. 烟囱
    const chimneyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
    const chimney = new THREE.Mesh(chimneyGeometry, stoneMaterial);
    chimney.position.set(1.5, 3.5, -1);
    chimney.castShadow = true;
    buildingGroup.add(chimney);

    // 8. 窗户
    const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-1.5, 2, 2.5);
    buildingGroup.add(leftWindow);

    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(1.5, 2, 2.5);
    buildingGroup.add(rightWindow);

    // 设置整体位置
    buildingGroup.position.set(x, 0, z);
    this.scene.add(buildingGroup);
    this.buildings.push(buildingGroup);
  }

  /**
   * 创建修炼台 - 包含台阶和底座
   */
  createTrainingPlatform() {
    const x = 15,
      z = 10;
    const buildingGroup = new THREE.Group();
    buildingGroup.userData = { name: "修炼台" };

    // 石头材质 - 底座和台阶
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const darkStoneMaterial = new THREE.MeshLambertMaterial({ color: 0x505a60 });
    // 木头材质 - 平台表面
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    // 自发光材质 - 修炼符文
    const runeEmissiveMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: 0x00aaaa,
      emissiveIntensity: 0.6,
    });

    // 1. 底层台阶 (最宽)
    const step1Geometry = new THREE.BoxGeometry(6, 0.4, 6);
    const step1 = new THREE.Mesh(step1Geometry, darkStoneMaterial);
    step1.position.set(0, 0.2, 0);
    step1.castShadow = true;
    step1.receiveShadow = true;
    buildingGroup.add(step1);

    // 2. 中层台阶
    const step2Geometry = new THREE.BoxGeometry(5, 0.4, 5);
    const step2 = new THREE.Mesh(step2Geometry, stoneMaterial);
    step2.position.set(0, 0.6, 0);
    step2.castShadow = true;
    step2.receiveShadow = true;
    buildingGroup.add(step2);

    // 3. 上层台阶
    const step3Geometry = new THREE.BoxGeometry(4, 0.4, 4);
    const step3 = new THREE.Mesh(step3Geometry, darkStoneMaterial);
    step3.position.set(0, 1.0, 0);
    step3.castShadow = true;
    step3.receiveShadow = true;
    buildingGroup.add(step3);

    // 4. 修炼平台 (木头材质)
    const platformGeometry = new THREE.BoxGeometry(3, 0.3, 3);
    const platform = new THREE.Mesh(platformGeometry, woodMaterial);
    platform.position.set(0, 1.35, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    buildingGroup.add(platform);

    // 5. 中央修炼柱
    const pillarGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
    const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
    pillar.position.set(0, 2.1, 0);
    pillar.castShadow = true;
    buildingGroup.add(pillar);

    // 6. 修炼符文 (发光圆盘)
    const runeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16);
    const rune = new THREE.Mesh(runeGeometry, runeEmissiveMaterial);
    rune.position.set(0, 1.55, 0);
    buildingGroup.add(rune);

    // 7. 四角石柱
    const cornerPillarGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 6);
    const cornerPositions = [
      { x: -1.2, z: -1.2 },
      { x: 1.2, z: -1.2 },
      { x: -1.2, z: 1.2 },
      { x: 1.2, z: 1.2 },
    ];

    cornerPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(cornerPillarGeometry, stoneMaterial);
      pillar.position.set(pos.x, 1, pos.z);
      pillar.castShadow = true;
      buildingGroup.add(pillar);
    });

    // 8. 灯笼 (四角)
    const lanternGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const lanternEmissiveMaterial = new THREE.MeshLambertMaterial({
      color: 0xffdd44,
      emissive: 0xffaa00,
      emissiveIntensity: 0.7,
    });

    cornerPositions.forEach((pos) => {
      const lantern = new THREE.Mesh(lanternGeometry, lanternEmissiveMaterial);
      lantern.position.set(pos.x, 2.2, pos.z);
      buildingGroup.add(lantern);
    });

    // 设置整体位置
    buildingGroup.position.set(x, 0, z);
    this.scene.add(buildingGroup);
    this.buildings.push(buildingGroup);
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
