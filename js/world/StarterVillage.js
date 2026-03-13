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

    // 水面系统
    this.water = null;
    this.waterParticles = [];
    this.particleTime = 0;

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
    this.createWater();
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
   * 创建水面
   */
  createWater() {
    const waterRadius = 4;
    const segments = 64;

    // 创建圆形水池坑 - 使用圆柱体侧面作为池壁
    const wallHeight = 1.2;
    const wallGeometry = new THREE.CylinderGeometry(waterRadius, waterRadius, wallHeight, 64, 1, true);
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x6a6a6a,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(12, -wallHeight / 2 + 0.2, 12);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);

    // 池底 - 圆形
    const bottomGeometry = new THREE.CircleGeometry(waterRadius, 64);
    const bottomMaterial = new THREE.MeshLambertMaterial({
      color: 0x0a2a3a,
      side: THREE.DoubleSide,
    });
    const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.set(12, -0.8, 12);
    bottom.receiveShadow = true;
    this.scene.add(bottom);

    // 池边石环
    const rimGeometry = new THREE.TorusGeometry(waterRadius, 0.25, 16, 64);
    const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(12, 0.2, 12);
    rim.castShadow = true;
    rim.receiveShadow = true;
    this.scene.add(rim);

    // 水面 - 圆形平面，使用高段数以实现顶点波动
    const waterGeometry = new THREE.CircleGeometry(waterRadius - 0.1, segments);

    // 将圆形几何体转为平面几何体的顶点布局以便波动
    const positions = waterGeometry.attributes.position;
    const originalPositions = positions.array.slice();
    waterGeometry.userData = {
      originalPositions: originalPositions,
    };

    // 水面材质 - 更透明以看到水底
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x5ab5c5,
      transparent: true,
      opacity: 0.5,
      shininess: 120,
      specular: 0xffffff,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(12, 0, 12);
    this.scene.add(this.water);

    // 初始化灵泉粒子
    this.createWaterParticles();
  }

  /**
   * 创建灵泉粒子
   */
  createWaterParticles() {
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      // 使用八面体几何体让粒子更像金粒
      const geometry = new THREE.OctahedronGeometry(0.12, 0);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.95,
      });

      const particle = new THREE.Mesh(geometry, material);

      // 初始化粒子属性
      particle.userData = {
        speed: 1.0 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        radius: 0.1 + Math.random() * 0.3,
        maxHeight: 1.5 + Math.random() * 1.5,
        initialY: -0.5,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 3,
          z: (Math.random() - 0.5) * 3,
        },
      };

      // 随机初始位置 - 从中心小范围开始
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.3;
      particle.position.set(12 + Math.cos(angle) * r, particle.userData.initialY, 12 + Math.sin(angle) * r);

      this.scene.add(particle);
      this.waterParticles.push(particle);
    }

    // 添加中心发光效果 - 灵泉核心
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.6,
    });
    this.waterGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.waterGlow.position.set(12, -0.2, 12);
    this.scene.add(this.waterGlow);

    // 添加灵泉底座 - 发光的泉眼
    const springGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 16);
    const springMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.7,
    });
    this.waterSpring = new THREE.Mesh(springGeometry, springMaterial);
    this.waterSpring.position.set(12, -0.6, 12);
    this.scene.add(this.waterSpring);

    // 添加点光源增强效果
    const pointLight = new THREE.PointLight(0xffaa00, 1.5, 12);
    pointLight.position.set(12, 0.5, 12);
    this.scene.add(pointLight);
    this.waterLight = pointLight;
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

    // 更新水面动画
    this.updateWater(deltaTime);

    return attackResults;
  }

  /**
   * 更新水面和粒子动画
   */
  updateWater(deltaTime) {
    if (!this.water) return;

    this.particleTime += deltaTime;

    // 更新水面顶点波动
    const positions = this.water.geometry.attributes.position;
    const originalPositions = this.water.geometry.userData.originalPositions;
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      const x = originalPositions[i * 3];
      const y = originalPositions[i * 3 + 1];

      // 计算到中心的距离，边缘波动较小
      const distFromCenter = Math.sqrt(x * x + y * y);
      const edgeFactor = Math.max(0, 1 - distFromCenter / 4);

      // 多层波动叠加，创造自然的水面效果
      const wave1 = Math.sin(x * 0.8 + this.particleTime * 1.5) * 0.1 * edgeFactor;
      const wave2 = Math.sin(y * 0.6 + this.particleTime * 1.2) * 0.08 * edgeFactor;
      const wave3 = Math.sin((x + y) * 0.4 + this.particleTime * 0.8) * 0.05 * edgeFactor;
      const wave4 = Math.sin(distFromCenter * 2 - this.particleTime * 2) * 0.03 * edgeFactor;

      positions.setZ(i, wave1 + wave2 + wave3 + wave4);
    }

    positions.needsUpdate = true;
    this.water.geometry.computeVertexNormals();

    // 更新灵泉粒子
    this.waterParticles.forEach((particle, index) => {
      const data = particle.userData;

      // 计算粒子上升进度 (0 到 1)
      const cycle = (this.particleTime * data.speed + data.offset) % (Math.PI * 2);
      const progress = (Math.sin(cycle) + 1) / 2;

      // 更新高度
      particle.position.y = data.initialY + progress * data.maxHeight;

      // 螺旋上升运动
      const angle = this.particleTime * 2 + data.offset;
      const currentRadius = data.radius * (1 - progress * 0.3);
      particle.position.x = 12 + Math.cos(angle) * currentRadius;
      particle.position.z = 12 + Math.sin(angle) * currentRadius;

      // 粒子旋转
      particle.rotation.x += data.rotationSpeed.x * deltaTime;
      particle.rotation.y += data.rotationSpeed.y * deltaTime;
      particle.rotation.z += data.rotationSpeed.z * deltaTime;

      // 根据高度调整透明度和大小
      const fadeOut = Math.max(0.2, 1 - progress);
      particle.material.opacity = 0.9 * fadeOut;
      const scale = 0.3 + progress * 0.7;
      particle.scale.setScalar(scale);
    });

    // 更新中心发光效果
    if (this.waterGlow) {
      const glowPulse = 0.5 + Math.sin(this.particleTime * 4) * 0.25;
      this.waterGlow.material.opacity = glowPulse;
      const glowScale = 1 + Math.sin(this.particleTime * 5) * 0.2;
      this.waterGlow.scale.setScalar(glowScale);
      // 上下浮动
      this.waterGlow.position.y = -0.2 + Math.sin(this.particleTime * 3) * 0.1;
    }

    // 更新泉眼底座脉动
    if (this.waterSpring) {
      const springPulse = 0.6 + Math.sin(this.particleTime * 3) * 0.2;
      this.waterSpring.material.opacity = springPulse;
      const springScale = 1 + Math.sin(this.particleTime * 4) * 0.1;
      this.waterSpring.scale.setScalar(springScale);
    }

    // 更新光源脉动
    if (this.waterLight) {
      this.waterLight.intensity = 1.0 + Math.sin(this.particleTime * 4) * 0.5;
    }
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
