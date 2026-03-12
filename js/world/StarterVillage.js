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
    const segments = 128;
    const groundGeometry = new THREE.PlaneGeometry(this.width, this.height, segments, segments);
    const groundMaterial = this.createGroundMaterial();

    this.generateHeightMap(segments);
    this.applyVertexDisplacement(groundGeometry, segments);

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  /**
   * 创建地面材质（支持多材质混合）
   */
  createGroundMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        grassColor: { value: new THREE.Color(0x3d5c3d) },
        stoneColor: { value: new THREE.Color(0x8a8a8a) },
        dirtColor: { value: new THREE.Color(0x6b4423) },
        plazaCenter: { value: new THREE.Vector2(0, 0) },
        trainingCenter: { value: new THREE.Vector2(-18, -18) },
        plazaRadius: { value: 8 },
        trainingSize: { value: 15 },
      },
      vertexShader: `
                precision highp float;
                varying vec3 vPosition;
                varying float vHeight;
                
                void main() {
                    vPosition = position;
                    vHeight = position.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                precision highp float;
                uniform vec3 grassColor;
                uniform vec3 stoneColor;
                uniform vec3 dirtColor;
                uniform vec2 plazaCenter;
                uniform vec2 trainingCenter;
                uniform float plazaRadius;
                uniform float trainingSize;
                
                varying vec3 vPosition;
                varying float vHeight;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                float smoothNoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    float a = noise(i);
                    float b = noise(i + vec2(1.0, 0.0));
                    float c = noise(i + vec2(0.0, 1.0));
                    float d = noise(i + vec2(1.0, 1.0));
                    
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    
                    for (int i = 0; i < 4; i++) {
                        value += amplitude * smoothNoise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    
                    return value;
                }
                
                void main() {
                    vec2 worldPos = vPosition.xz;
                    
                    float plazaDist = length(worldPos - plazaCenter);
                    float trainingDist = max(abs(worldPos.x - trainingCenter.x), abs(worldPos.z - trainingCenter.z));
                    
                    float plazaFactor = 1.0 - smoothstep(plazaRadius - 2.0, plazaRadius, plazaDist);
                    float trainingFactor = 1.0 - smoothstep(trainingSize/2.0 - 1.0, trainingSize/2.0, trainingDist);
                    
                    float slope = abs(vHeight) * 3.0;
                    float dirtFactor = smoothstep(0.1, 0.3, slope);
                    
                    float n = fbm(worldPos * 0.5);
                    vec3 grass = mix(grassColor * 0.8, grassColor * 1.2, n);
                    vec3 stone = mix(stoneColor * 0.9, stoneColor * 1.1, n * 0.5);
                    vec3 dirt = mix(dirtColor * 0.8, dirtColor * 1.2, n * 0.5);
                    
                    vec3 finalColor = grass;
                    finalColor = mix(finalColor, dirt, dirtFactor);
                    finalColor = mix(finalColor, stone, plazaFactor);
                    finalColor = mix(finalColor, dirt * 0.8, trainingFactor);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
      side: THREE.DoubleSide,
    });
  }

  /**
   * 生成高度图数据
   */
  generateHeightMap(segments) {
    const size = segments + 1;
    this.heightMap = new Array(size * size);

    const noise = (x, y) => {
      const nx = x * 0.15;
      const ny = y * 0.15;
      return Math.sin(nx) * Math.cos(ny) * 0.3;
    };

    const fbm = (x, y, octaves = 4) => {
      let value = 0;
      let amplitude = 0.5;
      let frequency = 1;

      for (let i = 0; i < octaves; i++) {
        value += amplitude * (Math.sin(x * frequency * 0.5) * Math.cos(y * frequency * 0.5) * 0.5 + 0.5);
        frequency *= 2;
        amplitude *= 0.5;
      }

      return value - 0.5;
    };

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i / segments - 0.5) * this.width;
        const z = (j / segments - 0.5) * this.height;

        let height = fbm(x, z) * 1.2;

        const plazaDist = Math.sqrt(x * x + z * z);
        const trainingDist = Math.max(Math.abs(x + 18), Math.abs(z + 18));

        if (plazaDist < 10) {
          height *= (1 - Math.pow(plazaDist / 10, 2)) * 0.2;
        }

        if (trainingDist < 9) {
          height = -0.5 + height * 0.1;
        } else if (trainingDist < 10) {
          const blend = (trainingDist - 9) / 1;
          height = mix(-0.5, height, blend);
        }

        const detail = fbm(x * 3, z * 3, 2) * 0.15;
        height += detail;

        this.heightMap[i * size + j] = height;
      }
    }

    function mix(a, b, t) {
      return a * (1 - t) + b * t;
    }
  }

  /**
   * 应用顶点位移
   */
  applyVertexDisplacement(geometry, segments) {
    const positionAttribute = geometry.attributes.position;
    const size = segments + 1;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        const height = this.heightMap[index];
        positionAttribute.setY(index, height);
      }
    }

    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;
  }

  /**
   * 获取指定位置的地形高度
   */
  getTerrainHeight(x, z) {
    const segments = 128;
    const size = segments + 1;

    const nx = (x / this.width + 0.5) * segments;
    const nz = (z / this.height + 0.5) * segments;

    const i = Math.floor(nx);
    const j = Math.floor(nz);

    if (i < 0 || i >= segments || j < 0 || j >= segments) {
      return 0;
    }

    const fx = nx - i;
    const fz = nz - j;

    const h00 = this.heightMap[i * size + j];
    const h01 = this.heightMap[i * size + (j + 1)];
    const h10 = this.heightMap[(i + 1) * size + j];
    const h11 = this.heightMap[(i + 1) * size + (j + 1)];

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
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
      const terrainHeight = this.getTerrainHeight(config.x, config.z);
      const geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
      const material = new THREE.MeshLambertMaterial({
        color: config.color,
      });

      const building = new THREE.Mesh(geometry, material);
      building.position.set(config.x, terrainHeight + config.h / 2, config.z);
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
      const terrainHeight = this.getTerrainHeight(pos.x, pos.z);
      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, terrainHeight + 0.75, pos.z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      // 树冠
      const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(pos.x, terrainHeight + 3, pos.z);
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
      const terrainHeight = this.getTerrainHeight(pos.x, pos.z);
      const geometry = new THREE.DodecahedronGeometry(pos.s);
      const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, terrainHeight + pos.s * 0.5, pos.z);
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
      const terrainHeight = this.getTerrainHeight(config.position.x, config.position.z);
      npc.position.y = terrainHeight;
      const mesh = npc.createMesh();

      this.scene.add(mesh);

      if (npc.glowMesh) {
        npc.glowMesh.position.y = terrainHeight + 0.05;
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
        const terrainHeight = this.getTerrainHeight(pos.x, pos.z);
        const adjustedPos = { ...pos, y: terrainHeight };
        const monster = new Monster(spawn.monsterId, adjustedPos);
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
