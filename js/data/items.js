/**
 * 寻道人 - 物品配置
 */

// 装备稀有度定义
export const RARITY = {
  common: {
    id: 'common',
    name: '普通',
    color: '#9e9e9e',
    borderColor: '#757575',
    multiplier: 1.0
  },
  uncommon: {
    id: 'uncommon',
    name: '精良',
    color: '#4caf50',
    borderColor: '#388e3c',
    multiplier: 1.2
  },
  rare: {
    id: 'rare',
    name: '稀有',
    color: '#2196f3',
    borderColor: '#1976d2',
    multiplier: 1.5
  },
  epic: {
    id: 'epic',
    name: '史诗',
    color: '#9c27b0',
    borderColor: '#7b1fa2',
    multiplier: 2.0
  },
  legendary: {
    id: 'legendary',
    name: '传说',
    color: '#ff9800',
    borderColor: '#f57c00',
    multiplier: 2.5
  }
};

// 装备槽位定义
export const EQUIPMENT_SLOTS = {
  weapon: { id: 'weapon', name: '武器', icon: '⚔️' },
  armor: { id: 'armor', name: '护甲', icon: '🛡️' },
  accessory: { id: 'accessory', name: '饰品', icon: '💍' }
};

// 装备类型到槽位的映射
export const EQUIPMENT_TYPE_TO_SLOT = {
  weapon: 'weapon',
  armor: 'armor',
  accessory: 'accessory'
};

export const ITEMS = {
  // 消耗品
  hpPotion: {
    id: "hpPotion",
    name: "回血丹",
    icon: "🧪",
    type: "consumable",
    stackable: true,
    maxStack: 99,
    price: 10,
    effect: { type: "heal", value: 50 },
    description: "服用后立即恢复50点生命值",
  },
  mpPotion: {
    id: "mpPotion",
    name: "回灵丹",
    icon: "💧",
    type: "consumable",
    stackable: true,
    maxStack: 99,
    price: 15,
    effect: { type: "mana", value: 30 },
    description: "服用后立即恢复30点法力值",
  },

  // 材料
  rabbitFur: {
    id: "rabbitFur",
    name: "兔毛",
    icon: "🐰",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 2,
    description: "野兔妖掉落的普通毛皮",
  },
  woodCore: {
    id: "woodCore",
    name: "木精核",
    icon: "🌿",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 5,
    description: "木精的灵力核心",
  },
  stoneChunk: {
    id: "stoneChunk",
    name: "石块",
    icon: "🪨",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 3,
    description: "石傀儡身上掉落的坚硬石块",
  },

  // 武器
  basicSword: {
    id: "basicSword",
    name: "铁剑",
    icon: "⚔️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 100,
    rarity: "common",
    stats: { attack: 5 },
    description: "最基础的武器，聊胜于无",
  },
  ironSword: {
    id: "ironSword",
    name: "精铁剑",
    icon: "🗡️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 250,
    rarity: "uncommon",
    stats: { attack: 12, critRate: 0.05 },
    description: "用精铁锻造的剑，比铁剑更加锋利",
  },
  spiritSword: {
    id: "spiritSword",
    name: "灵锋剑",
    icon: "🗡️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 600,
    rarity: "rare",
    stats: { attack: 25, critRate: 0.08, mpBonus: 20 },
    description: "蕴含灵气的宝剑，可增幅法力",
  },

  // 护甲
  basicRobe: {
    id: "basicRobe",
    name: "布衣",
    icon: "👘",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 80,
    rarity: "common",
    stats: { defense: 3, hpBonus: 10 },
    description: "普通的布制衣物",
  },
  leatherArmor: {
    id: "leatherArmor",
    name: "皮甲",
    icon: "🦺",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 200,
    rarity: "uncommon",
    stats: { defense: 8, hpBonus: 25 },
    description: "鞣制皮革制成的护甲，轻便耐用",
  },
  chainMail: {
    id: "chainMail",
    name: "锁子甲",
    icon: "🛡️",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 500,
    rarity: "rare",
    stats: { defense: 18, hpBonus: 50, defenseRate: 0.05 },
    description: "精铁环扣连成的护甲，防御力出众",
  },

  // 饰品
  woodenRing: {
    id: "woodenRing",
    name: "木戒指",
    icon: "💍",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 50,
    rarity: "common",
    stats: { hpBonus: 5, mpBonus: 5 },
    description: "普通木制的戒指",
  },
  jadePendant: {
    id: "jadePendant",
    name: "玉佩",
    icon: "🟢",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 300,
    rarity: "uncommon",
    stats: { hpBonus: 30, mpBonus: 15, hpRegen: 1 },
    description: "温润的玉佩，可缓慢恢复生命",
  },
  spiritStone: {
    id: "spiritStone",
    name: "灵石",
    icon: "💎",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 800,
    rarity: "rare",
    stats: { attack: 5, defense: 5, hpBonus: 20, mpBonus: 30 },
    description: "蕴含天地灵气的宝石",
  },
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
  return itemIds.map((id) => ITEMS[id]).filter(Boolean);
}

/**
 * 获取所有装备
 */
export function getAllEquipment() {
  return Object.values(ITEMS).filter(item => 
    item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory'
  );
}

/**
 * 获取指定槽位的装备
 */
export function getEquipmentBySlot(slot) {
  return Object.values(ITEMS).filter(item => item.slot === slot);
}

/**
 * 获取指定稀有度的装备
 */
export function getEquipmentByRarity(rarity) {
  return Object.values(ITEMS).filter(item => item.rarity === rarity);
}

/**
 * 获取稀有度信息
 */
export function getRarity(rarityId) {
  return RARITY[rarityId] || RARITY.common;
}

/**
 * 获取装备槽位信息
 */
export function getEquipmentSlot(slotId) {
  return EQUIPMENT_SLOTS[slotId] || null;
}

/**
 * 计算装备实际属性（考虑稀有度加成）
 */
export function calculateEquipmentStats(item) {
  if (!item || !item.stats) return {};
  
  const rarity = getRarity(item.rarity);
  const multiplier = rarity.multiplier;
  
  const calculatedStats = {};
  for (const [key, value] of Object.entries(item.stats)) {
    // 百分比属性不加成
    if (key.endsWith('Rate') || key === 'critRate') {
      calculatedStats[key] = value;
    } else {
      calculatedStats[key] = Math.floor(value * multiplier);
    }
  }
  
  return calculatedStats;
}

/**
 * 获取装备稀有度颜色
 */
export function getRarityColor(rarityId) {
  const rarity = getRarity(rarityId);
  return rarity.color;
}

/**
 * 获取装备稀有度边框颜色
 */
export function getRarityBorderColor(rarityId) {
  const rarity = getRarity(rarityId);
  return rarity.borderColor;
}

/**
 * 获取装备稀有度名称
 */
export function getRarityName(rarityId) {
  const rarity = getRarity(rarityId);
  return rarity.name;
}

/**
 * 使用物品
 */
export function useItem(item, player) {
  if (item.type !== "consumable") {
    return { success: false, message: "该物品无法使用" };
  }

  const effect = item.effect;
  let message = "";

  switch (effect.type) {
    case "heal":
      const healAmount = Math.min(effect.value, player.maxHp - player.hp);
      player.hp += healAmount;
      message = `恢复了${healAmount}点生命值`;
      break;
    case "mana":
      const manaAmount = Math.min(effect.value, player.maxMp - player.mp);
      player.mp += manaAmount;
      message = `恢复了${manaAmount}点法力值`;
      break;
    default:
      return { success: false, message: "未知效果" };
  }

  return { success: true, message };
}

/**
 * 获取铁匠商店物品列表
 */
export function getBlacksmithShopItems() {
  return [
    'basicSword',
    'ironSword',
    'basicRobe',
    'leatherArmor',
    'woodenRing',
    'jadePendant'
  ];
}

/**
 * 计算修理费用
 */
export function calculateRepairCost(item) {
  if (!item || !item.price) return 0;
  // 修理费用为物品价格的20%
  return Math.floor(item.price * 0.2);
}
