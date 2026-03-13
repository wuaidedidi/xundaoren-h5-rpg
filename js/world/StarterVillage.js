/**
 * 寻道人 - 新手村场景
 * 包含地形、建筑、NPC和怪物
 */

import NPC from "../entities/NPC.js";
import Monster from "../entities/Monster.js";
import { getAllNPCs, getVisibleNPCs } from "../data/npcs.js";

export default class StarterVillage {
  constructor() {
    this.width = 50;
    this.height = 50;
    this.bounds = {
      minX: -this.width / 2,
      maxX: this.width / 2,
      minZ: -this.height / 2,
      maxZ: this.height / 2,
    };

    this.ground = null;
    this.plaza = null;
    this.training = null;
    this.walls = [];
    this.buildings = [];
    this.npcs = [];
    this.monsters = [];

    this.groundMaterials = {
      normal: null,
      wet: null,
    };

    this.plazaMaterial = {
      normal: null,
      wet: null,
    };

    this.trainingMaterial = {
      normal: null,
      wet: null,
    };

    this.isWet = false;
    this.puddles = [];
    this.puddleTime = 0;

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
      {
        monsterId: "stoneGolem",
        positions: [{ x: 0, y: 0, z: -22 }],
      },
    ];
  }

  create(scene) {
    this.scene = scene;

    this.createGround();
    this.createWalls();
    this.createBuildings();
    this.createNPCs();
    this.createMonsters();

    console.log("新手村场景创建完成");
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(this.width, this.height);

    this.groundMaterials.normal = new THREE.MeshLambertMaterial({
      color: 0x3d5c3d,
      side: THREE.DoubleSide,
    });

    this.groundMaterials.wet = new THREE.MeshStandardMaterial({
      color: 0x1a3a2a,
      roughness: 0.05,
      metalness: 0.8,
      side: THREE.DoubleSide,
      envMapIntensity: 2.0,
    });

    this.ground = new THREE.Mesh(groundGeometry, this.groundMaterials.normal);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const plazaGeometry = new THREE.CircleGeometry(8, 32);

    this.plazaMaterial.normal = new THREE.MeshLambertMaterial({
      color: 0x808080,
    });

    this.plazaMaterial.wet = new THREE.MeshStandardMaterial({
      color: 0x404050,
      roughness: 0.02,
      metalness: 0.9,
      envMapIntensity: 2.5,
    });

    this.plaza = new THREE.Mesh(plazaGeometry, this.plazaMaterial.normal);
    this.plaza.rotation.x = -Math.PI / 2;
    this.plaza.position.y = 0.01;
    this.plaza.receiveShadow = true;
    this.scene.add(this.plaza);

    const trainingGeometry = new THREE.PlaneGeometry(15, 15);

    this.trainingMaterial.normal = new THREE.MeshLambertMaterial({
      color: 0x2d4c2d,
    });

    this.trainingMaterial.wet = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.08,
      metalness: 0.7,
      envMapIntensity: 1.8,
    });

    this.training = new THREE.Mesh(trainingGeometry, this.trainingMaterial.normal);
    this.training.rotation.x = -Math.PI / 2;
    this.training.position.set(-18, 0.01, -18);
    this.training.receiveShadow = true;
    this.scene.add(this.training);

    this.createPuddles();
  }

  createPuddles() {
    const puddlePositions = [
      { x: 5, z: 3, r: 2.5 },
      { x: -8, z: -5, r: 1.8 },
      { x: 12, z: -8, r: 2.0 },
      { x: -15, z: 8, r: 1.5 },
      { x: 3, z: -12, r: 2.2 },
      { x: -5, z: 10, r: 1.6 },
      { x: 18, z: 5, r: 1.8 },
      { x: -20, z: -15, r: 2.0 },
    ];

    puddlePositions.forEach((pos) => {
      const puddleGeom = new THREE.CircleGeometry(pos.r, 32);
      const puddleMat = new THREE.MeshStandardMaterial({
        color: 0x2a3a4a,
        roughness: 0.0,
        metalness: 1.0,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 3.0,
      });

      const puddle = new THREE.Mesh(puddleGeom, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(pos.x, 0.02, pos.z);
      puddle.receiveShadow = true;
      puddle.visible = false;
      this.scene.add(puddle);
      this.puddles.push({ mesh: puddle, baseScale: 1 });
    });
  }

  setWetGround(isWet) {
    if (this.isWet === isWet) return;
    this.isWet = isWet;

    if (this.ground) {
      this.ground.material = isWet ? this.groundMaterials.wet : this.groundMaterials.normal;
    }
    if (this.plaza) {
      this.plaza.material = isWet ? this.plazaMaterial.wet : this.plazaMaterial.normal;
    }
    if (this.training) {
      this.training.material = isWet ? this.trainingMaterial.wet : this.trainingMaterial.normal;
    }

    this.puddles.forEach((p) => {
      p.mesh.visible = isWet;
    });
  }

  updatePuddles(deltaTime) {
    if (!this.isWet) return;

    this.puddleTime += deltaTime;

    this.puddles.forEach((p, i) => {
      const ripple = Math.sin(this.puddleTime * 2 + i) * 0.05;
      p.mesh.scale.setScalar(1 + ripple);
    });
  }

  createWalls() {
    const wallHeight = 3;
    const wallThickness = 1;
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x5c4033,
    });

    const wallConfigs = [
      { w: this.width, h: wallThickness, x: 0, z: -this.height / 2 - wallThickness / 2 },
      { w: this.width, h: wallThickness, x: 0, z: this.height / 2 + wallThickness / 2 },
      { w: wallThickness, h: this.height, x: -this.width / 2 - wallThickness / 2, z: 0 },
      { w: wallThickness, h: this.height, x: this.width / 2 + wallThickness / 2, z: 0 },
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

    this.createDecorations();
  }

  createDecorations() {
    const treePositions = [
      { x: -10, z: 15 },
      { x: 10, z: 18 },
      { x: -8, z: -8 },
      { x: 8, z: -10 },
      { x: -20, z: 8 },
    ];

    treePositions.forEach((pos) => {
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 0.75, pos.z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const crownGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(pos.x, 3, pos.z);
      crown.castShadow = true;
      this.scene.add(crown);
    });

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

    console.log("创建了 " + this.npcs.length + " 个NPC");
  }

  createMonsters() {
    this.monsterSpawns.forEach((spawn) => {
      spawn.positions.forEach((pos) => {
        const monster = new Monster(spawn.monsterId, pos);
        const mesh = monster.createMesh();

        this.scene.add(mesh);
        this.monsters.push(monster);
      });
    });

    console.log("创建了 " + this.monsters.length + " 个怪物");
  }

  update(deltaTime, player) {
    this.npcs.forEach((npc) => {
      npc.update(deltaTime);
    });

    const attackResults = [];
    this.monsters.forEach((monster) => {
      const result = monster.update(deltaTime, player);
      if (result && result.type === "attack") {
        attackResults.push(result);
      }
    });

    this.updatePuddles(deltaTime);

    return attackResults;
  }

  getSelectableObjects() {
    const objects = [];

    this.npcs.forEach((npc) => {
      if (npc.mesh) objects.push(npc.mesh);
    });

    return objects;
  }

  getAliveMonsters() {
    return this.monsters.filter((m) => !m.isDead);
  }

  getNPC(npcId) {
    return this.npcs.find((npc) => npc.id === npcId);
  }

  isInBounds(x, z) {
    return x >= this.bounds.minX && x <= this.bounds.maxX && z >= this.bounds.minZ && z <= this.bounds.maxZ;
  }

  clampToBounds(position) {
    return {
      x: Math.max(this.bounds.minX + 1, Math.min(this.bounds.maxX - 1, position.x)),
      z: Math.max(this.bounds.minZ + 1, Math.min(this.bounds.maxZ - 1, position.z)),
    };
  }
}
