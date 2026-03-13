/**
 * 寻道人 - NPC实体类
 * 圆柱体作为NPC模型（颜色区分）
 */

import { getNPC } from "../data/npcs.js";

export default class NPC {
  constructor(npcId) {
    const config = getNPC(npcId);
    if (!config) {
      throw new Error(`Unknown NPC: ${npcId}`);
    }

    // 复制配置
    this.id = npcId;
    this.name = config.name;
    this.title = config.title;
    this.color = config.color;
    this.size = config.size || 1.0;
    this.position = { ...config.position };
    this.glow = config.glow || false;
    this.type = config.type;
    this.dialogs = config.dialogs;
    this.shopItems = config.shopItems || [];
    this.hidden = config.hidden || false;

    // 3D对象
    this.mesh = null;
    this.glowMesh = null;
    this.hatMesh = null;
    this.weaponMesh = null;
    this.furnaceMesh = null;
    this.auraParticles = null;

    // 动画状态
    this.breathTime = 0;
    this.breathSpeed = 2;
    this.breathAmount = 0.03;
    this.originalScale = 1;

    // 特效状态
    this.particleTimer = 0;

    // 交互状态
    this.isInteracting = false;
    this.currentDialog = "default";
  }

  /**
   * 创建3D模型
   */
  createMesh() {
    // 创建圆柱体
    const geometry = new THREE.CylinderGeometry(0.4 * this.size, 0.4 * this.size, 1.6 * this.size, 16);
    const material = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.3),
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y + 0.8 * this.size, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { type: "npc", entity: this };
    this.originalScale = this.size;

    // 创建NPC特有装饰
    this.createNPCFeatures();

    return this.mesh;
  }

  /**
   * 创建NPC特有装饰
   */
  createNPCFeatures() {
    switch (this.id) {
      case "villageChief":
        this.createChiefFeatures();
        break;
      case "blacksmith":
        this.createBlacksmithFeatures();
        break;
      case "trainer":
        this.createTrainerFeatures();
        break;
      case "guard":
        this.createGuardFeatures();
        break;
    }
  }

  /**
   * 村长特有装饰 - 帽子和脚底光环
   */
  createChiefFeatures() {
    // 创建帽子（圆锥形）
    const hatGeometry = new THREE.ConeGeometry(0.5 * this.size, 0.4 * this.size, 16);
    const hatMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b4513,
      emissive: 0x3d1f08,
    });
    this.hatMesh = new THREE.Mesh(hatGeometry, hatMaterial);
    this.hatMesh.position.set(this.position.x, this.position.y + 1.6 * this.size, this.position.z);

    // 帽子檐
    const brimGeometry = new THREE.CylinderGeometry(0.6 * this.size, 0.6 * this.size, 0.05 * this.size, 16);
    const brimMaterial = new THREE.MeshLambertMaterial({
      color: 0x654321,
      emissive: 0x2a1a0a,
    });
    this.hatBrimMesh = new THREE.Mesh(brimGeometry, brimMaterial);
    this.hatBrimMesh.position.set(this.position.x, this.position.y + 1.4 * this.size, this.position.z);

    // 金色脚底光环
    const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    this.glowMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    this.glowMesh.position.set(this.position.x, 0.02, this.position.z);
    this.glowMesh.rotation.x = -Math.PI / 2;
  }

  /**
   * 铁匠特有装饰 - 炉子
   */
  createBlacksmithFeatures() {
    // 炉子位置（在铁匠旁边）
    const furnaceX = this.position.x + 2;
    const furnaceZ = this.position.z + 0.5;
    const furnaceY = this.position.y;

    // 炉体底座 - 石质方形底座
    const baseGeometry = new THREE.BoxGeometry(1.6, 0.4, 1.6);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    this.furnaceBaseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    this.furnaceBaseMesh.position.set(furnaceX, furnaceY + 0.2, furnaceZ);
    this.furnaceBaseMesh.castShadow = true;

    // 炉身 - 圆角圆柱形炉体
    const furnaceGeometry = new THREE.CylinderGeometry(0.7, 0.8, 1.0, 16);
    const furnaceMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333,
      emissive: 0x110000,
    });
    this.furnaceMesh = new THREE.Mesh(furnaceGeometry, furnaceMaterial);
    this.furnaceMesh.position.set(furnaceX, furnaceY + 0.9, furnaceZ);
    this.furnaceMesh.castShadow = true;

    // 炉口外圈 - 金属环
    const rimGeometry = new THREE.TorusGeometry(0.5, 0.08, 8, 16);
    const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    this.furnaceRimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    this.furnaceRimMesh.position.set(furnaceX, furnaceY + 1.35, furnaceZ);
    this.furnaceRimMesh.rotation.x = -Math.PI / 2;

    // 炉口发光 - 熔岩效果
    const furnaceOpeningGeometry = new THREE.CircleGeometry(0.45, 24);
    const furnaceOpeningMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      emissive: 0xff1100,
      side: THREE.DoubleSide,
    });
    this.furnaceOpeningMesh = new THREE.Mesh(furnaceOpeningGeometry, furnaceOpeningMaterial);
    this.furnaceOpeningMesh.position.set(furnaceX, furnaceY + 1.34, furnaceZ);
    this.furnaceOpeningMesh.rotation.x = -Math.PI / 2;

    // 烟囱
    const chimneyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 12);
    const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    this.chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    this.chimneyMesh.position.set(furnaceX + 0.4, furnaceY + 2.0, furnaceZ + 0.4);
    this.chimneyMesh.castShadow = true;

    // 风箱（在炉子侧面）
    const bellowsGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
    const bellowsMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    this.bellowsMesh = new THREE.Mesh(bellowsGeometry, bellowsMaterial);
    this.bellowsMesh.position.set(furnaceX - 1.0, furnaceY + 0.4, furnaceZ);
    this.bellowsMesh.castShadow = true;

    // 铁砧
    const anvilBaseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8);
    const anvilBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.anvilBaseMesh = new THREE.Mesh(anvilBaseGeometry, anvilBaseMaterial);
    this.anvilBaseMesh.position.set(furnaceX + 1.2, furnaceY + 0.3, furnaceZ + 0.8);
    this.anvilBaseMesh.castShadow = true;

    const anvilTopGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.4);
    const anvilTopMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    this.anvilTopMesh = new THREE.Mesh(anvilTopGeometry, anvilTopMaterial);
    this.anvilTopMesh.position.set(furnaceX + 1.2, furnaceY + 0.75, furnaceZ + 0.8);
    this.anvilTopMesh.castShadow = true;
  }

  /**
   * 青衣特有装饰 - 灵气光环
   */
  createTrainerFeatures() {
    // 创建灵气粒子系统
    this.createAuraParticles();

    // 蓝色光环
    const ringGeometry = new THREE.RingGeometry(0.4, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    this.glowMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    this.glowMesh.position.set(this.position.x, 0.02, this.position.z);
    this.glowMesh.rotation.x = -Math.PI / 2;
  }

  /**
   * 创建灵气环绕粒子
   */
  createAuraParticles() {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.auraParticles = new THREE.Points(geometry, material);
    this.auraParticles.position.set(this.position.x, 0, this.position.z);
  }

  /**
   * 守卫特有装饰 - 发光武器
   */
  createGuardFeatures() {
    // 创建发光长矛
    const spearShaftGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
    const spearShaftMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    this.spearShaftMesh = new THREE.Mesh(spearShaftGeometry, spearShaftMaterial);

    // 矛头发光 - 使用高亮颜色
    const spearHeadGeometry = new THREE.ConeGeometry(0.12, 0.5, 8);
    const spearHeadMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ff88,
    });
    this.spearHeadMesh = new THREE.Mesh(spearHeadGeometry, spearHeadMaterial);

    // 发光效果 - 添加一个稍大的发光体
    const glowGeometry = new THREE.ConeGeometry(0.15, 0.55, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
    });
    this.spearHeadGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.spearHeadGlowMesh.position.y = 1.4;

    // 武器组
    this.weaponGroup = new THREE.Group();
    this.spearShaftMesh.position.y = 0;
    this.spearHeadMesh.position.y = 1.4;
    this.weaponGroup.add(this.spearShaftMesh);
    this.weaponGroup.add(this.spearHeadMesh);
    this.weaponGroup.add(this.spearHeadGlowMesh);

    // 设置武器位置和角度
    this.weaponGroup.position.set(this.position.x + 0.5, this.position.y + 1.0, this.position.z + 0.3);
    this.weaponGroup.rotation.z = -0.3;
    this.weaponGroup.rotation.x = 0.2;
  }

  /**
   * 更新（动画等）
   */
  update(deltaTime) {
    // 呼吸动画
    this.updateBreathAnimation(deltaTime);

    // 光环旋转动画
    if (this.glowMesh) {
      this.glowMesh.rotation.z += deltaTime * 0.5;
    }

    // 村长帽子跟随
    if (this.hatMesh && this.mesh) {
      this.hatMesh.position.y = this.mesh.position.y + 0.8 * this.size;
      this.hatBrimMesh.position.y = this.mesh.position.y + 0.6 * this.size;
      this.hatMesh.rotation.y = this.mesh.rotation.y;
      this.hatBrimMesh.rotation.y = this.mesh.rotation.y;
    }

    // 守卫武器跟随
    if (this.weaponGroup && this.mesh) {
      const offsetX = Math.sin(this.mesh.rotation.y) * 0.5;
      const offsetZ = Math.cos(this.mesh.rotation.y) * 0.3;
      this.weaponGroup.position.x = this.mesh.position.x + offsetX;
      this.weaponGroup.position.z = this.mesh.position.z + offsetZ;
      this.weaponGroup.position.y = this.mesh.position.y + 0.2;
      this.weaponGroup.rotation.y = this.mesh.rotation.y - 0.3;
    }

    // 青衣灵气粒子动画
    if (this.auraParticles) {
      this.updateAuraParticles(deltaTime);
    }

    // 铁匠炉子火星特效
    if (this.id === "blacksmith") {
      this.updateFurnaceSparks(deltaTime);
    }
  }

  /**
   * 呼吸动画
   */
  updateBreathAnimation(deltaTime) {
    if (!this.mesh) return;

    this.breathTime += deltaTime * this.breathSpeed;
    const breathScale = 1 + Math.sin(this.breathTime) * this.breathAmount;

    // 只在Y轴轻微缩放，模拟呼吸
    this.mesh.scale.y = breathScale;
    this.mesh.scale.x = this.originalScale * (1 + Math.sin(this.breathTime) * this.breathAmount * 0.3);
    this.mesh.scale.z = this.originalScale * (1 + Math.sin(this.breathTime) * this.breathAmount * 0.3);

    // 轻微上下浮动
    this.mesh.position.y = this.position.y + 0.8 * this.size + Math.sin(this.breathTime) * 0.02;
  }

  /**
   * 灵气粒子动画
   */
  updateAuraParticles(deltaTime) {
    if (!this.auraParticles) return;

    const positions = this.auraParticles.geometry.attributes.position.array;
    const particleCount = positions.length / 3;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // 粒子上升
      positions[i3 + 1] += deltaTime * 0.5;

      // 螺旋运动
      const angle = deltaTime + i * 0.3;
      const radius = 0.6 + Math.sin(Date.now() * 0.001 + i) * 0.2;
      positions[i3] = Math.cos(angle + i * 0.5) * radius;
      positions[i3 + 2] = Math.sin(angle + i * 0.5) * radius;

      // 循环
      if (positions[i3 + 1] > 2.5) {
        positions[i3 + 1] = 0;
      }
    }

    this.auraParticles.geometry.attributes.position.needsUpdate = true;
    this.auraParticles.rotation.y += deltaTime * 0.3;
  }

  /**
   * 炉子火星特效
   */
  updateFurnaceSparks(deltaTime) {
    this.particleTimer += deltaTime;

    // 每0.1秒产生火星
    if (this.particleTimer > 0.1 && this.scene) {
      this.particleTimer = 0;
      this.createSpark();
    }
  }

  /**
   * 创建单个火星
   */
  createSpark() {
    const sparkGeometry = new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 4, 4);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      transparent: true,
      opacity: 1,
    });
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);

    // 炉子位置
    const furnaceX = this.position.x + 2;
    const furnaceZ = this.position.z + 0.5;
    const furnaceY = this.position.y;

    // 从炉口位置开始
    spark.position.set(furnaceX + (Math.random() - 0.5) * 0.5, furnaceY + 1.3, furnaceZ + (Math.random() - 0.5) * 0.5);

    // 随机速度（向上喷射）
    spark.userData = {
      velocity: {
        x: (Math.random() - 0.5) * 1.0,
        y: 1.5 + Math.random() * 2.0,
        z: (Math.random() - 0.5) * 1.0,
      },
      life: 0.6 + Math.random() * 0.4,
    };

    this.scene.add(spark);

    // 动画
    const animateSpark = () => {
      if (!spark.parent) return;

      spark.userData.life -= 0.016;
      spark.userData.velocity.y -= 0.08; // 重力
      spark.userData.velocity.x *= 0.98; // 空气阻力
      spark.userData.velocity.z *= 0.98;

      spark.position.x += spark.userData.velocity.x * 0.016;
      spark.position.y += spark.userData.velocity.y * 0.016;
      spark.position.z += spark.userData.velocity.z * 0.016;

      spark.material.opacity = Math.max(0, spark.userData.life);

      if (spark.userData.life <= 0 || spark.position.y < 0) {
        this.scene.remove(spark);
        spark.geometry.dispose();
        spark.material.dispose();
      } else {
        requestAnimationFrame(animateSpark);
      }
    };

    animateSpark();
  }

  /**
   * 设置场景引用（用于特效）
   */
  setScene(scene) {
    this.scene = scene;
  }

  /**
   * 获取所有需要添加到场景的网格
   */
  getAllMeshes() {
    const meshes = [this.mesh];

    if (this.hatMesh) {
      meshes.push(this.hatMesh);
      meshes.push(this.hatBrimMesh);
    }
    if (this.glowMesh) {
      meshes.push(this.glowMesh);
    }
    if (this.furnaceMesh) {
      meshes.push(this.furnaceBaseMesh);
      meshes.push(this.furnaceMesh);
      meshes.push(this.furnaceRimMesh);
      meshes.push(this.furnaceOpeningMesh);
      meshes.push(this.chimneyMesh);
      meshes.push(this.bellowsMesh);
      meshes.push(this.anvilBaseMesh);
      meshes.push(this.anvilTopMesh);
    }
    if (this.weaponGroup) {
      meshes.push(this.weaponGroup);
    }
    if (this.auraParticles) {
      meshes.push(this.auraParticles);
    }

    return meshes;
  }

  /**
   * 获取当前对话
   */
  getDialog(dialogId = null, player = null) {
    const id = dialogId || this.currentDialog;
    let dialog = this.dialogs[id];

    if (!dialog) {
      dialog = this.dialogs.default;
    }

    // 过滤选项（根据条件）
    if (dialog.options && player) {
      dialog = {
        ...dialog,
        options: dialog.options.filter((option) => {
          if (!option.condition) return true;

          const cond = option.condition;

          if (cond.minLevel && player.level < cond.minLevel) return false;
          if (cond.noClass && player.classId) return false;
          if (cond.hasClass && !player.classId) return false;

          return true;
        }),
      };
    }

    return dialog;
  }

  /**
   * 设置当前对话
   */
  setDialog(dialogId) {
    this.currentDialog = dialogId;
  }

  /**
   * 获取与玩家的距离
   */
  getDistanceTo(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 检查是否可交互
   */
  canInteract(playerPosition, maxDistance = 3) {
    return this.getDistanceTo(playerPosition) <= maxDistance;
  }

  /**
   * 面向玩家
   */
  lookAtPlayer(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    const angle = Math.atan2(dx, dz);

    if (this.mesh) {
      this.mesh.rotation.y = angle;
    }
  }
}
