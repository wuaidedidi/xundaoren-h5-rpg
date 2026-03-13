/**
 * 寻道人 - 渲染器模块
 * 封装Three.js场景、相机、渲染器
 */

class Renderer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    this.quality = "medium";

    this.ambientLight = null;
    this.directionalLight = null;
    this.hemisphereLight = null;

    this.originalAmbientIntensity = 0.6;
    this.originalDirectionalIntensity = 0.8;
    this.originalHemisphereIntensity = 0.4;
    this.originalFogColor = 0x1a1a2e;
    this.originalBackgroundColor = 0x1a1a2e;

    this.currentWeather = "clear";
    this.lightningFlash = false;

    this.envMap = null;
    this.rainEnvMap = null;
  }

  /**
   * 初始化渲染器
   */
  init(canvas, quality = "medium") {
    this.quality = quality;

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 150);

    // 创建相机
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: quality !== "low",
      powerPreference: quality === "high" ? "high-performance" : "default",
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.getPixelRatio());
    this.renderer.shadowMap.enabled = quality !== "low";
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 创建射线检测器
    this.raycaster = new THREE.Raycaster();

    this.setupLights();
    this.createEnvMap();

    window.addEventListener("resize", this.handleResize.bind(this));

    console.log("渲染器初始化完成");
  }

  /**
   * 根据质量设置获取像素比
   */
  getPixelRatio() {
    switch (this.quality) {
      case "low":
        return 1;
      case "high":
        return Math.min(window.devicePixelRatio, 2);
      default:
        return Math.min(window.devicePixelRatio, 1.5);
    }
  }

  /**
   * 设置光照
   */
  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x404060, this.originalAmbientIntensity);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.originalDirectionalIntensity);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = this.quality !== "low";

    if (this.directionalLight.castShadow) {
      this.directionalLight.shadow.mapSize.width = this.quality === "high" ? 2048 : 1024;
      this.directionalLight.shadow.mapSize.height = this.quality === "high" ? 2048 : 1024;
      this.directionalLight.shadow.camera.near = 10;
      this.directionalLight.shadow.camera.far = 200;
      this.directionalLight.shadow.camera.left = -50;
      this.directionalLight.shadow.camera.right = 50;
      this.directionalLight.shadow.camera.top = 50;
      this.directionalLight.shadow.camera.bottom = -50;
    }

    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x8888ff, 0x444422, this.originalHemisphereIntensity);
    this.scene.add(this.hemisphereLight);
  }

  createEnvMap() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "#2a2a4a");
    gradient.addColorStop(0.4, "#1a1a3a");
    gradient.addColorStop(0.6, "#1a1a2a");
    gradient.addColorStop(1, "#0a0a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(200, 200, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size * 0.5, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.envMap = texture;

    const rainCanvas = document.createElement("canvas");
    rainCanvas.width = size;
    rainCanvas.height = size;
    const rainCtx = rainCanvas.getContext("2d");

    const rainGradient = rainCtx.createLinearGradient(0, 0, 0, size);
    rainGradient.addColorStop(0, "#1a1a2a");
    rainGradient.addColorStop(0.3, "#0a0a1a");
    rainGradient.addColorStop(0.5, "#050510");
    rainGradient.addColorStop(1, "#020208");
    rainCtx.fillStyle = rainGradient;
    rainCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 30; i++) {
      rainCtx.strokeStyle = `rgba(150, 170, 200, ${Math.random() * 0.4 + 0.1})`;
      rainCtx.lineWidth = 1;
      rainCtx.beginPath();
      const x = Math.random() * size;
      rainCtx.moveTo(x, 0);
      rainCtx.lineTo(x + 2, size);
      rainCtx.stroke();
    }

    const rainTexture = new THREE.CanvasTexture(rainCanvas);
    rainTexture.mapping = THREE.EquirectangularReflectionMapping;
    this.rainEnvMap = rainTexture;

    this.scene.environment = this.envMap;
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * 渲染一帧
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 添加对象到场景
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * 从场景移除对象
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * 射线检测
   */
  raycast(mousePosition, objects) {
    this.raycaster.setFromCamera(mousePosition, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  /**
   * 更新相机位置（跟随目标）
   */
  updateCamera(targetPosition, offset = { x: 0, y: 15, z: 20 }) {
    const targetX = targetPosition.x + offset.x;
    const targetY = targetPosition.y + offset.y;
    const targetZ = targetPosition.z + offset.z;

    // 平滑跟随
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;

    this.camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
  }

  /**
   * 世界坐标转屏幕坐标
   */
  worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  /**
   * 设置画质
   */
  setQuality(quality) {
    this.quality = quality;
    this.renderer.setPixelRatio(this.getPixelRatio());

    this.renderer.shadowMap.enabled = quality !== "low";
  }

  setWeather(weather) {
    this.currentWeather = weather;

    if (weather === "rain") {
      this.scene.background = new THREE.Color(0x0a0a15);
      this.scene.fog = new THREE.Fog(0x0a0a15, 20, 80);

      if (this.rainEnvMap) {
        this.scene.environment = this.rainEnvMap;
      }

      if (this.ambientLight) {
        this.ambientLight.intensity = 0.25;
      }
      if (this.directionalLight) {
        this.directionalLight.intensity = 0.3;
      }
      if (this.hemisphereLight) {
        this.hemisphereLight.intensity = 0.15;
      }
    } else {
      this.scene.background = new THREE.Color(this.originalBackgroundColor);
      this.scene.fog = new THREE.Fog(this.originalFogColor, 50, 150);

      if (this.envMap) {
        this.scene.environment = this.envMap;
      }

      if (this.ambientLight) {
        this.ambientLight.intensity = this.originalAmbientIntensity;
      }
      if (this.directionalLight) {
        this.directionalLight.intensity = this.originalDirectionalIntensity;
      }
      if (this.hemisphereLight) {
        this.hemisphereLight.intensity = this.originalHemisphereIntensity;
      }
    }
  }

  getEnvMap() {
    return this.currentWeather === "rain" ? this.rainEnvMap : this.envMap;
  }

  triggerLightning() {
    if (this.lightningFlash) return;

    this.lightningFlash = true;

    if (this.directionalLight) {
      this.directionalLight.intensity = 3;
      this.scene.background = new THREE.Color(0x4a4a6a);

      setTimeout(() => {
        if (this.currentWeather === "rain") {
          this.directionalLight.intensity = 0.3;
          this.scene.background = new THREE.Color(0x0a0a15);
        } else {
          this.directionalLight.intensity = this.originalDirectionalIntensity;
          this.scene.background = new THREE.Color(this.originalBackgroundColor);
        }
        this.lightningFlash = false;
      }, 100);

      setTimeout(() => {
        if (this.currentWeather === "rain" && this.directionalLight) {
          this.directionalLight.intensity = 2;
          this.scene.background = new THREE.Color(0x3a3a5a);

          setTimeout(() => {
            if (this.currentWeather === "rain") {
              this.directionalLight.intensity = 0.3;
              this.scene.background = new THREE.Color(0x0a0a15);
            }
          }, 50);
        }
      }, 150);
    }
  }

  dispose() {
    this.renderer.dispose();
    window.removeEventListener("resize", this.handleResize);
  }
}

export default new Renderer();
