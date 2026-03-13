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

    // 水面相关
    this.water = null;
    this.waterBottom = null;
    this.spiritSpringParticles = null;
    this.waterTime = 0;
    this.waterPoolCenter = { x: 0, z: 18 };
  }

  /**
   * 创建场景
   */
  create(scene) {
    this.scene = scene;

    this.createGround();
    this.createWalls();
    this.createBuildings();
    this.createWaterPool();
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
   * 创建灵泉水池
   */
  createWaterPool() {
    const poolRadius = 4;
    const centerX = this.waterPoolCenter.x;
    const centerZ = this.waterPoolCenter.z;

    // 草地遮盖层（覆盖水池区域的草地）
    const coverGeometry = new THREE.CircleGeometry(poolRadius + 0.5, 32);
    const coverMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a3a3a,
      side: THREE.DoubleSide,
    });
    const cover = new THREE.Mesh(coverGeometry, coverMaterial);
    cover.rotation.x = -Math.PI / 2;
    cover.position.set(centerX, 0.01, centerZ);
    cover.receiveShadow = true;
    this.scene.add(cover);

    // 水池底部（深色石板）
    const bottomGeometry = new THREE.CircleGeometry(poolRadius, 32);
    const bottomMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a3a4a,
      side: THREE.DoubleSide,
    });
    this.waterBottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
    this.waterBottom.rotation.x = -Math.PI / 2;
    this.waterBottom.position.set(centerX, -0.3, centerZ);
    this.waterBottom.receiveShadow = true;
    this.scene.add(this.waterBottom);

    // 水池边缘石块
    const edgeSegments = 16;
    for (let i = 0; i < edgeSegments; i++) {
      const angle = (i / edgeSegments) * Math.PI * 2;
      const rockGeometry = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.3);
      const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x556666 });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        centerX + Math.cos(angle) * (poolRadius + 0.3),
        0.2,
        centerZ + Math.sin(angle) * (poolRadius + 0.3)
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // 水面 - 带顶点波动的平面
    const waterGeometry = new THREE.PlaneGeometry(poolRadius * 2, poolRadius * 2, 32, 32);

    // 存储原始顶点位置用于波动计算
    const positions = waterGeometry.attributes.position;
    this.waterOriginalPositions = positions.array.slice();

    // 水面材质 - 半透明，带反光
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x3388aa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      shininess: 100,
      specular: 0xffffff,
      envMapIntensity: 1.0,
    });

    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(centerX, 0.05, centerZ);
    this.water.receiveShadow = true;
    this.scene.add(this.water);

    // 灵泉中心发光核心
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.8,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(centerX, -0.1, centerZ);
    this.scene.add(core);
    this.springCore = core;

    // 灵泉粒子系统
    this.createSpiritSpringParticles(centerX, centerZ);

    // 水面点光源
    const waterLight = new THREE.PointLight(0x44aaff, 0.8, 10);
    waterLight.position.set(centerX, 1, centerZ);
    this.scene.add(waterLight);
    this.waterLight = waterLight;
  }

  /**
   * 创建灵泉粒子效果
   */
  createSpiritSpringParticles(centerX, centerZ) {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    this.particleData = [];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;

      positions[i3] = centerX + Math.cos(angle) * radius;
      positions[i3 + 1] = Math.random() * 2;
      positions[i3 + 2] = centerZ + Math.sin(angle) * radius;

      // 青色到白色渐变
      const brightness = 0.6 + Math.random() * 0.4;
      colors[i3] = brightness * 0.4;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;

      sizes[i] = 0.1 + Math.random() * 0.15;

      this.particleData.push({
        angle: angle,
        radius: radius,
        speed: 0.5 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
        life: Math.random(),
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.spiritSpringParticles = new THREE.Points(geometry, material);
    this.spiritSpringParticles.userData.centerX = centerX;
    this.spiritSpringParticles.userData.centerZ = centerZ;
    this.scene.add(this.spiritSpringParticles);
  }

  /**
   * 更新水面波动
   */
  updateWater(deltaTime) {
    if (!this.water) return;

    this.waterTime += deltaTime;

    const positions = this.water.geometry.attributes.position;
    const original = this.waterOriginalPositions;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const x = original[i3];
      const y = original[i3 + 1];

      // 多层波纹叠加
      const wave1 = Math.sin(x * 0.5 + this.waterTime * 2) * 0.05;
      const wave2 = Math.sin(y * 0.8 + this.waterTime * 1.5) * 0.03;
      const wave3 = Math.sin((x + y) * 0.3 + this.waterTime * 3) * 0.02;

      // 中心涟漪
      const distFromCenter = Math.sqrt(x * x + y * y);
      const ripple = Math.sin(distFromCenter * 2 - this.waterTime * 4) * 0.03 * Math.max(0, 1 - distFromCenter / 4);

      positions.array[i3 + 2] = wave1 + wave2 + wave3 + ripple;
    }

    positions.needsUpdate = true;
    this.water.geometry.computeVertexNormals();
  }

  /**
   * 更新灵泉粒子
   */
  updateSpiritSpringParticles(deltaTime) {
    if (!this.spiritSpringParticles) return;

    const positions = this.spiritSpringParticles.geometry.attributes.position;
    const colors = this.spiritSpringParticles.geometry.attributes.color;
    const centerX = this.spiritSpringParticles.userData.centerX;
    const centerZ = this.spiritSpringParticles.userData.centerZ;

    for (let i = 0; i < this.particleData.length; i++) {
      const data = this.particleData[i];
      const i3 = i * 3;

      data.life += deltaTime * data.speed * 0.5;

      if (data.life >= 1) {
        data.life = 0;
        data.angle = Math.random() * Math.PI * 2;
        data.radius = Math.random() * 0.5;
      }

      const height = data.life * 2.5;
      const spiralAngle = data.angle + data.life * Math.PI * 2;
      const spiralRadius = data.radius + data.life * 0.3;

      positions.array[i3] = centerX + Math.cos(spiralAngle) * spiralRadius;
      positions.array[i3 + 1] = height;
      positions.array[i3 + 2] = centerZ + Math.sin(spiralAngle) * spiralRadius;

      // 颜色随高度变化
      const alpha = 1 - data.life * 0.5;
      colors.array[i3] = alpha * 0.4;
      colors.array[i3 + 1] = alpha;
      colors.array[i3 + 2] = alpha;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;

    // 核心脉动
    if (this.springCore) {
      const pulse = 1 + Math.sin(this.waterTime * 3) * 0.2;
      this.springCore.scale.set(pulse, pulse, pulse);
    }

    // 光源闪烁
    if (this.waterLight) {
      this.waterLight.intensity = 0.6 + Math.sin(this.waterTime * 2) * 0.2;
    }
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
    // 更新水面波动
    this.updateWater(deltaTime);

    // 更新灵泉粒子
    this.updateSpiritSpringParticles(deltaTime);

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
