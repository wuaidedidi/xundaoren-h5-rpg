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
   * 创建地面 - 使用顶点位移实现地形起伏
   */
  createGround() {
    // 创建高分辨率地形网格
    const segments = 64;
    const groundGeometry = new THREE.PlaneGeometry(this.width, this.height, segments, segments);

    // 获取顶点位置属性
    const positionAttribute = groundGeometry.attributes.position;
    const vertexCount = positionAttribute.count;

    // 为每个顶点计算高度
    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      // 计算该位置的地形高度
      const height = this.calculateTerrainHeight(x, y);
      positionAttribute.setZ(i, height);
    }

    // 重新计算法线以获得正确的光照
    groundGeometry.computeVertexNormals();

    // 创建草地材质 - 使用更自然的黄绿色调
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d7a47,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // 创建中央广场（石板路）- 带有轻微高度
    this.createPlaza();

    // 创建练功区（泥地）- 比广场低一些
    this.createTrainingArea();

    // 创建连接路径
    this.createPathways();
  }

  /**
   * 计算地形高度 - 广场高，练功区低，周围有自然起伏
   */
  calculateTerrainHeight(x, y) {
    // 注意：在PlaneGeometry中，y实际上是z坐标（深度）
    const z = y;

    // 基础高度
    let height = 0;

    // 中央广场区域（半径8）- 抬高1.5个单位
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 10) {
      // 广场内部基本平坦，边缘有平滑过渡
      const plazaHeight = 1.5;
      if (distFromCenter < 8) {
        height = plazaHeight;
      } else {
        // 边缘平滑过渡
        const t = (distFromCenter - 8) / 2;
        height = plazaHeight * (1 - t * t);
      }
    }

    // 练功区区域（左下角）- 比周围低0.8个单位
    const trainingCenterX = -18;
    const trainingCenterZ = -18;
    const distFromTraining = Math.sqrt((x - trainingCenterX) ** 2 + (z - trainingCenterZ) ** 2);

    if (distFromTraining < 12) {
      // 练功区是一个凹陷区域
      const trainingDepth = -0.8;
      if (distFromTraining < 8) {
        // 内部平坦
        height = Math.min(height, trainingDepth);
      } else {
        // 边缘平滑过渡
        const t = (distFromTraining - 8) / 4;
        const trainingHeight = trainingDepth * (1 - t * t);
        height = Math.min(height, trainingHeight);
      }
    }

    // 添加自然起伏（使用多层噪声模拟）
    const noise1 = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.3;
    const noise2 = Math.sin(x * 0.3 + 1.5) * Math.sin(z * 0.25 + 0.5) * 0.15;
    const noise3 = Math.sin(x * 0.5) * Math.cos(z * 0.4) * 0.08;

    // 在广场和练功区内部减少起伏，外部增加自然起伏
    let noiseScale = 1.0;
    if (distFromCenter < 8) noiseScale = 0.1; // 广场内部几乎平坦
    else if (distFromTraining < 8) noiseScale = 0.2; // 练功区内部较平坦
    else if (distFromCenter < 15) noiseScale = 0.5; // 广场周围适度起伏

    height += (noise1 + noise2 + noise3) * noiseScale;

    return height;
  }

  /**
   * 创建中央广场 - 石板路材质
   */
  createPlaza() {
    // 主广场区域 - 使用圆形石板，暖色调浅灰
    const plazaGeometry = new THREE.CircleGeometry(8, 32);
    const plazaMaterial = new THREE.MeshStandardMaterial({
      color: 0xa8a49a,
      roughness: 0.75,
      metalness: 0.02,
    });
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 1.51, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 创建棋盘格图案 - 更协调的深浅交替
    const lightStone = 0xb5b1a5;
    const darkStone = 0x9a968a;
    const tileSize = 2;
    const gridRadius = 7;

    for (let x = -gridRadius; x <= gridRadius; x += tileSize) {
      for (let z = -gridRadius; z <= gridRadius; z += tileSize) {
        // 计算到中心的距离，只绘制圆形范围内的部分
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter > 7.5) continue;

        // 棋盘格交替
        const isDark = (x / tileSize + z / tileSize) % 2 === 0;
        const tileGeometry = new THREE.PlaneGeometry(tileSize * 0.95, tileSize * 0.95);
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: isDark ? darkStone : lightStone,
          roughness: 0.8,
        });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x + tileSize / 2, 1.52, z + tileSize / 2);
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }

    // 广场边缘石砖 - 使用更深的暖灰色作为边界
    const edgeGeometry = new THREE.RingGeometry(8, 9, 32);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a7569,
      roughness: 0.85,
      metalness: 0.02,
    });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(0, 1.5, 0);
    edge.receiveShadow = true;
    this.scene.add(edge);

    // 广场中心装饰 - 太极图案风格的圆形
    const centerY = 1.53;

    // 外圈
    const centerOuterGeometry = new THREE.CircleGeometry(2.2, 32);
    const centerOuterMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b877d,
      roughness: 0.7,
    });
    const centerOuter = new THREE.Mesh(centerOuterGeometry, centerOuterMaterial);
    centerOuter.rotation.x = -Math.PI / 2;
    centerOuter.position.set(0, centerY, 0);
    this.scene.add(centerOuter);

    // 内圈
    const centerInnerGeometry = new THREE.CircleGeometry(1.5, 32);
    const centerInnerMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4c0b4,
      roughness: 0.65,
    });
    const centerInner = new THREE.Mesh(centerInnerGeometry, centerInnerMaterial);
    centerInner.rotation.x = -Math.PI / 2;
    centerInner.position.set(0, centerY + 0.01, 0);
    this.scene.add(centerInner);
  }

  /**
   * 创建练功区 - 泥地材质，比广场低
   */
  createTrainingArea() {
    const centerX = -18;
    const centerZ = -18;
    const baseY = -0.8;

    // 练功区主地面 - 使用与整体风格协调的暖色调
    const dirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 1.0,
      metalness: 0.0,
    });
    const trainingGeometry = new THREE.PlaneGeometry(16, 16);
    const training = new THREE.Mesh(trainingGeometry, dirtMaterial);
    training.rotation.x = -Math.PI / 2;
    training.position.set(centerX, baseY + 0.01, centerZ);
    training.receiveShadow = true;
    this.scene.add(training);

    // 创建同心圆训练圈 - 与广场风格呼应
    const ringColors = [0x9a8269, 0xa89075, 0x8b7355, 0x7a654f];
    const ringRadii = [7, 5, 3, 1.5];

    ringRadii.forEach((radius, index) => {
      const ringGeometry = new THREE.RingGeometry(radius - 0.3, radius, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: ringColors[index],
        roughness: 1.0,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(centerX, baseY + 0.02 + index * 0.005, centerZ);
      this.scene.add(ring);
    });

    // 训练木桩 - 放置在四个方向
    const postPositions = [
      { x: centerX - 4, z: centerZ - 4 },
      { x: centerX + 4, z: centerZ - 4 },
      { x: centerX - 4, z: centerZ + 4 },
      { x: centerX + 4, z: centerZ + 4 },
    ];

    postPositions.forEach((pos) => {
      // 木桩底座
      const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b5a4a,
        roughness: 1.0,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, baseY + 0.075, pos.z);
      this.scene.add(base);

      // 木桩主体
      const postGeometry = new THREE.CylinderGeometry(0.18, 0.2, 1.5, 8);
      const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x7a6a5a,
        roughness: 0.95,
      });
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, baseY + 0.9, pos.z);
      post.castShadow = true;
      post.receiveShadow = true;
      this.scene.add(post);

      // 木桩顶部的麻绳标记
      const markGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8);
      const markMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4c4a8,
        roughness: 0.9,
      });
      const mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.set(pos.x, baseY + 1.6, pos.z);
      this.scene.add(mark);
    });

    // 练功区边缘装饰
    const edgeGeometry = new THREE.RingGeometry(7.8, 8.2, 32);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b5a4a,
      roughness: 1.0,
    });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(centerX, baseY + 0.03, centerZ);
    this.scene.add(edge);
  }

  /**
   * 创建连接路径
   */
  createPathways() {
    // 从广场到练功区的小径 - 使用与练功区协调的土路色
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7d6b,
      roughness: 1.0,
      metalness: 0.0,
    });

    // 创建曲线路径
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.8, -8),
      new THREE.Vector3(-10, 0.5, -10),
      new THREE.Vector3(-13, 0.2, -13),
      new THREE.Vector3(-16, -0.3, -16),
    ]);

    const pathGeometry = new THREE.TubeGeometry(pathCurve, 20, 1.5, 8, false);
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.1;
    path.scale.y = 0.05; // 压扁成路面
    path.receiveShadow = true;
    this.scene.add(path);

    // 添加一些零散的石板作为路径标记 - 使用与广场协调的暖灰色
    const stonePositions = [
      { x: -5, z: 12 },
      { x: 8, z: 15 },
      { x: -12, z: 8 },
      { x: 15, z: -5 },
      { x: -8, z: -5 },
    ];

    stonePositions.forEach((pos) => {
      const stoneGeometry = new THREE.CylinderGeometry(0.8, 1, 0.1, 6);
      const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x9e9a8e,
        roughness: 0.75,
      });
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(pos.x, this.calculateTerrainHeight(pos.x, pos.z) + 0.05, pos.z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      this.scene.add(stone);
    });
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
      // 根据地形高度调整建筑位置
      const groundHeight = this.calculateTerrainHeight(config.x, config.z);
      building.position.set(config.x, groundHeight + config.h / 2, config.z);
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
      // 根据地形高度调整树木位置
      const groundHeight = this.calculateTerrainHeight(pos.x, pos.z);

      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, groundHeight + 0.75, pos.z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      // 树冠
      const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(pos.x, groundHeight + 3, pos.z);
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
      const groundHeight = this.calculateTerrainHeight(pos.x, pos.z);

      const geometry = new THREE.DodecahedronGeometry(pos.s);
      const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, groundHeight + pos.s * 0.5, pos.z);
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

      // 根据地形高度调整NPC位置
      const groundHeight = this.calculateTerrainHeight(mesh.position.x, mesh.position.z);
      mesh.position.y = groundHeight;
      if (npc.glowMesh) {
        npc.glowMesh.position.y = groundHeight;
      }

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

        // 根据地形高度调整怪物位置
        const groundHeight = this.calculateTerrainHeight(pos.x, pos.z);
        monster.position.y = groundHeight;
        mesh.position.y = groundHeight + monster.size / 2;

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

    // 更新怪物 - 传入地形高度函数
    const attackResults = [];
    this.monsters.forEach((monster) => {
      const result = monster.update(deltaTime, player, (x, z) => this.calculateTerrainHeight(x, z));
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

  /**
   * 获取指定位置的地形高度
   */
  getTerrainHeightAt(x, z) {
    return this.calculateTerrainHeight(x, z);
  }
}
