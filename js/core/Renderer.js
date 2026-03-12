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
        this.quality = 'medium';
    }

    /**
     * 初始化渲染器
     */
    init(canvas, quality = 'medium') {
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
            antialias: quality !== 'low',
            powerPreference: quality === 'high' ? 'high-performance' : 'default'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.getPixelRatio());
        this.renderer.shadowMap.enabled = quality !== 'low';
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 创建射线检测器
        this.raycaster = new THREE.Raycaster();

        // 添加光照
        this.setupLights();

        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));

        console.log('渲染器初始化完成');
    }

    /**
     * 根据质量设置获取像素比
     */
    getPixelRatio() {
        switch (this.quality) {
            case 'low': return 1;
            case 'high': return Math.min(window.devicePixelRatio, 2);
            default: return Math.min(window.devicePixelRatio, 1.5);
        }
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambientLight);

        // 主方向光（太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = this.quality !== 'low';
        
        if (directionalLight.castShadow) {
            directionalLight.shadow.mapSize.width = this.quality === 'high' ? 2048 : 1024;
            directionalLight.shadow.mapSize.height = this.quality === 'high' ? 2048 : 1024;
            directionalLight.shadow.camera.near = 10;
            directionalLight.shadow.camera.far = 200;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
        }
        
        this.scene.add(directionalLight);

        // 半球光（天空/地面）
        const hemisphereLight = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.4);
        this.scene.add(hemisphereLight);
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
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }

    /**
     * 设置画质
     */
    setQuality(quality) {
        this.quality = quality;
        this.renderer.setPixelRatio(this.getPixelRatio());
        
        // 更新阴影设置
        this.renderer.shadowMap.enabled = quality !== 'low';
    }

    /**
     * 销毁渲染器
     */
    dispose() {
        this.renderer.dispose();
        window.removeEventListener('resize', this.handleResize);
    }
}

export default new Renderer();
