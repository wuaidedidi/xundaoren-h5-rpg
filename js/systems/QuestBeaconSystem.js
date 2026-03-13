/**
 * 任务光柱系统
 * 在任务目标位置创建从地面到天上的光柱，远处可见
 * 不同任务类型有不同颜色
 */

export default class QuestBeaconSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.renderer.scene;
        
        // 光柱配置
        this.beaconHeight = 30;
        this.beaconRadius = 1.5;
        this.pulseSpeed = 2;
        this.rotationSpeed = 0.5;
        
        // 任务类型颜色配置
        this.questColors = {
            main: {
                primary: 0xffd700,    // 金色 - 主线任务
                secondary: 0xffaa00,
                emissive: 0xff8800
            },
            side: {
                primary: 0x00aaff,    // 蓝色 - 支线任务
                secondary: 0x0088cc,
                emissive: 0x0066aa
            },
            daily: {
                primary: 0x00ff88,    // 绿色 - 日常任务
                secondary: 0x00cc66,
                emissive: 0x00aa44
            },
            event: {
                primary: 0xff44ff,    // 紫色 - 活动任务
                secondary: 0xcc22cc,
                emissive: 0xaa00aa
            },
            boss: {
                primary: 0xff3333,    // 红色 - BOSS任务
                secondary: 0xcc2222,
                emissive: 0xaa1111
            }
        };
        
        // 活跃的光柱
        this.activeBeacon = null;
        
        // 光柱对象池
        this.beaconPool = [];
        this.maxPoolSize = 5;
        
        this.isInitialized = false;
    }
    
    /**
     * 初始化
     */
    init() {
        if (this.isInitialized) return;
        
        this.createBeaconPool();
        
        this.isInitialized = true;
        console.log('任务光柱系统初始化完成');
    }
    
    /**
     * 创建光柱对象池
     */
    createBeaconPool() {
        for (let i = 0; i < this.maxPoolSize; i++) {
            const beacon = this.createBeaconMesh();
            beacon.visible = false;
            beacon.userData.inPool = true;
            beacon.userData.poolIndex = i;
            this.scene.add(beacon);
            this.beaconPool.push(beacon);
        }
    }
    
    /**
     * 创建光柱网格
     */
    createBeaconMesh() {
        const group = new THREE.Group();
        group.userData.type = 'beacon';
        
        // 主光柱 - 圆柱体
        const cylinderGeometry = new THREE.CylinderGeometry(
            0.2,
            this.beaconRadius,
            this.beaconHeight,
            16,
            1,
            true
        );
        
        const cylinderMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.y = this.beaconHeight / 2;
        cylinder.userData.isMainCylinder = true;
        group.add(cylinder);
        
        // 内部核心光柱（更亮更细）
        const coreGeometry = new THREE.CylinderGeometry(
            0.1,
            0.5,
            this.beaconHeight,
            8,
            1,
            true
        );
        
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = this.beaconHeight / 2;
        core.userData.isCore = true;
        group.add(core);
        
        // 底部光环
        const ringGeometry = new THREE.RingGeometry(1, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.userData.isRing = true;
        group.add(ring);
        
        // 顶部光球
        const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.y = this.beaconHeight;
        sphere.userData.isSphere = true;
        group.add(sphere);
        
        // 粒子效果（简单的上升粒子）
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = Math.random() * this.beaconHeight;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            speeds[i] = 2 + Math.random() * 3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData.isParticles = true;
        particles.userData.speeds = speeds;
        group.add(particles);
        
        return group;
    }
    
    /**
     * 从对象池获取光柱
     */
    getBeaconFromPool() {
        for (const beacon of this.beaconPool) {
            if (beacon.userData.inPool && !beacon.visible) {
                beacon.userData.inPool = false;
                return beacon;
            }
        }
        
        // 池已满，创建新的
        const beacon = this.createBeaconMesh();
        beacon.userData.inPool = false;
        this.scene.add(beacon);
        return beacon;
    }
    
    /**
     * 归还光柱到对象池
     */
    returnBeaconToPool(beacon) {
        if (!beacon) return;
        
        beacon.visible = false;
        beacon.userData.inPool = true;
        beacon.userData.questType = null;
        beacon.userData.targetPosition = null;
    }
    
    /**
     * 创建任务光柱
     */
    createBeacon(position, questType = 'main') {
        // 移除旧光柱
        this.removeBeacon();
        
        const beacon = this.getBeaconFromPool();
        const colors = this.questColors[questType] || this.questColors.main;
        
        // 设置位置
        beacon.position.copy(position);
        beacon.visible = true;
        beacon.userData.questType = questType;
        beacon.userData.targetPosition = position.clone();
        beacon.userData.creationTime = Date.now();
        
        // 应用颜色
        beacon.traverse(child => {
            if (child.isMesh || child.isPoints) {
                if (child.userData.isMainCylinder) {
                    child.material.color.setHex(colors.primary);
                } else if (child.userData.isCore) {
                    child.material.color.setHex(colors.secondary);
                } else if (child.userData.isRing) {
                    child.material.color.setHex(colors.primary);
                } else if (child.userData.isSphere) {
                    child.material.color.setHex(colors.secondary);
                } else if (child.userData.isParticles) {
                    child.material.color.setHex(colors.secondary);
                }
            }
        });
        
        this.activeBeacon = beacon;
        
        // 播放出现动画
        this.playAppearAnimation(beacon);
        
        return beacon;
    }
    
    /**
     * 播放出现动画
     */
    playAppearAnimation(beacon) {
        const startScale = 0;
        const endScale = 1;
        const duration = 500;
        const startTime = Date.now();
        
        beacon.scale.set(startScale, startScale, startScale);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 弹性缓出
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const scale = startScale + (endScale - startScale) * easeOut;
            
            beacon.scale.set(scale, scale, scale);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * 移除光柱
     */
    removeBeacon() {
        if (this.activeBeacon) {
            this.returnBeaconToPool(this.activeBeacon);
            this.activeBeacon = null;
        }
    }
    
    /**
     * 更新光柱
     */
    update(deltaTime) {
        if (!this.activeBeacon || !this.activeBeacon.visible) return;
        
        const time = Date.now() / 1000;
        const beacon = this.activeBeacon;
        
        // 旋转动画
        beacon.rotation.y += this.rotationSpeed * deltaTime;
        
        // 脉冲效果
        const pulse = 1 + Math.sin(time * this.pulseSpeed) * 0.1;
        
        beacon.traverse(child => {
            if (child.userData.isRing) {
                // 光环缩放
                child.scale.set(pulse, pulse, 1);
                // 透明度变化
                child.material.opacity = 0.3 + Math.sin(time * this.pulseSpeed * 2) * 0.2;
            } else if (child.userData.isSphere) {
                // 顶部光球脉动
                child.scale.setScalar(0.8 + Math.sin(time * this.pulseSpeed * 1.5) * 0.2);
            } else if (child.userData.isParticles) {
                // 更新粒子位置
                const positions = child.geometry.attributes.position.array;
                const speeds = child.userData.speeds;
                
                for (let i = 0; i < speeds.length; i++) {
                    positions[i * 3 + 1] += speeds[i] * deltaTime;
                    
                    // 重置到底部
                    if (positions[i * 3 + 1] > this.beaconHeight) {
                        positions[i * 3 + 1] = 0;
                        positions[i * 3] = (Math.random() - 0.5) * 2;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
                    }
                }
                
                child.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // 确保光柱始终面向相机（billboard效果）
        this.updateBillboardEffect(beacon);
    }
    
    /**
     * 更新面向相机效果
     */
    updateBillboardEffect(beacon) {
        // 光柱主体不需要完全面向相机，但粒子可以
        // 这里可以添加更多视觉效果
    }
    
    /**
     * 设置任务目标
     */
    setQuestTarget(position, questType = 'main') {
        return this.createBeacon(position, questType);
    }
    
    /**
     * 获取任务类型颜色
     */
    getQuestColor(questType) {
        return this.questColors[questType] || this.questColors.main;
    }
    
    /**
     * 获取当前活跃光柱位置
     */
    getActiveBeaconPosition() {
        return this.activeBeacon ? this.activeBeacon.position : null;
    }
    
    /**
     * 销毁
     */
    dispose() {
        this.removeBeacon();
        
        // 清理对象池
        this.beaconPool.forEach(beacon => {
            beacon.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(beacon);
        });
        
        this.beaconPool = [];
        this.isInitialized = false;
    }
}
