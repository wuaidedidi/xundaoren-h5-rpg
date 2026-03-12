/**
 * 寻道人 - 物品配置
 */

export const RARITY = {
  common: { name: "普通", color: "#ffffff", borderColor: "#cccccc" },
  uncommon: { name: "精良", color: "#00ff00", borderColor: "#00cc00" },
  rare: { name: "稀有", color: "#00ffff", borderColor: "#00aaaa" },
};

export const EQUIPMENT_SLOTS = {
  weapon: "weapon",
  armor: "armor",
  accessory: "accessory",
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

  // 装备（预留）
  basicSword: {
    id: "basicSword",
    name: "铁剑",
    icon: "⚔️",
    type: "equipment",
    stackable: false,
    price: 100,
    slot: "weapon",
    rarity: "common",
    durability: 100,
    maxDurability: 100,
    stats: { attack: 5 },
    description: "最基础的武器，聊胜于无",
  },
  fineSword: {
    id: "fineSword",
    name: "精铁剑",
    icon: "⚔️",
    type: "equipment",
    stackable: false,
    price: 300,
    slot: "weapon",
    rarity: "uncommon",
    durability: 150,
    maxDurability: 150,
    stats: { attack: 10 },
    description: "经过精细打磨的铁剑，更加锋利",
  },
  rareSword: {
    id: "rareSword",
    name: "青光剑",
    icon: "⚔️",
    type: "equipment",
    stackable: false,
    price: 800,
    slot: "weapon",
    rarity: "rare",
    durability: 200,
    maxDurability: 200,
    stats: { attack: 15, defense: 2 },
    description: "散发着青光的宝剑，仿佛有灵力流动",
  },
  basicRobe: {
    id: "basicRobe",
    name: "布衣",
    icon: "👘",
    type: "equipment",
    stackable: false,
    price: 80,
    slot: "armor",
    rarity: "common",
    durability: 80,
    maxDurability: 80,
    stats: { defense: 3 },
    description: "普通的布制衣物",
  },
  fineRobe: {
    id: "fineRobe",
    name: "丝绸衣",
    icon: "👘",
    type: "equipment",
    stackable: false,
    price: 250,
    slot: "armor",
    rarity: "uncommon",
    durability: 120,
    maxDurability: 120,
    stats: { defense: 7 },
    description: "丝绸缝制的衣物，轻便舒适",
  },
  rareRobe: {
    id: "rareRobe",
    name: "流云袍",
    icon: "👘",
    type: "equipment",
    stackable: false,
    price: 600,
    slot: "armor",
    rarity: "rare",
    durability: 160,
    maxDurability: 160,
    stats: { defense: 12, hp: 20 },
    description: "绣着流云图案的法袍，增加灵力",
  },
  basicRing: {
    id: "basicRing",
    name: "铜戒指",
    icon: "💍",
    type: "equipment",
    stackable: false,
    price: 150,
    slot: "accessory",
    rarity: "common",
    durability: 50,
    maxDurability: 50,
    stats: { attack: 1, defense: 1 },
    description: "普通的铜制戒指",
  },
  fineAmulet: {
    id: "fineAmulet",
    name: "护符",
    icon: "📿",
    type: "equipment",
    stackable: false,
    price: 400,
    slot: "accessory",
    rarity: "uncommon",
    durability: 80,
    maxDurability: 80,
    stats: { hp: 30, mp: 20 },
    description: "带有保护力量的护符",
  },
  rareNecklace: {
    id: "rareNecklace",
    name: "灵珠项链",
    icon: "📿",
    type: "equipment",
    stackable: false,
    price: 1000,
    slot: "accessory",
    rarity: "rare",
    durability: 100,
    maxDurability: 100,
    stats: { attack: 5, defense: 5, hp: 50, mp: 30 },
    description: "镶嵌着灵珠的项链，灵力充沛",
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
