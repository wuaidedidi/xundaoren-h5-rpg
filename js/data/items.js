/**
 * 寻道人 - 物品配置
 */

export const ITEMS = {
    // 消耗品
    hpPotion: {
        id: 'hpPotion',
        name: '回血丹',
        icon: '🧪',
        type: 'consumable',
        stackable: true,
        maxStack: 99,
        price: 10,
        effect: { type: 'heal', value: 50 },
        description: '服用后立即恢复50点生命值'
    },
    mpPotion: {
        id: 'mpPotion',
        name: '回灵丹',
        icon: '💧',
        type: 'consumable',
        stackable: true,
        maxStack: 99,
        price: 15,
        effect: { type: 'mana', value: 30 },
        description: '服用后立即恢复30点法力值'
    },
    
    // 材料
    rabbitFur: {
        id: 'rabbitFur',
        name: '兔毛',
        icon: '🐰',
        type: 'material',
        stackable: true,
        maxStack: 99,
        price: 2,
        description: '野兔妖掉落的普通毛皮'
    },
    woodCore: {
        id: 'woodCore',
        name: '木精核',
        icon: '🌿',
        type: 'material',
        stackable: true,
        maxStack: 99,
        price: 5,
        description: '木精的灵力核心'
    },
    stoneChunk: {
        id: 'stoneChunk',
        name: '石块',
        icon: '🪨',
        type: 'material',
        stackable: true,
        maxStack: 99,
        price: 3,
        description: '石傀儡身上掉落的坚硬石块'
    },
    
    // 装备（预留）
    basicSword: {
        id: 'basicSword',
        name: '铁剑',
        icon: '⚔️',
        type: 'weapon',
        stackable: false,
        price: 100,
        stats: { attack: 5 },
        description: '最基础的武器，聊胜于无'
    },
    basicRobe: {
        id: 'basicRobe',
        name: '布衣',
        icon: '👘',
        type: 'armor',
        stackable: false,
        price: 80,
        stats: { defense: 3 },
        description: '普通的布制衣物'
    }
};

/**
 * 获取物品信息
 */
export function getItem(itemId) {
    return ITEMS[itemId] || null;
}

/**
 * 获取商店可售卖物品
 */
export function getShopItems(itemIds) {
    return itemIds.map(id => ITEMS[id]).filter(Boolean);
}

/**
 * 使用物品
 */
export function useItem(item, player) {
    if (item.type !== 'consumable') {
        return { success: false, message: '该物品无法使用' };
    }
    
    const effect = item.effect;
    let message = '';
    
    switch (effect.type) {
        case 'heal':
            const healAmount = Math.min(effect.value, player.maxHp - player.hp);
            player.hp += healAmount;
            message = `恢复了${healAmount}点生命值`;
            break;
        case 'mana':
            const manaAmount = Math.min(effect.value, player.maxMp - player.mp);
            player.mp += manaAmount;
            message = `恢复了${manaAmount}点法力值`;
            break;
        default:
            return { success: false, message: '未知效果' };
    }
    
    return { success: true, message };
}
