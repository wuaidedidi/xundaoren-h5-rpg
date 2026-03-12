/**
 * 寻道人 - 怪物实体类
 * 立方体作为怪物模型
 */

import { getMonster } from '../data/monsters.js';

export default class Monster {
    constructor(monsterId, position = { x: 0, y: 0, z: 0 }) {
        const config = getMonster(monsterId);
        if (!config) {
            throw new Error(`Unknown monster: ${monsterId}`);
        }
        
        // 复制配置
        this.id = monsterId;
        this.name = config.name;
        this.level = config.level;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.attack = config.attack;
        this.defense = config.defense;
        this.speed = config.speed;
        this.exp = config.exp;
        this.gold = config.gold;
        this.color = config.color;
        this.size = config.size;
        this.aggroRange = config.aggroRange;
        this.attackRange = config.attackRange;
        this.drops = config.drops;
        
        // 位置
        this.position = { ...position };
        this.spawnPosition = { ...position };
        this.rotation = 0;
        
        // AI状态
        this.state = 'idle'; // idle, patrol, chase, attack, return
        this.target = null;
        this.patrolTarget = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 1500;
        
        // 巡逻相关
        this.patrolRadius = 5;
        this.patrolTimer = 0;
        this.patrolInterval = 3000 + Math.random() * 2000;
        
        // 3D对象
        this.mesh = null;
        
        // 状态
        this.isDead = false;
        this.respawnTime = 10000; // 10秒后重生
        this.deadTimer = 0;
        
        // 唯一标识
        this.uuid = Math.random().toString(36).substr(2, 9);
    }

    /**
     * 创建3D模型（立方体）
     */
    createMesh() {
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color,
            emissive: new THREE.Color(this.color).multiplyScalar(0.2)
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y + this.size / 2, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { type: 'monster', entity: this };
        
        return this.mesh;
    }

    /**
     * 更新AI
     */
    update(deltaTime, player) {
        if (this.isDead) {
            this.deadTimer += deltaTime * 1000;
            if (this.deadTimer >= this.respawnTime) {
                this.respawn();
            }
            return;
        }
        
        const distanceToPlayer = this.getDistanceTo(player.position);
        const distanceToSpawn = this.getDistanceTo(this.spawnPosition);
        
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime, distanceToPlayer);
                break;
            case 'patrol':
                this.updatePatrol(deltaTime, distanceToPlayer);
                break;
            case 'chase':
                this.updateChase(deltaTime, player, distanceToPlayer, distanceToSpawn);
                break;
            case 'attack':
                this.updateAttack(deltaTime, player, distanceToPlayer);
                break;
            case 'return':
                this.updateReturn(deltaTime);
                break;
        }
        
        // 更新3D对象位置
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y = this.rotation;
        }
    }

    /**
     * 空闲状态
     */
    updateIdle(deltaTime, distanceToPlayer) {
        this.patrolTimer += deltaTime * 1000;
        
        // 检测玩家
        if (distanceToPlayer <= this.aggroRange) {
            this.state = 'chase';
            return;
        }
        
        // 开始巡逻
        if (this.patrolTimer >= this.patrolInterval) {
            this.patrolTimer = 0;
            this.setRandomPatrolTarget();
            this.state = 'patrol';
        }
    }

    /**
     * 巡逻状态
     */
    updatePatrol(deltaTime, distanceToPlayer) {
        // 检测玩家
        if (distanceToPlayer <= this.aggroRange) {
            this.state = 'chase';
            return;
        }
        
        if (!this.patrolTarget) {
            this.state = 'idle';
            return;
        }
        
        const distanceToTarget = this.getDistanceTo(this.patrolTarget);
        
        if (distanceToTarget < 0.5) {
            this.patrolTarget = null;
            this.state = 'idle';
            return;
        }
        
        this.moveTowards(this.patrolTarget, deltaTime, this.speed * 0.5);
    }

    /**
     * 追击状态
     */
    updateChase(deltaTime, player, distanceToPlayer, distanceToSpawn) {
        // 超出追击范围，返回
        if (distanceToSpawn > this.aggroRange * 3) {
            this.state = 'return';
            return;
        }
        
        // 到达攻击范围
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'attack';
            this.target = player;
            return;
        }
        
        // 丢失目标
        if (distanceToPlayer > this.aggroRange * 2) {
            this.state = 'return';
            return;
        }
        
        this.moveTowards(player.position, deltaTime, this.speed);
    }

    /**
     * 攻击状态
     */
    updateAttack(deltaTime, player, distanceToPlayer) {
        // 目标超出攻击范围
        if (distanceToPlayer > this.attackRange * 1.5) {
            this.state = 'chase';
            return;
        }
        
        // 面向目标
        this.lookAt(player.position);
        
        // 攻击冷却
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackCooldown) {
            this.lastAttackTime = now;
            return { type: 'attack', target: player, damage: this.attack };
        }
        
        return null;
    }

    /**
     * 返回状态
     */
    updateReturn(deltaTime) {
        const distance = this.getDistanceTo(this.spawnPosition);
        
        if (distance < 0.5) {
            this.state = 'idle';
            this.hp = this.maxHp; // 回满血
            return;
        }
        
        this.moveTowards(this.spawnPosition, deltaTime, this.speed);
    }

    /**
     * 移动向目标
     */
    moveTowards(target, deltaTime, speed) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 0) {
            const moveAmount = speed * deltaTime * 2;
            this.position.x += (dx / distance) * moveAmount;
            this.position.z += (dz / distance) * moveAmount;
            this.rotation = Math.atan2(dx, dz);
        }
    }

    /**
     * 面向目标
     */
    lookAt(target) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        this.rotation = Math.atan2(dx, dz);
    }

    /**
     * 设置随机巡逻目标
     */
    setRandomPatrolTarget() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        
        this.patrolTarget = {
            x: this.spawnPosition.x + Math.cos(angle) * distance,
            z: this.spawnPosition.z + Math.sin(angle) * distance
        };
    }

    /**
     * 计算到目标的距离
     */
    getDistanceTo(target) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // 进入战斗状态
        if (this.state === 'idle' || this.state === 'patrol') {
            this.state = 'chase';
        }
        
        if (this.hp <= 0) {
            this.die();
        }
        
        return finalDamage;
    }

    /**
     * 死亡
     */
    die() {
        this.isDead = true;
        this.deadTimer = 0;
        this.state = 'idle';
        this.target = null;
        
        if (this.mesh) {
            this.mesh.visible = false;
        }
    }

    /**
     * 重生
     */
    respawn() {
        this.isDead = false;
        this.hp = this.maxHp;
        this.position = { ...this.spawnPosition };
        this.state = 'idle';
        
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.position.set(this.position.x, this.position.y + this.size / 2, this.position.z);
        }
    }

    /**
     * 获取掉落物品
     */
    getDrops() {
        const drops = [];
        
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const count = Math.floor(Math.random() * (drop.countMax - drop.countMin + 1)) + drop.countMin;
                drops.push({ itemId: drop.itemId, count });
            }
        }
        
        return drops;
    }
}
