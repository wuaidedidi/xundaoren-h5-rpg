/**
 * 寻道人 - 玩家实体类
 * 圆柱体作为角色模型
 */

import { getRealmByLevel, getExpRequired, getRealmBonus } from '../data/realms.js';
import { getClass, getSpecialization } from '../data/classes.js';
import { getBaseSkills, getClassSkills } from '../data/skills.js';
import { getItem, isEquipment, getEquipmentSlot, EQUIPMENT_SLOTS } from '../data/items.js';

const DEFAULT_EQUIPMENT = {
    weapon: null,
    armor: null,
    accessory: null
};

export default class Player {
    constructor(name = '玩家') {
        this.name = name;
        this.level = 0;
        this.exp = 0;
        this.gold = 100;
        
        this.classId = null;
        this.specializationId = null;
        
        this.baseHp = 100;
        this.baseMp = 50;
        this.baseAttack = 10;
        this.baseDefense = 5;
        this.baseSpeed = 5;
        
        this.equipment = { ...DEFAULT_EQUIPMENT };
        
        this.buffs = [];
        
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        this.position = { x: 0, y: 0, z: 5 };
        this.rotation = 0;
        this.isMoving = false;
        this.velocity = { x: 0, z: 0 };
        
        this.target = null;
        this.inCombat = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000;
        
        this.skillCooldowns = {};
        
        this.inventory = [];
        this.maxInventory = 24;
        
        this.learnedSkills = ['punch', 'breathe', 'dodge', 'charge'];
        
        this.quests = [];
        this.completedQuests = [];
        
        this.mesh = null;
        this.nameTag = null;
        
        this.tutorialComplete = false;
        this.foundMysteriousElder = false;
    }

    get realm() {
        return getRealmByLevel(this.level);
    }

    getEquipmentStats() {
        const stats = { attack: 0, defense: 0, hp: 0, mp: 0, speed: 0 };
        
        Object.values(this.equipment).forEach(equip => {
            if (equip && equip.stats) {
                if (equip.stats.attack) stats.attack += equip.stats.attack;
                if (equip.stats.defense) stats.defense += equip.stats.defense;
                if (equip.stats.hp) stats.hp += equip.stats.hp;
                if (equip.stats.mp) stats.mp += equip.stats.mp;
                if (equip.stats.speed) stats.speed += equip.stats.speed;
            }
        });
        
        return stats;
    }

    get maxHp() {
        let base = this.baseHp;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.hp;
        }
        
        if (this.classId && this.specializationId) {
            const spec = getSpecialization(this.classId, this.specializationId);
            if (spec && spec.bonusStats.hp) {
                base *= spec.bonusStats.hp;
            }
        }
        
        base *= getRealmBonus(this.level);
        
        const equipStats = this.getEquipmentStats();
        base += equipStats.hp;
        
        return Math.floor(base);
    }

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
        
        const equipStats = this.getEquipmentStats();
        base += equipStats.mp;
        
        return Math.floor(base);
    }

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
        
        const equipStats = this.getEquipmentStats();
        base += equipStats.attack;
        
        const chargeBuff = this.buffs.find(b => b.id === 'charge');
        if (chargeBuff) {
            base *= (1 + chargeBuff.damageBonus);
        }
        
        return Math.floor(base);
    }

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
        
        const equipStats = this.getEquipmentStats();
        base += equipStats.defense;
        
        return Math.floor(base);
    }

    get speed() {
        let base = this.baseSpeed;
        
        if (this.classId) {
            const cls = getClass(this.classId);
            if (cls) base = cls.baseStats.speed;
        }
        
        const equipStats = this.getEquipmentStats();
        base += equipStats.speed;
        
        return base;
    }

    get className() {
        if (!this.classId) return null;
        const cls = getClass(this.classId);
        return cls ? cls.name : null;
    }

    get specializationName() {
        if (!this.classId || !this.specializationId) return null;
        const spec = getSpecialization(this.classId, this.specializationId);
        return spec ? spec.name : null;
    }

    createMesh() {
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

    update(deltaTime, direction) {
        if (direction.x !== 0 || direction.z !== 0) {
            const moveSpeed = this.speed * deltaTime * 5;
            
            this.position.x += direction.x * moveSpeed;
            this.position.z += direction.z * moveSpeed;
            
            this.rotation = Math.atan2(direction.x, direction.z);
            
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y = this.rotation;
        }
        
        this.updateBuffs(deltaTime);
        this.updateCooldowns(deltaTime);
        
        if (!this.inCombat) {
            this.regenTick(deltaTime);
        }
    }

    updateBuffs(deltaTime) {
        this.buffs = this.buffs.filter(buff => {
            buff.remaining -= deltaTime * 1000;
            return buff.remaining > 0;
        });
    }

    updateCooldowns(deltaTime) {
        for (const skillId in this.skillCooldowns) {
            this.skillCooldowns[skillId] -= deltaTime * 1000;
            if (this.skillCooldowns[skillId] <= 0) {
                delete this.skillCooldowns[skillId];
            }
        }
    }

    regenTick(deltaTime) {
        const regenRate = 0.01 * deltaTime;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regenRate);
        this.mp = Math.min(this.maxMp, this.mp + this.maxMp * regenRate);
    }

    takeDamage(amount) {
        const vajraBuff = this.buffs.find(b => b.id === 'vajraBody');
        if (vajraBuff) {
            amount *= (1 - vajraBuff.damageReduction);
        }
        
        const shieldBuff = this.buffs.find(b => b.id === 'spiritShield');
        if (shieldBuff) {
            this.buffs = this.buffs.filter(b => b.id !== 'spiritShield');
            return 0;
        }
        
        const finalDamage = Math.max(1, Math.floor(amount - this.defense * 0.5));
        this.hp = Math.max(0, this.hp - finalDamage);
        this.inCombat = true;
        
        return finalDamage;
    }

    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHp - this.hp);
        this.hp += actualHeal;
        return actualHeal;
    }

    useMp(amount) {
        if (this.mp < amount) return false;
        this.mp -= amount;
        return true;
    }

    gainExp(amount) {
        const chargeBuff = this.buffs.find(b => b.id === 'charge' && b.consumed);
        if (chargeBuff) {
            this.buffs = this.buffs.filter(b => b !== chargeBuff);
        }
        
        this.exp += amount;
        
        const results = [];
        
        while (this.level < 81) {
            const required = getExpRequired(this.level);
            if (this.exp >= required) {
                this.exp -= required;
                this.level++;
                results.push({ type: 'levelUp', level: this.level });
                
                this.hp = this.maxHp;
                this.mp = this.maxMp;
                
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

    gainGold(amount) {
        this.gold += amount;
    }

    selectClass(classId) {
        if (this.level < 10) return false;
        if (this.classId) return false;
        
        this.classId = classId;
        
        const classSkills = getClassSkills(classId);
        classSkills.forEach(skill => {
            if (!this.learnedSkills.includes(skill.id)) {
                this.learnedSkills.push(skill.id);
            }
        });
        
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    selectSpecialization(specId) {
        if (this.level < 30) return false;
        if (!this.classId) return false;
        if (this.specializationId) return false;
        
        const spec = getSpecialization(this.classId, specId);
        if (!spec) return false;
        
        this.specializationId = specId;
        
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        
        return true;
    }

    equipItem(item, inventoryIndex) {
        if (!isEquipment(item)) {
            return { success: false, message: '该物品不是装备' };
        }
        
        const slot = getEquipmentSlot(item);
        if (!slot || !EQUIPMENT_SLOTS[slot]) {
            return { success: false, message: '无效的装备槽位' };
        }
        
        const currentEquip = this.equipment[slot];
        
        if (currentEquip) {
            if (this.inventory.length >= this.maxInventory) {
                return { success: false, message: '背包已满，无法替换装备' };
            }
            this.inventory.push({ itemId: currentEquip.itemId || currentEquip.id, count: 1 });
        }
        
        this.equipment[slot] = {
            itemId: item.id,
            name: item.name,
            icon: item.icon,
            rarity: item.rarity || 'common',
            stats: { ...item.stats }
        };
        
        if (inventoryIndex !== undefined && inventoryIndex !== null) {
            this.inventory.splice(inventoryIndex, 1);
        } else {
            const idx = this.inventory.findIndex(inv => inv.itemId === item.id);
            if (idx !== -1) {
                this.inventory.splice(idx, 1);
            }
        }
        
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
        
        return { 
            success: true, 
            message: `已装备 ${item.name}`,
            replaced: currentEquip
        };
    }

    unequipItem(slot) {
        if (!EQUIPMENT_SLOTS[slot]) {
            return { success: false, message: '无效的装备槽位' };
        }
        
        const currentEquip = this.equipment[slot];
        if (!currentEquip) {
            return { success: false, message: '该槽位没有装备' };
        }
        
        if (this.inventory.length >= this.maxInventory) {
            return { success: false, message: '背包已满，无法卸下装备' };
        }
        
        this.inventory.push({ 
            itemId: currentEquip.itemId || currentEquip.id, 
            count: 1 
        });
        
        const unequippedName = currentEquip.name;
        this.equipment[slot] = null;
        
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
        
        return { 
            success: true, 
            message: `已卸下 ${unequippedName}` 
        };
    }

    getEquipment(slot) {
        if (!EQUIPMENT_SLOTS[slot]) return null;
        return this.equipment[slot];
    }

    getAllEquipment() {
        return { ...this.equipment };
    }

    addItem(item, count = 1) {
        if (item.stackable) {
            const existing = this.inventory.find(inv => inv.itemId === item.id);
            if (existing) {
                existing.count = Math.min(item.maxStack, existing.count + count);
                return true;
            }
        }
        
        if (this.inventory.length >= this.maxInventory) {
            return false;
        }
        
        this.inventory.push({ itemId: item.id, count });
        return true;
    }

    removeItem(itemId, count = 1) {
        const index = this.inventory.findIndex(inv => inv.itemId === itemId);
        if (index === -1) return false;
        
        this.inventory[index].count -= count;
        if (this.inventory[index].count <= 0) {
            this.inventory.splice(index, 1);
        }
        
        return true;
    }

    hasItem(itemId, count = 1) {
        const item = this.inventory.find(inv => inv.itemId === itemId);
        return item && item.count >= count;
    }

    getInventoryItem(index) {
        if (index < 0 || index >= this.inventory.length) return null;
        const invItem = this.inventory[index];
        if (!invItem) return null;
        const itemData = getItem(invItem.itemId);
        return itemData ? { ...itemData, count: invItem.count, inventoryIndex: index } : null;
    }

    clampPosition(minX, maxX, minZ, maxZ) {
        this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
        this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));
        
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
        }
    }

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
            inventory: JSON.parse(JSON.stringify(this.inventory)),
            equipment: JSON.parse(JSON.stringify(this.equipment)),
            learnedSkills: [...this.learnedSkills],
            quests: [...this.quests],
            completedQuests: [...this.completedQuests],
            tutorialComplete: this.tutorialComplete,
            foundMysteriousElder: this.foundMysteriousElder
        };
    }

    loadFromSaveData(data) {
        if (!data) return;
        
        this.name = data.name || '玩家';
        this.level = data.level || 0;
        this.exp = data.exp || 0;
        this.gold = data.gold || 100;
        this.classId = data.classId || null;
        this.specializationId = data.specializationId || null;
        this.hp = data.hp || this.maxHp;
        this.mp = data.mp || this.maxMp;
        this.position = data.position ? { ...data.position } : { x: 0, y: 0, z: 5 };
        this.inventory = Array.isArray(data.inventory) ? JSON.parse(JSON.stringify(data.inventory)) : [];
        this.learnedSkills = Array.isArray(data.learnedSkills) ? [...data.learnedSkills] : ['punch', 'breathe', 'dodge', 'charge'];
        this.quests = Array.isArray(data.quests) ? [...data.quests] : [];
        this.completedQuests = Array.isArray(data.completedQuests) ? [...data.completedQuests] : [];
        this.tutorialComplete = data.tutorialComplete || false;
        this.foundMysteriousElder = data.foundMysteriousElder || false;
        
        if (data.equipment && typeof data.equipment === 'object') {
            this.equipment = { ...DEFAULT_EQUIPMENT };
            
            Object.keys(EQUIPMENT_SLOTS).forEach(slot => {
                if (data.equipment[slot]) {
                    const equip = data.equipment[slot];
                    
                    if (equip.itemId) {
                        this.equipment[slot] = { ...equip };
                    } else if (equip.id) {
                        this.equipment[slot] = {
                            itemId: equip.id,
                            name: equip.name,
                            icon: equip.icon,
                            rarity: equip.rarity || 'common',
                            stats: equip.stats ? { ...equip.stats } : {}
                        };
                    }
                }
            });
        } else {
            this.equipment = { ...DEFAULT_EQUIPMENT };
        }
        
        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
    }
}
