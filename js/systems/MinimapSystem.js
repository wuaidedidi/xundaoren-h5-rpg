/**
 * 小地图系统
 * 使用俯视相机渲染到 RenderTarget，在 UI 角落显示
 */

export default class MinimapSystem {
  constructor(game) {
    this.game = game;
    this.renderer = game.renderer;
    this.scene = game.renderer.scene;
    this.player = game.player;
    this.world = game.world;

    // 小地图配置
    this.mapSize = 200; // 渲染目标大小
    this.viewRange = 40; // 可视范围（世界单位）

    // 小地图相机
    this.minimapCamera = null;
    this.minimapRenderTarget = null;

    // 标记材质缓存
    this.markerMaterials = {};

    // 小地图场景（用于标记）
    this.minimapScene = null;

    // 标记对象
    this.markers = {
      player: null,
      npcs: [],
      monsters: [],
      questTarget: null,
    };

    // UI 元素
    this.minimapContainer = null;
    this.minimapCanvas = null;

    this.isInitialized = false;
  }

  /**
   * 初始化小地图系统
   */
  init() {
    if (this.isInitialized) return;

    this.createRenderTarget();
    this.createMinimapCamera();
    this.createMinimapScene();
    this.createUI();
    this.createMarkerMaterials();

    this.isInitialized = true;
    console.log("小地图系统初始化完成");
  }

  /**
   * 创建渲染目标
   */
  createRenderTarget() {
    this.minimapRenderTarget = new THREE.WebGLRenderTarget(this.mapSize, this.mapSize, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
  }

  /**
   * 创建俯视相机
   */
  createMinimapCamera() {
    // 使用正交相机获得真正的俯视视角
    const viewSize = this.viewRange;
    this.minimapCamera = new THREE.OrthographicCamera(-viewSize / 2, viewSize / 2, viewSize / 2, -viewSize / 2, 1, 200);

    this.minimapCamera.position.set(0, 50, 0);
    this.minimapCamera.lookAt(0, 0, 0);
    this.minimapCamera.up.set(0, 0, -1);
  }

  /**
   * 创建小地图场景（用于标记）
   */
  createMinimapScene() {
    this.minimapScene = new THREE.Scene();

    // 添加一个半透明的地面作为背景参考
    const groundGeometry = new THREE.PlaneGeometry(this.viewRange, this.viewRange);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.3,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.1;
    this.minimapScene.add(ground);

    // 添加范围圈
    const ringGeometry = new THREE.RingGeometry(this.viewRange / 2 - 0.5, this.viewRange / 2, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    this.minimapScene.add(ring);
  }

  /**
   * 创建标记材质
   */
  createMarkerMaterials() {
    // 玩家标记 - 亮青色
    this.markerMaterials.player = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });

    // NPC 标记 - 绿色
    this.markerMaterials.npc = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });

    // 怪物标记 - 红色
    this.markerMaterials.monster = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
    });

    // 任务目标标记 - 金色
    this.markerMaterials.quest = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
    });
  }

  /**
   * 创建 UI
   */
  createUI() {
    // 创建小地图容器
    this.minimapContainer = document.createElement("div");
    this.minimapContainer.className = "minimap-container";
    this.minimapContainer.innerHTML = `
            <canvas id="minimap-canvas" width="${this.mapSize}" height="${this.mapSize}"></canvas>
            <div class="minimap-overlay">
                <div class="minimap-direction">N</div>
            </div>
            <div class="minimap-legend">
                <div class="legend-item"><span class="legend-dot player"></span>玩家</div>
                <div class="legend-item"><span class="legend-dot npc"></span>NPC</div>
                <div class="legend-item"><span class="legend-dot monster"></span>敌人</div>
                <div class="legend-item"><span class="legend-dot quest"></span>目标</div>
            </div>
        `;

    // 添加到游戏 UI
    const gameUI = document.getElementById("game-ui");
    if (gameUI) {
      gameUI.appendChild(this.minimapContainer);
    }

    this.minimapCanvas = document.getElementById("minimap-canvas");
  }

  /**
   * 更新小地图
   */
  update(deltaTime) {
    if (!this.isInitialized) return;

    // 更新相机位置跟随玩家
    if (this.player && this.player.mesh) {
      this.minimapCamera.position.x = this.player.mesh.position.x;
      this.minimapCamera.position.z = this.player.mesh.position.z;
      this.minimapCamera.lookAt(this.player.mesh.position.x, 0, this.player.mesh.position.z);
    }

    // 更新标记
    this.updateMarkers();

    // 渲染小地图
    this.renderMinimap();
  }

  /**
   * 更新标记
   */
  updateMarkers() {
    // 清除旧标记
    this.clearMarkers();

    if (!this.player || !this.player.mesh) return;

    const playerPos = this.player.mesh.position;

    // 添加玩家标记（三角形表示方向）
    const playerMarker = this.createDirectionalMarker(playerPos, this.player.mesh.rotation.y, 0x00ffff, 1.2);
    this.minimapScene.add(playerMarker);
    this.markers.player = playerMarker;

    // 添加 NPC 标记
    if (this.world && this.world.npcs) {
      this.world.npcs.forEach((npc) => {
        if (npc.mesh && npc.mesh.visible !== false) {
          const distance = playerPos.distanceTo(npc.mesh.position);
          if (distance <= this.viewRange / 2) {
            const marker = this.createCircleMarker(npc.mesh.position, 0x00ff00, 0.6);
            this.minimapScene.add(marker);
            this.markers.npcs.push(marker);
          }
        }
      });
    }

    // 添加怪物标记
    if (this.world && this.world.monsters) {
      this.world.monsters.forEach((monster) => {
        if (monster.mesh && !monster.isDead) {
          const distance = playerPos.distanceTo(monster.mesh.position);
          if (distance <= this.viewRange / 2) {
            const marker = this.createSquareMarker(monster.mesh.position, 0xff4444, 0.5);
            this.minimapScene.add(marker);
            this.markers.monsters.push(marker);
          }
        }
      });
    }

    // 添加任务目标标记
    const questTarget = this.getQuestTargetPosition();
    if (questTarget) {
      const distance = playerPos.distanceTo(questTarget);
      if (distance <= this.viewRange / 2) {
        const marker = this.createStarMarker(questTarget, 0xffd700, 0.8);
        this.minimapScene.add(marker);
        this.markers.questTarget = marker;
      }
    }
  }

  /**
   * 清除所有标记
   */
  clearMarkers() {
    if (this.markers.player) {
      this.minimapScene.remove(this.markers.player);
      this.markers.player.geometry.dispose();
    }

    this.markers.npcs.forEach((marker) => {
      this.minimapScene.remove(marker);
      marker.geometry.dispose();
    });
    this.markers.npcs = [];

    this.markers.monsters.forEach((marker) => {
      this.minimapScene.remove(marker);
      marker.geometry.dispose();
    });
    this.markers.monsters = [];

    if (this.markers.questTarget) {
      this.minimapScene.remove(this.markers.questTarget);
      this.markers.questTarget.geometry.dispose();
    }
  }

  /**
   * 创建方向标记（三角形，表示玩家）
   */
  createDirectionalMarker(position, rotation, color, size) {
    const geometry = new THREE.ConeGeometry(size * 0.5, size, 3);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, 0.5, position.z);
    marker.rotation.y = rotation;
    marker.rotation.x = Math.PI; // 倒置使尖端朝上
    return marker;
  }

  /**
   * 创建圆形标记（NPC）
   */
  createCircleMarker(position, color, size) {
    const geometry = new THREE.CircleGeometry(size * 0.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, 0.3, position.z);
    marker.rotation.x = -Math.PI / 2;
    return marker;
  }

  /**
   * 创建方形标记（怪物）
   */
  createSquareMarker(position, color, size) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, 0.3, position.z);
    marker.rotation.x = -Math.PI / 2;
    return marker;
  }

  /**
   * 创建星形标记（任务目标）
   */
  createStarMarker(position, color, size) {
    // 使用八角星形状
    const geometry = new THREE.CylinderGeometry(0, size * 0.5, size * 0.3, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, 0.4, position.z);

    // 添加一个旋转的外环
    const ringGeometry = new THREE.RingGeometry(size * 0.6, size * 0.7, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    marker.add(ring);

    return marker;
  }

  /**
   * 获取任务目标位置
   */
  getQuestTargetPosition() {
    // 如果有活跃任务，返回任务目标位置
    if (this.game.questBeaconSystem && this.game.questBeaconSystem.activeBeacon) {
      const beacon = this.game.questBeaconSystem.activeBeacon;
      return beacon.position;
    }

    // 默认返回 null，可以在这里添加更多任务逻辑
    return null;
  }

  /**
   * 渲染小地图
   */
  renderMinimap() {
    if (!this.minimapRenderTarget || !this.renderer) return;

    const renderer = this.renderer.renderer;
    const originalRenderTarget = renderer.getRenderTarget();

    // 渲染主场景到 RenderTarget
    renderer.setRenderTarget(this.minimapRenderTarget);
    renderer.clear();

    // 渲染场景（只渲染地面和建筑物，不渲染特效）
    this.scene.traverse((child) => {
      if (child.isMesh || child.isGroup) {
        child.userData._originalVisible = child.visible;
        // 隐藏特效和光柱
        if (child.userData.type === "effect" || child.userData.type === "beacon") {
          child.visible = false;
        }
      }
    });

    renderer.render(this.scene, this.minimapCamera);

    // 恢复可见性
    this.scene.traverse((child) => {
      if (child.isMesh || child.isGroup) {
        child.visible = child.userData._originalVisible;
        delete child.userData._originalVisible;
      }
    });

    // 渲染标记层
    renderer.render(this.minimapScene, this.minimapCamera);

    // 恢复原始渲染目标
    renderer.setRenderTarget(originalRenderTarget);

    // 更新 UI 显示
    this.updateUICanvas();
  }

  /**
   * 更新 UI Canvas
   */
  updateUICanvas() {
    if (!this.minimapCanvas || !this.minimapRenderTarget) return;

    try {
      const ctx = this.minimapCanvas.getContext("2d");
      const width = this.minimapCanvas.width;
      const height = this.minimapCanvas.height;

      // 使用 Three.js 的 readRenderTargetPixels 方法
      const pixels = new Uint8Array(width * height * 4);
      this.renderer.renderer.readRenderTargetPixels(this.minimapRenderTarget, 0, 0, width, height, pixels);

      // 创建 ImageData 并翻转 Y 轴（OpenGL 坐标系与 Canvas 不同）
      const imageData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = ((height - 1 - y) * width + x) * 4;
          const dstIdx = (y * width + x) * 4;
          imageData.data[dstIdx] = pixels[srcIdx];
          imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
          imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
          imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
        }
      }

      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      // 如果读取失败，使用纯色填充
      console.warn("小地图渲染失败:", e);
    }
  }

  /**
   * 设置任务目标
   */
  setQuestTarget(position) {
    // 可以在这里设置自定义任务目标
  }

  /**
   * 销毁
   */
  dispose() {
    if (this.minimapRenderTarget) {
      this.minimapRenderTarget.dispose();
    }

    if (this.minimapContainer && this.minimapContainer.parentNode) {
      this.minimapContainer.parentNode.removeChild(this.minimapContainer);
    }

    // 清理材质
    Object.values(this.markerMaterials).forEach((mat) => mat.dispose());

    this.isInitialized = false;
  }
}
