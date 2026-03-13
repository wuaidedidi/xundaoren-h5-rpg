/**
 * 寻道人 - 地面点击管理器
 * 处理点击地面移动、圆环标记、悬停发光效果
 */

export default class GroundClickManager {
  constructor(game) {
    this.game = game;
    this.scene = game.renderer.scene;
    this.camera = game.renderer.camera;
    this.renderer = game.renderer;
    this.input = game.input;
    this.player = game.player;
    this.world = game.world;

    // 移动目标点
    this.moveTarget = null;
    this.isMovingToTarget = false;

    // 圆环标记
    this.ringMarker = null;
    this.ringAnimation = null;

    // 悬停效果
    this.hoveredObject = null;
    this.originalMaterials = new Map();
    this.outlineMeshes = new Map();

    // 地面射线检测用的不可见地面（确保能检测到地面）
    this.groundPlane = null;

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    this.createGroundPlane();
    this.createRingMarker();
    this.bindEvents();
  }

  /**
   * 创建不可见的地面平面用于射线检测
   */
  createGroundPlane() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshBasicMaterial({
      visible: false,
    });
    this.groundPlane = new THREE.Mesh(geometry, material);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0.01;
    this.groundPlane.userData = { type: "ground" };
    this.scene.add(this.groundPlane);
  }

  /**
   * 创建圆环标记
   */
  createRingMarker() {
    const geometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.ringMarker = new THREE.Mesh(geometry, material);
    this.ringMarker.rotation.x = -Math.PI / 2;
    this.ringMarker.visible = false;
    this.scene.add(this.ringMarker);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 鼠标移动 - 检测悬停
    this.input.on("mousemove", (mouse) => {
      this.handleMouseMove(mouse);
    });

    // 鼠标点击 - 地面移动
    this.input.on("click", (mouse, event) => {
      this.handleGroundClick(mouse, event);
    });
  }

  /**
   * 处理鼠标移动 - 悬停检测
   */
  handleMouseMove(mouse) {
    // 获取所有可悬停的对象（怪物和NPC）
    const hoverableObjects = this.world.getSelectableObjects();

    // 射线检测
    const intersects = this.renderer.raycast({ x: mouse.x, y: mouse.y }, hoverableObjects);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const entity = hit.userData.entity;

      if (entity && hit !== this.hoveredObject) {
        // 移除之前的发光效果
        this.removeHoverEffect();

        // 添加新的发光效果
        this.addHoverEffect(hit, entity);
        this.hoveredObject = hit;

        // 改变鼠标样式
        document.body.style.cursor = "pointer";
      }
    } else {
      if (this.hoveredObject) {
        this.removeHoverEffect();
        this.hoveredObject = null;
        document.body.style.cursor = "default";
      }
    }
  }

  /**
   * 添加悬停发光效果
   */
  addHoverEffect(mesh, entity) {
    const type = mesh.userData.type;

    if (type === "monster" || type === "npc") {
      // 方法1: 使用emissive增强自发光
      if (mesh.material) {
        if (!this.originalMaterials.has(mesh.uuid)) {
          this.originalMaterials.set(mesh.uuid, mesh.material.emissive.clone());
        }
        mesh.material.emissive = new THREE.Color(0x444444);
      }

      // 方法2: 创建半透明外壳描边
      this.createOutlineShell(mesh, type);
    }
  }

  /**
   * 创建半透明外壳描边
   */
  createOutlineShell(mesh, type) {
    // 如果已经存在外壳，先移除
    if (this.outlineMeshes.has(mesh.uuid)) {
      const oldOutline = this.outlineMeshes.get(mesh.uuid);
      mesh.parent.remove(oldOutline);
    }

    // 创建略大的半透明外壳
    let outlineGeometry;
    const scale = 1.15;

    // 根据原网格的几何体类型创建对应的外壳
    if (mesh.geometry.type === "BoxGeometry") {
      const params = mesh.geometry.parameters;
      outlineGeometry = new THREE.BoxGeometry(params.width * scale, params.height * scale, params.depth * scale);
    } else if (mesh.geometry.type === "CylinderGeometry") {
      const params = mesh.geometry.parameters;
      outlineGeometry = new THREE.CylinderGeometry(
        params.radiusTop * scale,
        params.radiusBottom * scale,
        params.height * scale,
        params.radialSegments
      );
    } else {
      // 默认使用略大的缩放
      outlineGeometry = mesh.geometry.clone();
    }

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: type === "monster" ? 0xff4444 : 0x44ff44,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.copy(mesh.position);
    outlineMesh.rotation.copy(mesh.rotation);
    outlineMesh.scale.copy(mesh.scale);

    // 如果是默认缩放方式，手动放大
    if (mesh.geometry.type !== "BoxGeometry" && mesh.geometry.type !== "CylinderGeometry") {
      outlineMesh.scale.multiplyScalar(scale);
    }

    mesh.parent.add(outlineMesh);
    this.outlineMeshes.set(mesh.uuid, outlineMesh);
  }

  /**
   * 移除悬停发光效果
   */
  removeHoverEffect() {
    // 恢复原始emissive
    this.originalMaterials.forEach((originalEmissive, uuid) => {
      const object = this.scene.getObjectByProperty("uuid", uuid);
      if (object && object.material) {
        object.material.emissive = originalEmissive;
      }
    });
    this.originalMaterials.clear();

    // 移除外壳描边
    this.outlineMeshes.forEach((outlineMesh, uuid) => {
      outlineMesh.parent.remove(outlineMesh);
      outlineMesh.geometry.dispose();
      outlineMesh.material.dispose();
    });
    this.outlineMeshes.clear();
  }

  /**
   * 处理地面点击
   */
  handleGroundClick(mouse, event) {
    // 如果点击的是UI，不处理
    if (event.target !== this.game.renderer.renderer.domElement) return;

    // 射线检测地面
    const intersects = this.renderer.raycast({ x: mouse.x, y: mouse.y }, [this.groundPlane, this.world.ground]);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;

      // 检查是否点击到了怪物或NPC（优先处理）
      const entityIntersects = this.renderer.raycast({ x: mouse.x, y: mouse.y }, this.world.getSelectableObjects());

      // 如果点击到了实体，不执行地面移动
      if (entityIntersects.length > 0) {
        return;
      }

      // 设置移动目标
      this.moveTarget = {
        x: point.x,
        z: point.z,
      };
      this.isMovingToTarget = true;

      // 显示圆环标记
      this.showRingMarker(point);
    }
  }

  /**
   * 显示圆环标记
   */
  showRingMarker(position) {
    // 重置圆环
    this.ringMarker.position.set(position.x, 0.05, position.z);
    this.ringMarker.scale.set(1, 1, 1);
    this.ringMarker.material.opacity = 0.8;
    this.ringMarker.visible = true;

    // 停止之前的动画
    if (this.ringAnimation) {
      cancelAnimationFrame(this.ringAnimation);
    }

    // 开始收缩动画
    const startTime = performance.now();
    const duration = 800; // 动画持续时间

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 收缩效果
      const scale = 1 - progress * 0.5;
      this.ringMarker.scale.set(scale, scale, scale);

      // 淡出效果
      this.ringMarker.material.opacity = 0.8 * (1 - progress);

      if (progress < 1) {
        this.ringAnimation = requestAnimationFrame(animate);
      } else {
        this.ringMarker.visible = false;
        this.ringAnimation = null;
      }
    };

    this.ringAnimation = requestAnimationFrame(animate);
  }

  /**
   * 更新（每帧调用）
   */
  update(deltaTime) {
    // 更新悬停外壳位置（跟随移动中的目标）
    this.updateOutlinePositions();
  }

  /**
   * 更新外壳位置，使其跟随原网格
   */
  updateOutlinePositions() {
    this.outlineMeshes.forEach((outlineMesh, uuid) => {
      const originalMesh = this.scene.getObjectByProperty("uuid", uuid);
      if (originalMesh && outlineMesh) {
        outlineMesh.position.copy(originalMesh.position);
        outlineMesh.rotation.copy(originalMesh.rotation);
      }
    });
  }

  /**
   * 获取当前移动方向
   * 返回方向向量，供Player.update使用
   */
  getMovementDirection() {
    if (!this.isMovingToTarget || !this.moveTarget) {
      return null;
    }

    const playerPos = this.player.position;
    const target = this.moveTarget;

    // 计算距离
    const dx = target.x - playerPos.x;
    const dz = target.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // 到达目标
    if (distance < 0.3) {
      this.isMovingToTarget = false;
      this.moveTarget = null;
      return { x: 0, z: 0 };
    }

    // 返回归一化方向
    return {
      x: dx / distance,
      z: dz / distance,
    };
  }

  /**
   * 销毁
   */
  dispose() {
    // 停止动画
    if (this.ringAnimation) {
      cancelAnimationFrame(this.ringAnimation);
    }

    // 移除效果
    this.removeHoverEffect();

    // 清理资源
    if (this.ringMarker) {
      this.ringMarker.geometry.dispose();
      this.ringMarker.material.dispose();
      this.scene.remove(this.ringMarker);
    }

    if (this.groundPlane) {
      this.groundPlane.geometry.dispose();
      this.groundPlane.material.dispose();
      this.scene.remove(this.groundPlane);
    }
  }
}
