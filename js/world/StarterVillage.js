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
    this.createBlacksmith(-15, 5);
    this.createTrainingPlatform(15, 10);
    this.createDecorations();
  }

  /**
   * 创建铁匠铺
   */
  createBlacksmith(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const darkWoodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const thatchMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const signMaterial = new THREE.MeshLambertMaterial({
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 0.4,
    });
    const lanternMaterial = new THREE.MeshLambertMaterial({
      color: 0xff6b00,
      emissive: 0xff6b00,
      emissiveIntensity: 0.8,
    });

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 5), stoneMaterial);
    foundation.position.set(0, 0.2, 0);
    foundation.receiveShadow = true;
    foundation.castShadow = true;
    group.add(foundation);

    const pillarPositions = [
      { x: -2.5, z: -2 },
      { x: 2.5, z: -2 },
      { x: -2.5, z: 2 },
      { x: 2.5, z: 2 },
    ];

    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 3, 8), darkWoodMaterial);
      pillar.position.set(pos.x, 1.9, pos.z);
      pillar.castShadow = true;
      group.add(pillar);
    });

    const wallThickness = 0.15;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, wallThickness), woodMaterial);
    backWall.position.set(0, 1.8, -2.1);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 2.8, 4.2), woodMaterial);
    leftWall.position.set(-2.6, 1.8, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 2.8, 4.2), woodMaterial);
    rightWall.position.set(2.6, 1.8, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, wallThickness), woodMaterial);
    frontWallLeft.position.set(-2, 1.8, 2.1);
    frontWallLeft.castShadow = true;
    group.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, wallThickness), woodMaterial);
    frontWallRight.position.set(2, 1.8, 2.1);
    frontWallRight.castShadow = true;
    group.add(frontWallRight);

    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, wallThickness), darkWoodMaterial);
    doorLintel.position.set(0, 2.6, 2.1);
    group.add(doorLintel);

    const tileMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });

    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 3.2, 0);

    const roofWidth = 7;
    const roofDepth = 6;
    const roofHeight = 1.8;

    for (let row = 0; row < 6; row++) {
      const rowWidth = roofWidth - row * 0.4;
      const tileGeometry = new THREE.BoxGeometry(rowWidth, 0.15, 0.8);
      const tileMaterialRow = row % 2 === 0 ? tileMaterial : darkWoodMaterial;

      const tileFront = new THREE.Mesh(tileGeometry, tileMaterialRow);
      tileFront.position.set(0, row * 0.2 + roofHeight - row * 0.15, roofDepth / 2 - row * 0.4);
      tileFront.rotation.x = -0.3;
      tileFront.castShadow = true;
      roofGroup.add(tileFront);

      const tileBack = new THREE.Mesh(tileGeometry, tileMaterialRow);
      tileBack.position.set(0, row * 0.2 + roofHeight - row * 0.15, -roofDepth / 2 + row * 0.4);
      tileBack.rotation.x = 0.3;
      tileBack.castShadow = true;
      roofGroup.add(tileBack);
    }

    const ridgeTile = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, roofWidth - 0.5, 8), tileMaterial);
    ridgeTile.rotation.z = Math.PI / 2;
    ridgeTile.position.set(0, roofHeight + 0.8, 0);
    ridgeTile.castShadow = true;
    roofGroup.add(ridgeTile);

    const eaveFront = new THREE.Mesh(new THREE.BoxGeometry(roofWidth + 0.5, 0.1, 0.3), darkWoodMaterial);
    eaveFront.position.set(0, 0.05, roofDepth / 2 + 0.3);
    roofGroup.add(eaveFront);

    const eaveBack = new THREE.Mesh(new THREE.BoxGeometry(roofWidth + 0.5, 0.1, 0.3), darkWoodMaterial);
    eaveBack.position.set(0, 0.05, -roofDepth / 2 - 0.3);
    roofGroup.add(eaveBack);

    const leftEave = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, roofDepth + 0.6), darkWoodMaterial);
    leftEave.position.set(-roofWidth / 2 - 0.15, 0.05, 0);
    roofGroup.add(leftEave);

    const rightEave = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, roofDepth + 0.6), darkWoodMaterial);
    rightEave.position.set(roofWidth / 2 + 0.15, 0.05, 0);
    roofGroup.add(rightEave);

    group.add(roofGroup);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.2, 0.2), darkWoodMaterial);
    beam.position.set(0, 3.1, 0);
    group.add(beam);

    const crossBeam1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4.4), darkWoodMaterial);
    crossBeam1.position.set(-2.5, 3.1, 0);
    group.add(crossBeam1);

    const crossBeam2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4.4), darkWoodMaterial);
    crossBeam2.position.set(2.5, 3.1, 0);
    group.add(crossBeam2);

    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), darkWoodMaterial);
    signPole.position.set(3.2, 2.5, 1);
    signPole.rotation.x = Math.PI / 2;
    group.add(signPole);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.08), signMaterial);
    signBoard.position.set(3.2, 2.5, 1.8);
    group.add(signBoard);

    this.createLantern(group, -2.8, 2.8, 2.5, lanternMaterial);
    this.createLantern(group, 2.8, 2.8, 2.5, lanternMaterial);

    const anvilBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8), stoneMaterial);
    anvilBase.position.set(-1.5, 0.55, 0);
    anvilBase.castShadow = true;
    group.add(anvilBase);

    const anvil = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    anvil.position.set(-1.5, 0.9, 0);
    anvil.castShadow = true;
    group.add(anvil);

    const furnaceBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.8, 8), stoneMaterial);
    furnaceBase.position.set(1.5, 0.8, -1);
    furnaceBase.castShadow = true;
    group.add(furnaceBase);

    const furnaceGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8),
      new THREE.MeshLambertMaterial({
        color: 0xff4500,
        emissive: 0xff4500,
        emissiveIntensity: 0.6,
      })
    );
    furnaceGlow.position.set(1.5, 1.3, -1);
    group.add(furnaceGlow);

    const furnaceLight = new THREE.PointLight(0xff4500, 0.6, 4);
    furnaceLight.position.set(1.5, 1.5, -1);
    group.add(furnaceLight);

    this.scene.add(group);
    this.buildings.push(group);
    group.userData = { name: "铁匠铺" };
  }

  /**
   * 创建灯笼
   */
  createLantern(parent, x, y, z, material) {
    const lanternGroup = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    lanternGroup.add(body);

    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
    const topGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.1, 8);
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 0.25, 0);
    lanternGroup.add(top);

    const bottomGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.1, 8);
    const bottom = new THREE.Mesh(bottomGeometry, topMaterial);
    bottom.position.set(0, -0.25, 0);
    lanternGroup.add(bottom);

    const ropeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
    const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.set(0, 0.5, 0);
    lanternGroup.add(rope);

    const light = new THREE.PointLight(0xff6b00, 0.5, 5);
    lanternGroup.add(light);

    lanternGroup.position.set(x, y, z);
    parent.add(lanternGroup);

    return lanternGroup;
  }

  /**
   * 创建修炼台
   */
  createTrainingPlatform(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x7b7b7b });
    const darkStoneMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const jadeMaterial = new THREE.MeshLambertMaterial({
      color: 0x4169e1,
      emissive: 0x4169e1,
      emissiveIntensity: 0.3,
    });
    const glowMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    });

    const baseLayers = [
      { y: 0.2, size: 5 },
      { y: 0.5, size: 4 },
      { y: 0.8, size: 3 },
    ];

    baseLayers.forEach((layer, index) => {
      const baseGeometry = new THREE.BoxGeometry(layer.size, 0.3, layer.size);
      const baseMaterial = index % 2 === 0 ? stoneMaterial : darkStoneMaterial;
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(0, layer.y, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);
    });

    for (let i = 0; i < 3; i++) {
      const stepGeometry = new THREE.BoxGeometry(1.5, 0.25, 0.6);
      const step = new THREE.Mesh(stepGeometry, stoneMaterial);
      step.position.set(0, 0.125 + i * 0.25, 4.0 - i * 0.6);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    const platformGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
    const platform = new THREE.Mesh(platformGeometry, jadeMaterial);
    platform.position.set(0, 1.1, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    const pillarPositions = [
      { x: -1.8, z: -1.8 },
      { x: 1.8, z: -1.8 },
      { x: -1.8, z: 1.8 },
      { x: 1.8, z: 1.8 },
    ];

    pillarPositions.forEach((pos) => {
      const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
      const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
      pillar.position.set(pos.x, 1.5, pos.z);
      pillar.castShadow = true;
      group.add(pillar);

      const capGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      const cap = new THREE.Mesh(capGeometry, darkStoneMaterial);
      cap.position.set(pos.x, 2.3, pos.z);
      cap.castShadow = true;
      group.add(cap);
    });

    const runePositions = [
      { x: 0, z: 2.4, rotY: 0 },
      { x: 0, z: -2.4, rotY: 0 },
      { x: 2.4, z: 0, rotY: Math.PI / 2 },
      { x: -2.4, z: 0, rotY: Math.PI / 2 },
    ];

    runePositions.forEach((pos) => {
      const runeGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.1);
      const rune = new THREE.Mesh(runeGeometry, glowMaterial);
      rune.position.set(pos.x, 0.35, pos.z);
      rune.rotation.y = pos.rotY;
      group.add(rune);
    });

    const beamMaterial = new THREE.MeshLambertMaterial({
      color: 0x4169e1,
      emissive: 0x4169e1,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.6,
    });
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.3, 3, 8);
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 2.8, 0);
    group.add(beam);

    const centerLight = new THREE.PointLight(0x4169e1, 0.8, 8);
    centerLight.position.set(0, 1.5, 0);
    group.add(centerLight);

    this.scene.add(group);
    this.buildings.push(group);
    group.userData = { name: "修炼台" };
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
