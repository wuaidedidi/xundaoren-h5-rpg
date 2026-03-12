/**
 * 寻道人 - 玩家实体类
 * 圆柱体作为角色模型
 */

import { getRealmByLevel, getExpRequired, getRealmBonus } from '../data/realms.js';
import { getClass, getSpecialization } from '../data/classes.js';
import { getBaseSkills, getClassSkills } from '../data/skills.js';
import { getItem, calculateEquipmentStats, getEquipmentSlot } from '../data/items.js';

export default class Player {
    constructor(name = '玩家') {
        // 基础信息
        this.name = name;
        this.level = 0;
        this.exp = 0;
        this.gold = 100;
        
        // 职业信息
        this.classId = null;
        this.specializationId = null;
        
        // 基础属性
        this.baseHp = 100;
        this.baseMp = 50;
        this.baseAttack = 10;
        this.baseDefense = 5;
        this.baseSpeed = 5;
        
        // 装备（需要在hp/mp计算前初始化）
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // 增益效果
        this.buffs = [];
        
        // 当前属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        // 位置和移动
        this.position = { x: 0, y: 0, z: 5 };
        this.rotation = 0;
        this.isMoving = false;
        this.velocity = { x: 0, z: 0 };
        
        // 战斗状态
        this.target = null;
        this.inCombat = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 普攻冷却1秒
        
        // 技能冷却
        this.skillCooldowns = {};
        
        // 背包
        this.inventory = [];
        this.maxInventory = 24;
        
        // 已学技能
        this.learnedSkills = ['punch', 'breathe', 'dodge', 'charge'];
        
        // 任务进度
        this.quests = [];
        this.completedQuests = [];
        
        // 3D对象
        this.mesh = null;
        this.nameTag = null;
        
        // 标记
        this.tutorialComplete = false;
        this.foundMysteriousElder = false;
    }

    /**
     * 计算当前境界
     */
    get realm() {
        return getRealmByLevel(this.level);
    }

    /**
     * 计算最大生命值
     */
    get maxHp() {
        let base = this.baseHp;
        
        // 职业加成
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.hp;
        }
        
        // 专精加成
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.hp) {
                base *= spec.bonusStats.hp;
            }
        }
        
        // 境界加成
        base *= getRealmBonus(this.level);
        
        // 装备加成
        base += this.getEquipmentStatBonus('hpBonus');
        
        return Math.floor(base);
    }

    /**
     * 计算最大法力值
     */
    get maxMp() {
        let base = this.baseMp;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.mp;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.mp) {
                base *= spec.bonusStats.mp;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        // 装备加成
        base += this.getEquipmentStatBonus('mpBonus');
        
        return Math.floor(base);
    }

    /**
     * 计算攻击力
     */
    get attack() {
        let base = this.baseAttack;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.attack;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.attack) {
                base *= spec.bonusStats.attack;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        // 装备加成
        base += this.getEquipmentStatBonus('attack');
        
        // 蓄力buff
        const chargeBuff = this.buffs.find(b => b.id === 'charge');
        if (chargeBuff) {
            base *= (1 + chargeBuff.damageBonus);
        }
        
        return Math.floor(base);
    }

    /**
     * 计算防御力
     */
    get defense() {
        let base = this.baseDefense;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.defense;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.defense) {
                base *= spec.bonusStats.defense;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        // 装备加成
        base += this.getEquipmentStatBonus('defense');
        
        return Math.floor(base);
    }

    /**
     * 计算移动速度
     */
    get speed() {
        let base = this.baseSpeed;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.speed;
        }
        
        return base;
    }

    /**
     * 计算暴击率
     */
    get critRate() {
        return this.getEquipmentStatBonus('critRate');
    }

    /**
     * 计算伤害减免率
     */
    get defenseRate() {
        return this.getEquipmentStatBonus('defenseRate');
    }

    /**
     * 获取装备属性加成总和
     */
    getEquipmentStatBonus(statName) {
        let bonus = 0;
        
        for (const slot of ['weapon', 'armor', 'accessory']) {
            const equipped = this.equipment[slot];
            if (equipped && equipped.itemId) {
                const item = getItem(equipped.itemId);
                if (item) {
                    const stats = calculateEquipmentStats(item);
                    if (stats[statName]) {
                        bonus += stats[statName];
                    }
                }
            }
        }
        
        return bonus;
    }

    /**
     * 获取已装备的物品
     */
    getEquippedItem(slot) {
        const equipped = this.equipment[slot];
        if (!equipped || !equipped.itemId) return null;
        return getItem(equipped.itemId);
    }

    /**
     * 穿戴装备
     * @param {string} itemId - 物品ID
     * @param {number} inventoryIndex - 背包索引
     * @returns {object} - 操作结果 { success, message, replacedItem }
     */
    equipItem(itemId, inventoryIndex) {
        const item = getItem(itemId);
        if (!item) {
            return { success: false, message: '物品不存在' };
        }
        
        // 检查是否是装备
        if (!item.slot) {
            return { success: false, message: '该物品无法装备' };
        }
        
        const slot = item.slot;
        const slotInfo = getEquipmentSlot(slot);
        
        // 检查是否有已装备的物品
        const previousEquipped = this.equipment[slot];
        let replacedItem = null;
        
        // 从背包中移除
        this.removeItemFromInventory(inventoryIndex);
        
        // 如果有已装备的物品，先卸下
        if (previousEquipped && previousEquipped.itemId) {
            const prevItem = getItem(previousEquipped.itemId);
            if (prevItem) {
                // 尝试将旧装备放回背包
                const added = this.addItem(prevItem, 1);
                if (!added) {
                    // 背包满了，无法卸下
                    return { 
                        success: false, 
                        message: '背包已满，无法卸下当前装备' 
                    };
                }
                replacedItem = prevItem;
            }
        }
        
        // 装备新物品
        this.equipment[slot] = {
            itemId: itemId,
            equippedAt: Date.now()
        };
        
        // 调整当前血量（防止超过最大值）
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
        
        const message = replacedItem 
            ? `已装备 ${item.name}，卸下 ${replacedItem.name}`
            : `已装备 ${item.name}`;
        
        return { 
            success: true, 
            message,
            replacedItem,
            equippedItem: item
        };
    }

    /**
     * 卸下装备
     * @param {string} slot - 装备槽位
     * @returns {object} - 操作结果 { success, message, item }
     */
    unequipItem(slot) {
        const equipped = this.equipment[slot];
        if (!equipped || !equipped.itemId) {
            return { success: false, message: '该位置没有装备' };
        }
        
        const item = getItem(equipped.itemId);
        if (!item) {
            return { success: false, message: '装备数据异常' };
        }
        
        // 尝试放入背包
        const added = this.addItem(item, 1);
        if (!added) {
            return { success: false, message: '背包已满，无法卸下' };
        }
        
        // 清空装备槽
        this.equipment[slot] = null;
        
        // 调整当前血量
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
        
        return { 
            success: true, 
            message: `已卸下 ${item.name}`,
            item
        };
    }

    /**
     * 从背包中移除物品（用于装备时）
     */
    removeItemFromInventory(index) {
        if (index >= 0 && index < this.inventory.length) {
            this.inventory[index].count--;
            if (this.inventory[index].count <= 0) {
                this.inventory.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    /**
     * 获取职业名称
     */
    get className() {
        if (!this.classId) return null;
        const cls = getClass(this.classId);
        return cls ? cls.name : null;
    }

    /**
     * 获取专精名称
     */
    get specializationName() {
        if (!this.classId || !this.specializationId) return null;
        const spec = getSpecialization(this.classId, this.specializationId);
        return spec ? spec.name : null;
    }

    /**
     * 创建3D模型
     */
    createMesh() {
        // 创建圆柱体（角色）
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x00aaff,
            emissive: 0x002244
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { type: 'player', entity: this };
        
        return this.mesh;
    }

    /**
     * 更新位置
     */
    update(deltaTime, direction) {
        // 移动处理
        if (direction.x !== 0 || direction.z !== 0) {
            const moveSpeed = this.speed * deltaTime * 5;
            
            this.position.x += direction.x * moveSpeed;
            this.position.z += direction.z * moveSpeed;
            
            // 旋转朝向移动方向
            this.rotation = Math.atan2(direction.x, direction.z);
            
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // 更新3D对象
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y = this.rotation;
        }
        
        // 更新buff持续时间
        this.updateBuffs(deltaTime);
        
        // 更新技能冷却
        this.updateCooldowns(deltaTime);
        
        // 生命/法力回复（脱战时）
        if (!this.inCombat) {
            this.regenTick(deltaTime);
        }
    }

    /**
     * 更新buff
     */
    updateBuffs(deltaTime) {
        this.buffs = this.buffs.filter(buff => {
            buff.remaining -= deltaTime * 1000;
            return buff.remaining > 0;
        });
    }

    /**
     * 更新冷却
     */
    updateCooldowns(deltaTime) {
        for (const skillId in this.skillCooldowns) {
            this.skillCooldowns[skillId] -= deltaTime * 1000;
            if (this.skillCooldowns[skillId] <= 0) {
                delete this.skillCooldowns[skillId];
            }
        }
    }

    /**
     * 脱战回复
     */
    regenTick(deltaTime) {
        // 每秒回复1%
        const regenRate = 0.01 * deltaTime;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regenRate);
        this.mp = Math.min(this.maxMp, this.mp + this.maxMp * regenRate);
        
        // 装备生命回复
        const hpRegen = this.getEquipmentStatBonus('hpRegen');
        if (hpRegen > 0) {
            this.hp = Math.min(this.maxHp, this.hp + hpRegen * deltaTime);
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        // 检查金刚不坏buff
        const vajraBuff = this.buffs.find(b => b.id === 'vajraBody');
        if (vajraBuff) {
            amount *= (1 - vajraBuff.damageReduction);
        }
        
        // 检查灵盾buff
        const shieldBuff = this.buffs.find(b => b.id === 'spiritShield');
        if (shieldBuff) {
            this.buffs = this.buffs.filter(b => b.id !== 'spiritShield');
            return 0; // 完全吸收
        }
        
        // 应用伤害减免
        const damageReduction = this.defenseRate;
        amount *= (1 - damageReduction);
        
        const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
        this.hp = Math.max(0, this.hp - finalDamage);
        this.inCombat = true;
        
        return finalDamage;
    }

    /**
     * 治疗
     */
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHp - this.hp);
        this.hp += actualHeal;
        return actualHeal;
    }

    /**
     * 消耗法力
     */
    useMp(amount) {
        if (this.mp < amount) return false;
        this.mp -= amount;
        return true;
    }

    /**
     * 获得经验
     */
    gainExp(amount) {
        // 设置蓄力buff使用后清除
        const chargeBuff = this.buffs.find(b => b.id === 'charge' && b.consumed);
        if (chargeBuff) {
            this.buffs = this.buffs.filter(b => b !== chargeBuff);
        }
        
        this.exp += amount;
        
        const results = [];
        
        // 检查升级
        while (this.level < 81) {
            const required = getExpRequired(this.level);
            if (this.exp >= required) {
                this.exp -= required;
                this.level++;
                results.push({ type: 'levelUp', level: this.level });
                
                // 升级回满血蓝
                this.hp = this.maxHp;
                this.mp = this.maxMp;
                
                // 检查境界突破
                const newRealm = getRealmByLevel(this.level);
                const oldRealm = getRealmByLevel(this.level - 1);
                if (newRealm.name !== oldRealm.name) {
                    results.push({ type: 'realmUp', realm: newRealm.name });
                }
            } else {
                break;
            }
        }
        
        return results;
    }

    /**
     * 获得金币
     */
    gainGold(amount) {
        this.gold += amount;
    }

    /**
     * 花费金币
     */
    spendGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        return true;
    }

    /**
     * 选择职业
     */
    selectClass(classId) {
        if (this.level < 10) return false;
        if (this.classId) return false;
        
        this.classId = classId;
        
        // 学习职业技能
        const classSkills = getClassSkills(classId);
        classSkills.forEach(skill => {
            if (!this.learnedSkills.includes(skill.id)) {
                this.learnedSkills.push(skill.id);
            }
        });
        
        // 更新属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    /**
     * 选择专精
     */
    selectSpecialization(specId) {
        if (this.level < 30) return false;
        if (!this.classId) return false;
        if (this.specializationId) return false;
        
        const spec = getSpecialization(this.classId, specId);
        if (!spec) return false;
        
        this.specializationId = specId;
        
        // 更新属性
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    /**
     * 添加物品到背包
     */
    addItem(item, count = 1) {
        // 检查是否可堆叠
        if (item.stackable) {
            const existing = this.inventory.find(inv => inv.itemId === item.id);
            if (existing) {
                existing.count = Math.min(item.maxStack, existing.count + count);
                return true;
            }
        }
        
        // 检查背包空间
        if (this.inventory.length >= this.maxInventory) {
            return false;
        }
        
        this.inventory.push({ itemId: item.id, count });
        return true;
    }

    /**
     * 移除物品
     */
    removeItem(itemId, count = 1) {
        const index = this.inventory.findIndex(inv => inv.itemId === itemId);
        if (index === -1) return false;
        
        this.inventory[index].count -= count;
        if (this.inventory[index].count <= 0) {
            this.inventory.splice(index, 1);
        }
        
        return true;
    }

    /**
     * 检查是否有物品
     */
    hasItem(itemId, count = 1) {
        const item = this.inventory.find(inv => inv.itemId === itemId);
        return item && item.count >= count;
    }

    /**
     * 边界检查
     */
    clampPosition(minX, maxX, minZ, maxZ) {
        this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
        this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));
        
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
        }
    }

    /**
     * 转换为存档数据
     */
    toSaveData() {
        return {
            name: this.name,
            level: this.level,
            exp: this.exp,
            gold: this.gold,
            classId: this.classId,
            specializationId: this.specializationId,
            hp: this.hp,
            mp: this.mp,
            position: { ...this.position },
            inventory: [...this.inventory],
            equipment: { 
                weapon: this.equipment.weapon ? { ...this.equipment.weapon } : null,
                armor: this.equipment.armor ? { ...this.equipment.armor } : null,
                accessory: this.equipment.accessory ? { ...this.equipment.accessory } : null
            },
            learnedSkills: [...this.learnedSkills],
            quests: [...this.quests],
            completedQuests: [...this.completedQuests],
            tutorialComplete: this.tutorialComplete,
            foundMysteriousElder: this.foundMysteriousElder
        };
    }

    /**
     * 从存档数据恢复
     */
    loadFromSaveData(data) {
        // 处理老存档兼容性：确保equipment字段存在
        if (!data.equipment) {
            data.equipment = {
                weapon: null,
                armor: null,
                accessory: null
            };
        } else {
            // 确保所有槽位都存在
            if (!data.equipment.weapon) data.equipment.weapon = null;
            if (!data.equipment.armor) data.equipment.armor = null;
            if (!data.equipment.accessory) data.equipment.accessory = null;
        }
        
        Object.assign(this, data);
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
    }
}
