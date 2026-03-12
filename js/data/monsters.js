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
        size: 0.6,
        aggroRange: 8,
        attackRange: 2,
        drops: [
            { itemId: 'rabbitFur', chance: 0.5, countMin: 1, countMax: 2 }
        ],
        description: '初级妖兽，胆小但数量众多'
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
        size: 0.8,
        aggroRange: 6,
        attackRange: 2,
        drops: [
            { itemId: 'woodCore', chance: 0.4, countMin: 1, countMax: 1 }
        ],
        description: '由灵气滋养的草木化形'
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
        size: 1.0,
        aggroRange: 5,
        attackRange: 2.5,
        drops: [
            { itemId: 'stoneChunk', chance: 0.6, countMin: 1, countMax: 3 }
        ],
        description: '坚硬的石头傀儡，行动迟缓但防御极高'
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
