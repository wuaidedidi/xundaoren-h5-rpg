/**
 * 寻道人 - 效果管理器
 * 处理技能特效、战斗动画、粒子系统
 * 注意：THREE作为全局变量由three.min.js提供
 */

export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.animations = [];
        this.targetIndicator = null;
        this.currentTarget = null;
        
        // 创建目标选中圆圈（红色）
        this.createTargetIndicator();
    }
    
    /**
     * 创建目标选中指示器（红色圆圈）
     */
    createTargetIndicator() {
        try {
            const ringGeom = new THREE.RingGeometry(0.8, 1.0, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            this.targetIndicator = new THREE.Mesh(ringGeom, ringMat);
            this.targetIndicator.rotation.x = -Math.PI / 2;
            this.targetIndicator.visible = false;
            this.scene.add(this.targetIndicator);
        } catch (e) {
            console.warn('创建目标指示器失败:', e);
        }
    }
    
    /**
     * 设置目标选中圈
     */
    setTarget(target) {
        this.currentTarget = target;
        if (this.targetIndicator) {
            if (target && target.mesh) {
                this.targetIndicator.visible = true;
                this.targetIndicator.position.set(
                    target.mesh.position.x,
                    0.05,
                    target.mesh.position.z
                );
            } else {
                this.targetIndicator.visible = false;
            }
        }
    }
    
    /**
     * 清除目标选中圈
     */
    clearTarget() {
        this.currentTarget = null;
        if (this.targetIndicator) {
            this.targetIndicator.visible = false;
        }
    }

    /**
     * 播放技能效果
     */
    playSkillEffect(skillId, source, target) {
        const sourcePos = source.mesh ? source.mesh.position : source.position;
        const targetPos = target?.mesh ? target.mesh.position : target?.position;

        switch (skillId) {
            case 'punch':
                this.createPunchEffect(sourcePos, targetPos);
                break;
            case 'breathe':
                this.createHealAura(sourcePos);
                break;
            case 'dodge':
                this.createAfterImage(sourcePos);
                break;
            case 'charge':
                this.createChargeGlow(sourcePos);
                break;
            // 锻体系
            case 'ironFist':
                if (targetPos) this.createImpactWave(targetPos);
                break;
            case 'vajraBody':
                this.createVajraShield(sourcePos);
                break;
            case 'earthquake':
                this.createEarthquakeEffect(sourcePos);
                break;
            // 练气系
            case 'qiBlast':
                if (targetPos) this.createMagicBolt(sourcePos, targetPos, 0x44aaff);
                break;
            case 'thunderStrike':
                if (targetPos) this.createThunderEffect(targetPos);
                break;
            case 'spiritShield':
                this.createSpiritShieldEffect(sourcePos);
                break;
            // 通灵系
            case 'paralyze':
                if (targetPos) this.createParalyzeEffect(targetPos);
                break;
            case 'rejuvenate':
                if (targetPos) this.createRejuvenateEffect(targetPos);
                break;
            case 'soulFear':
                this.createSoulFearEffect(sourcePos);
                break;
            default:
                if (targetPos) this.createGenericHit(targetPos);
        }
    }

    /**
     * 挥拳效果 - 黄色冲击粒子
     */
    createPunchEffect(sourcePos, targetPos) {
        if (!targetPos) return;
        
        const particles = this.createParticleSystem({
            count: 15,
            position: targetPos.clone(),
            color: 0xffcc00,
            size: 0.3,
            spread: 1,
            lifetime: 400,
            velocity: { x: 0, y: 2, z: 0 }
        });
        
        // 冲击波圆环
        const ringGeom = new THREE.RingGeometry(0.1, 0.5, 16);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0xffcc00, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(targetPos);
        ring.position.y = 0.5;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        this.animations.push({
            object: ring,
            type: 'expand',
            duration: 300,
            elapsed: 0,
            startScale: 1,
            endScale: 3
        });
    }

    /**
     * 吐纳术效果 - 绿色治疗光环
     */
    createHealAura(position) {
        const particles = this.createParticleSystem({
            count: 20,
            position: position.clone(),
            color: 0x00ff88,
            size: 0.2,
            spread: 1.5,
            lifetime: 1000,
            velocity: { x: 0, y: 1, z: 0 },
            gravity: -0.5
        });
        
        // 上升光柱
        const pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 16, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff88, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.copy(position);
        pillar.position.y = 1.5;
        this.scene.add(pillar);
        
        this.animations.push({
            object: pillar,
            type: 'fadeOut',
            duration: 1000,
            elapsed: 0
        });
    }

    /**
     * 闪避效果 - 残影
     */
    createAfterImage(position) {
        const ghostGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 8);
        const ghostMat = new THREE.MeshBasicMaterial({ 
            color: 0x4488ff, 
            transparent: true, 
            opacity: 0.5
        });
        const ghost = new THREE.Mesh(ghostGeom, ghostMat);
        ghost.position.copy(position);
        this.scene.add(ghost);
        
        this.animations.push({
            object: ghost,
            type: 'fadeOut',
            duration: 500,
            elapsed: 0
        });
    }

    /**
     * 蓄力效果 - 能量光芒
     */
    createChargeGlow(position) {
        const particles = this.createParticleSystem({
            count: 30,
            position: position.clone(),
            color: 0xffff00,
            size: 0.15,
            spread: 2,
            lifetime: 800,
            velocity: { x: 0, y: 0, z: 0 },
            converge: true
        });
    }

    /**
     * 法术弹道
     */
    createMagicBolt(sourcePos, targetPos, color = 0x8844ff) {
        const boltGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const boltMat = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color
        });
        const bolt = new THREE.Mesh(boltGeom, boltMat);
        bolt.position.copy(sourcePos);
        bolt.position.y = 1;
        this.scene.add(bolt);
        
        this.animations.push({
            object: bolt,
            type: 'moveTo',
            duration: 300,
            elapsed: 0,
            startPos: sourcePos.clone(),
            endPos: targetPos.clone(),
            onComplete: () => {
                this.createMagicExplosion(targetPos);
            }
        });
    }

    /**
     * 法术爆炸
     */
    createMagicExplosion(position) {
        this.createParticleSystem({
            count: 25,
            position: position.clone(),
            color: 0x8844ff,
            size: 0.25,
            spread: 2,
            lifetime: 500,
            velocity: { x: 0, y: 1, z: 0 }
        });
    }

    /**
     * 冲击波效果
     */
    createImpactWave(position) {
        const ringGeom = new THREE.RingGeometry(0.2, 0.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0xff6600, 
            transparent: true, 
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        this.animations.push({
            object: ring,
            type: 'expand',
            duration: 400,
            elapsed: 0,
            startScale: 1,
            endScale: 4
        });
    }

    /**
     * 金刚不坏 - 金色护盾球
     */
    createVajraShield(position) {
        const shieldGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: true
        });
        const shield = new THREE.Mesh(shieldGeom, shieldMat);
        shield.position.copy(position);
        this.scene.add(shield);

        this.animations.push({
            object: shield,
            type: 'fadeOut',
            duration: 1500,
            elapsed: 0
        });

        this.createParticleSystem({
            count: 20,
            position: position.clone(),
            color: 0xffdd44,
            size: 0.15,
            spread: 1.5,
            lifetime: 800,
            velocity: { x: 0, y: 1.5, z: 0 }
        });
    }

    /**
     * 震地 - 地面裂纹扩散
     */
    createEarthquakeEffect(position) {
        // 多层扩散波
        for (let i = 0; i < 3; i++) {
            const ringGeom = new THREE.RingGeometry(0.3, 0.6, 24);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xcc6600,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(position);
            ring.position.y = 0.05;
            ring.rotation.x = -Math.PI / 2;
            ring.scale.set(0.01, 0.01, 1);
            this.scene.add(ring);

            this.animations.push({
                object: ring,
                type: 'expand',
                duration: 600,
                elapsed: -i * 150,
                startScale: 0.5,
                endScale: 5
            });
        }

        this.createParticleSystem({
            count: 30,
            position: position.clone(),
            color: 0x996633,
            size: 0.3,
            spread: 3,
            lifetime: 600,
            velocity: { x: 0, y: 2, z: 0 },
            gravity: 3
        });
    }

    /**
     * 雷引 - 闪电柱
     */
    createThunderEffect(position) {
        // 闪电光柱
        const pillarGeom = new THREE.CylinderGeometry(0.3, 0.8, 6, 8, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({
            color: 0xaaccff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.copy(position);
        pillar.position.y = 3;
        this.scene.add(pillar);

        this.animations.push({
            object: pillar,
            type: 'fadeOut',
            duration: 400,
            elapsed: 0
        });

        // 地面爆炸
        const ringGeom = new THREE.RingGeometry(0.2, 1.0, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x6688ff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        this.animations.push({
            object: ring,
            type: 'expand',
            duration: 350,
            elapsed: 0,
            startScale: 1,
            endScale: 4
        });

        this.createParticleSystem({
            count: 20,
            position: position.clone(),
            color: 0x88bbff,
            size: 0.2,
            spread: 1.5,
            lifetime: 400,
            velocity: { x: 0, y: 3, z: 0 }
        });
    }

    /**
     * 灵盾 - 蓝色护盾
     */
    createSpiritShieldEffect(position) {
        const shieldGeom = new THREE.SphereGeometry(1.0, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(shieldGeom, shieldMat);
        shield.position.copy(position);
        this.scene.add(shield);

        this.animations.push({
            object: shield,
            type: 'fadeOut',
            duration: 1200,
            elapsed: 0
        });

        this.createParticleSystem({
            count: 15,
            position: position.clone(),
            color: 0x4488ff,
            size: 0.12,
            spread: 1.2,
            lifetime: 800,
            velocity: { x: 0, y: 0.5, z: 0 },
            converge: true
        });
    }

    /**
     * 定身咒 - 紫色锁链环
     */
    createParalyzeEffect(position) {
        for (let i = 0; i < 3; i++) {
            const ringGeom = new THREE.TorusGeometry(0.8, 0.08, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xaa44ff,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(position);
            ring.position.y = 0.5 + i * 0.6;
            this.scene.add(ring);

            this.animations.push({
                object: ring,
                type: 'fadeOut',
                duration: 1500,
                elapsed: 0
            });
        }

        this.createParticleSystem({
            count: 15,
            position: position.clone(),
            color: 0xcc66ff,
            size: 0.15,
            spread: 1,
            lifetime: 800,
            velocity: { x: 0, y: 0.3, z: 0 }
        });
    }

    /**
     * 回春术 - 绿色治疗粒子上升
     */
    createRejuvenateEffect(position) {
        this.createParticleSystem({
            count: 25,
            position: position.clone(),
            color: 0x44ff88,
            size: 0.18,
            spread: 1,
            lifetime: 1000,
            velocity: { x: 0, y: 1.5, z: 0 },
            gravity: -0.3
        });

        const crossGeom = new THREE.RingGeometry(0.3, 0.5, 4);
        const crossMat = new THREE.MeshBasicMaterial({
            color: 0x44ff88,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const cross = new THREE.Mesh(crossGeom, crossMat);
        cross.position.copy(position);
        cross.position.y = 2.5;
        this.scene.add(cross);

        this.animations.push({
            object: cross,
            type: 'fadeOut',
            duration: 1000,
            elapsed: 0
        });
    }

    /**
     * 灵魂震慑 - 紫色冲击波扩散
     */
    createSoulFearEffect(position) {
        const ringGeom = new THREE.RingGeometry(0.3, 0.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(position);
        ring.position.y = 1.0;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        this.animations.push({
            object: ring,
            type: 'expand',
            duration: 600,
            elapsed: 0,
            startScale: 1,
            endScale: 6
        });

        this.createParticleSystem({
            count: 20,
            position: position.clone(),
            color: 0xbb44ff,
            size: 0.2,
            spread: 2,
            lifetime: 700,
            velocity: { x: 0, y: 0.5, z: 0 }
        });
    }

    /**
     * 通用受击效果
     */
    createGenericHit(position) {
        this.createParticleSystem({
            count: 10,
            position: position.clone(),
            color: 0xffffff,
            size: 0.2,
            spread: 0.5,
            lifetime: 300,
            velocity: { x: 0, y: 1.5, z: 0 }
        });
    }

    /**
     * 受击闪烁效果
     */
    playHitEffect(target) {
        if (!target.mesh) return;
        
        const originalColor = target.mesh.material.color.getHex();
        target.mesh.material.color.setHex(0xff0000);
        target.mesh.material.emissive?.setHex(0xff0000);
        
        // 震动效果
        const originalPos = target.mesh.position.clone();
        const shake = () => {
            target.mesh.position.x = originalPos.x + (Math.random() - 0.5) * 0.2;
            target.mesh.position.z = originalPos.z + (Math.random() - 0.5) * 0.2;
        };
        
        const shakeInterval = setInterval(shake, 50);
        
        setTimeout(() => {
            clearInterval(shakeInterval);
            target.mesh.position.copy(originalPos);
            target.mesh.material.color.setHex(originalColor);
            if (target.mesh.material.emissive) {
                target.mesh.material.emissive.setHex(0x000000);
            }
        }, 200);
    }

    /**
     * 玩家攻击动画
     */
    playAttackAnimation(player) {
        if (!player.mesh) return;
        
        const originalPos = player.mesh.position.clone();
        const forwardX = Math.sin(player.rotation) * 0.5;
        const forwardZ = Math.cos(player.rotation) * 0.5;
        
        // 前冲
        player.mesh.position.x += forwardX;
        player.mesh.position.z += forwardZ;
        
        setTimeout(() => {
            player.mesh.position.copy(originalPos);
        }, 150);
    }

    /**
     * 怪物攻击预警
     */
    playMonsterWindup(monster) {
        if (!monster.mesh) return;
        
        // 蓄力缩放
        monster.mesh.scale.set(1.2, 0.8, 1.2);
        
        setTimeout(() => {
            monster.mesh.scale.set(1, 1, 1);
        }, 300);
    }

    /**
     * 创建粒子系统
     */
    createParticleSystem(options) {
        const { count, position, color, size, spread, lifetime, velocity, gravity = 0, converge = false } = options;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = position.x + (Math.random() - 0.5) * spread;
            positions[i3 + 1] = position.y + Math.random() * spread * 0.5;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * spread;
            
            if (converge) {
                velocities.push({
                    x: (position.x - positions[i3]) * 0.01,
                    y: velocity.y + Math.random() * 0.5,
                    z: (position.z - positions[i3 + 2]) * 0.01
                });
            } else {
                velocities.push({
                    x: (Math.random() - 0.5) * 2,
                    y: velocity.y + Math.random(),
                    z: (Math.random() - 0.5) * 2
                });
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.particles.push({
            points,
            velocities,
            lifetime,
            elapsed: 0,
            gravity
        });
        
        return points;
    }

    /**
     * 更新所有效果
     */
    update(deltaTime) {
        try {
            const dt = deltaTime * 1000;
            
            // 更新目标选中圈位置
            if (this.currentTarget && this.currentTarget.mesh && this.targetIndicator) {
                this.targetIndicator.position.set(
                    this.currentTarget.mesh.position.x,
                    0.05,
                    this.currentTarget.mesh.position.z
                );
                // 旋转动画
                this.targetIndicator.rotation.z += deltaTime * 2;
            }
        
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.elapsed += dt;
            
            if (p.elapsed >= p.lifetime) {
                this.scene.remove(p.points);
                p.points.geometry.dispose();
                p.points.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            // 更新粒子位置
            const positions = p.points.geometry.attributes.position.array;
            for (let j = 0; j < p.velocities.length; j++) {
                const j3 = j * 3;
                const vel = p.velocities[j];
                positions[j3] += vel.x * deltaTime;
                positions[j3 + 1] += vel.y * deltaTime;
                positions[j3 + 2] += vel.z * deltaTime;
                vel.y += p.gravity * deltaTime;
            }
            p.points.geometry.attributes.position.needsUpdate = true;
            
            // 淡出
            const progress = p.elapsed / p.lifetime;
            p.points.material.opacity = 1 - progress;
        }
        
        // 更新动画
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.elapsed += dt;
            const progress = Math.min(anim.elapsed / anim.duration, 1);
            
            switch (anim.type) {
                case 'expand':
                    const scale = anim.startScale + (anim.endScale - anim.startScale) * progress;
                    anim.object.scale.set(scale, scale, 1);
                    anim.object.material.opacity = 1 - progress;
                    break;
                    
                case 'fadeOut':
                    anim.object.material.opacity = 1 - progress;
                    break;
                    
                case 'moveTo':
                    anim.object.position.lerpVectors(anim.startPos, anim.endPos, progress);
                    anim.object.position.y = 1 + Math.sin(progress * Math.PI) * 0.5;
                    break;
            }
            
            if (progress >= 1) {
                this.scene.remove(anim.object);
                anim.object.geometry?.dispose();
                anim.object.material?.dispose();
                if (anim.onComplete) anim.onComplete();
                this.animations.splice(i, 1);
            }
        }
        } catch (e) {
            console.warn('效果更新错误:', e);
        }
    }

    /**
     * 清除所有效果
     */
    clear() {
        this.particles.forEach(p => {
            this.scene.remove(p.points);
            p.points.geometry.dispose();
            p.points.material.dispose();
        });
        this.particles = [];
        
        this.animations.forEach(a => {
            this.scene.remove(a.object);
            a.object.geometry?.dispose();
            a.object.material?.dispose();
        });
        this.animations = [];
    }
}
