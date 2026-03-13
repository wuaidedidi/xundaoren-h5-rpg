/**
 * 寻道人 - 怪物配置
 */

export const MONSTERS = {
    rabbitDemon: {
        id: 'rabbitDemon',
        name: '野兔妖',
        level: 1,
        hp: 30,
        attack: 5,
        defense: 2,
        speed: 3,
        exp: 10,
        gold: 5,
        color: 0xaaaaaa,
        emissiveIntensity: 0.1,
        size: 0.6,
        modelType: 'rabbitDemon',
        aggroRange: 8,
        attackRange: 2,
        drops: [
            { itemId: 'rabbitFur', chance: 0.5, countMin: 1, countMax: 2 }
        ],
        description: '初级妖兽，胆小但数量众多'
    },
    rabbitDemonElite: {
        id: 'rabbitDemonElite',
        name: '精英野兔妖',
        level: 3,
        hp: 90,
        attack: 10,
        defense: 5,
        speed: 3.5,
        exp: 30,
        gold: 15,
        color: 0xffaaaa,
        emissiveIntensity: 0.3,
        size: 0.6,
        modelType: 'rabbitDemon',
        isElite: true,
        aggroRange: 10,
        attackRange: 2,
        drops: [
            { itemId: 'rabbitFur', chance: 0.8, countMin: 2, countMax: 4 },
            { itemId: 'eliteToken', chance: 1.0, countMin: 1, countMax: 1 }
        ],
        description: '变异的野兔妖首领，体型更大更具攻击性'
    },
    woodSpirit: {
        id: 'woodSpirit',
        name: '木精',
        level: 2,
        hp: 50,
        attack: 8,
        defense: 3,
        speed: 2,
        exp: 18,
        gold: 8,
        color: 0x228b22,
        emissiveIntensity: 0.2,
        size: 0.8,
        modelType: 'woodSpirit',
        aggroRange: 6,
        attackRange: 2,
        drops: [
            { itemId: 'woodCore', chance: 0.4, countMin: 1, countMax: 1 }
        ],
        description: '由灵气滋养的草木化形'
    },
    woodSpiritElite: {
        id: 'woodSpiritElite',
        name: '精英木精',
        level: 4,
        hp: 150,
        attack: 15,
        defense: 6,
        speed: 2.5,
        exp: 54,
        gold: 24,
        color: 0x22ff22,
        emissiveIntensity: 0.4,
        size: 0.8,
        modelType: 'woodSpirit',
        isElite: true,
        aggroRange: 8,
        attackRange: 2,
        drops: [
            { itemId: 'woodCore', chance: 0.7, countMin: 2, countMax: 3 },
            { itemId: 'eliteToken', chance: 1.0, countMin: 1, countMax: 1 }
        ],
        description: '吸收了大量灵气的木精首领'
    },
    stoneGolem: {
        id: 'stoneGolem',
        name: '石傀儡',
        level: 3,
        hp: 80,
        attack: 12,
        defense: 8,
        speed: 1,
        exp: 30,
        gold: 15,
        color: 0x808080,
        emissiveIntensity: 0.05,
        size: 1.0,
        modelType: 'stoneGolem',
        aggroRange: 5,
        attackRange: 2.5,
        drops: [
            { itemId: 'stoneChunk', chance: 0.6, countMin: 1, countMax: 3 }
        ],
        description: '坚硬的石头傀儡，行动迟缓但防御极高'
    },
    stoneGolemElite: {
        id: 'stoneGolemElite',
        name: '精英石傀儡',
        level: 5,
        hp: 240,
        attack: 20,
        defense: 15,
        speed: 1.5,
        exp: 90,
        gold: 45,
        color: 0xaaaaaa,
        emissiveIntensity: 0.2,
        size: 1.0,
        modelType: 'stoneGolem',
        isElite: true,
        aggroRange: 7,
        attackRange: 2.5,
        drops: [
            { itemId: 'stoneChunk', chance: 0.9, countMin: 3, countMax: 5 },
            { itemId: 'eliteToken', chance: 1.0, countMin: 1, countMax: 1 }
        ],
        description: '由特殊矿石构成的强大石傀儡'
    }
};

/**
 * 获取怪物信息
 */
export function getMonster(monsterId) {
    return MONSTERS[monsterId] || null;
}

/**
 * 获取所有怪物列表
 */
export function getAllMonsters() {
    return Object.values(MONSTERS);
}

/**
 * 获取指定等级范围的怪物
 */
export function getMonstersByLevel(minLevel, maxLevel) {
    return Object.values(MONSTERS).filter(m => m.level >= minLevel && m.level <= maxLevel);
}
