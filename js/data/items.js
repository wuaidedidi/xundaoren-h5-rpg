/**
 * 寻道人 - 物品配置
 * 包含消耗品、材料、装备
 */

export const RARITY = {
  common: {
    id: "common",
    name: "普通",
    color: "#aaaaaa",
    borderColor: "#888888",
    multiplier: 1.0
  },
  fine: {
    id: "fine",
    name: "精良",
    color: "#4ade80",
    borderColor: "#22c55e",
    multiplier: 1.3
  },
  rare: {
    id: "rare",
    name: "稀有",
    color: "#60a5fa",
    borderColor: "#3b82f6",
    multiplier: 1.6
  }
};

export const EQUIPMENT_SLOTS = {
  weapon: { id: "weapon", name: "武器", icon: "⚔️" },
  armor: { id: "armor", name: "护甲", icon: "🛡️" },
  accessory: { id: "accessory", name: "饰品", icon: "💎" }
};

export const ITEMS = {
  hpPotion: {
    id: "hpPotion",
    name: "回血丹",
    icon: "🧪",
    type: "consumable",
    stackable: true,
    maxStack: 99,
    price: 10,
    effect: { type: "heal", value: 50 },
    description: "服用后立即恢复50点生命值"
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
    description: "服用后立即恢复30点法力值"
  },

  rabbitFur: {
    id: "rabbitFur",
    name: "兔毛",
    icon: "🐰",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 2,
    description: "野兔妖掉落的普通毛皮"
  },
  woodCore: {
    id: "woodCore",
    name: "木精核",
    icon: "🌿",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 5,
    description: "木精的灵力核心"
  },
  stoneChunk: {
    id: "stoneChunk",
    name: "石块",
    icon: "🪨",
    type: "material",
    stackable: true,
    maxStack: 99,
    price: 3,
    description: "石傀儡身上掉落的坚硬石块"
  },

  ironSword: {
    id: "ironSword",
    name: "铁剑",
    icon: "⚔️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 100,
    rarity: "common",
    stats: { attack: 5 },
    description: "最基础的武器，聊胜于无"
  },
  ironSwordFine: {
    id: "ironSwordFine",
    name: "精铁剑",
    icon: "⚔️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 150,
    rarity: "fine",
    stats: { attack: 7 },
    description: "经过精心打磨的铁剑，锋利无比"
  },
  ironSwordRare: {
    id: "ironSwordRare",
    name: "玄铁剑",
    icon: "⚔️",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 250,
    rarity: "rare",
    stats: { attack: 10, speed: 1 },
    description: "掺入玄铁锻造的利剑，削铁如泥"
  },

  woodStaff: {
    id: "woodStaff",
    name: "木杖",
    icon: "🪄",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 80,
    rarity: "common",
    stats: { attack: 3, mp: 10 },
    description: "简单的木制法杖，略带灵气"
  },
  woodStaffFine: {
    id: "woodStaffFine",
    name: "灵木杖",
    icon: "🪄",
    type: "weapon",
    slot: "weapon",
    stackable: false,
    price: 130,
    rarity: "fine",
    stats: { attack: 4, mp: 20 },
    description: "用灵木制成的法杖，法力充沛"
  },

  clothRobe: {
    id: "clothRobe",
    name: "布衣",
    icon: "👘",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 80,
    rarity: "common",
    stats: { defense: 3 },
    description: "普通的布制衣物，勉强能御寒"
  },
  clothRobeFine: {
    id: "clothRobeFine",
    name: "棉布袍",
    icon: "👘",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 120,
    rarity: "fine",
    stats: { defense: 5, hp: 20 },
    description: "厚实的棉布袍，保暖又舒适"
  },
  clothRobeRare: {
    id: "clothRobeRare",
    name: "灵丝袍",
    icon: "👘",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 200,
    rarity: "rare",
    stats: { defense: 8, hp: 50, mp: 20 },
    description: "用灵蚕丝织成的法袍，蕴含灵力"
  },

  leatherArmor: {
    id: "leatherArmor",
    name: "皮甲",
    icon: "🥋",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 120,
    rarity: "common",
    stats: { defense: 5, hp: 20 },
    description: "兽皮制成的轻便护甲"
  },
  leatherArmorFine: {
    id: "leatherArmorFine",
    name: "硬皮甲",
    icon: "🥋",
    type: "armor",
    slot: "armor",
    stackable: false,
    price: 180,
    rarity: "fine",
    stats: { defense: 8, hp: 40 },
    description: "经过硬化处理的皮甲，防护力更强"
  },

  copperRing: {
    id: "copperRing",
    name: "铜戒",
    icon: "💍",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 60,
    rarity: "common",
    stats: { hp: 10 },
    description: "普通的铜制戒指"
  },
  copperRingFine: {
    id: "copperRingFine",
    name: "精铜戒",
    icon: "💍",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 100,
    rarity: "fine",
    stats: { hp: 20, mp: 10 },
    description: "精致的铜戒，刻有简单符文"
  },
  jadePendant: {
    id: "jadePendant",
    name: "玉佩",
    icon: "📿",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 150,
    rarity: "fine",
    stats: { hp: 30, mp: 30 },
    description: "温润的玉佩，能滋养身心"
  },
  spiritJade: {
    id: "spiritJade",
    name: "灵玉",
    icon: "💎",
    type: "accessory",
    slot: "accessory",
    stackable: false,
    price: 300,
    rarity: "rare",
    stats: { attack: 3, defense: 3, hp: 50, mp: 50 },
    description: "蕴含灵气的宝玉，全面提升属性"
  }
};

export const BLACKSMITH_SHOP_ITEMS = [
  "ironSword",
  "ironSwordFine",
  "woodStaff",
  "woodStaffFine",
  "clothRobe",
  "clothRobeFine",
  "leatherArmor",
  "leatherArmorFine",
  "copperRing",
  "copperRingFine",
  "jadePendant",
  "hpPotion",
  "mpPotion"
];

export const EQUIPMENT_DROPS = {
  common: [
    { itemId: "ironSword", chance: 0.05 },
    { itemId: "clothRobe", chance: 0.05 },
    { itemId: "leatherArmor", chance: 0.04 },
    { itemId: "copperRing", chance: 0.03 },
    { itemId: "woodStaff", chance: 0.04 }
  ],
  fine: [
    { itemId: "ironSwordFine", chance: 0.03 },
    { itemId: "clothRobeFine", chance: 0.03 },
    { itemId: "leatherArmorFine", chance: 0.025 },
    { itemId: "copperRingFine", chance: 0.02 },
    { itemId: "woodStaffFine", chance: 0.025 },
    { itemId: "jadePendant", chance: 0.015 }
  ],
  rare: [
    { itemId: "ironSwordRare", chance: 0.01 },
    { itemId: "clothRobeRare", chance: 0.01 },
    { itemId: "spiritJade", chance: 0.008 }
  ]
};

export function getItem(itemId) {
  return ITEMS[itemId] || null;
}

export function getRarity(rarityId) {
  return RARITY[rarityId] || RARITY.common;
}

export function getShopItems(itemIds) {
  return itemIds.map((id) => ITEMS[id]).filter(Boolean);
}

export function getBlacksmithShopItems() {
  return getShopItems(BLACKSMITH_SHOP_ITEMS);
}

export function isEquipment(item) {
  return item && (item.type === "weapon" || item.type === "armor" || item.type === "accessory");
}

export function getEquipmentSlot(item) {
  if (!isEquipment(item)) return null;
  return item.slot || item.type;
}

export function generateDrop(monsterLevel) {
  const drops = [];
  
  let rarityPool = "common";
  if (monsterLevel >= 3) rarityPool = "fine";
  if (monsterLevel >= 5) rarityPool = "rare";
  
  const pool = EQUIPMENT_DROPS[rarityPool] || EQUIPMENT_DROPS.common;
  
  pool.forEach(drop => {
    if (Math.random() < drop.chance) {
      drops.push({ itemId: drop.itemId, count: 1 });
    }
  });
  
  if (monsterLevel >= 2 && Math.random() < 0.1) {
    const finePool = EQUIPMENT_DROPS.fine;
    const drop = finePool[Math.floor(Math.random() * finePool.length)];
    if (Math.random() < drop.chance * 2) {
      drops.push({ itemId: drop.itemId, count: 1 });
    }
  }
  
  return drops;
}

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

export function getSellPrice(item) {
  if (!item) return 0;
  return Math.floor(item.price * 0.5);
}

export function getRepairCost(player) {
  let totalCost = 0;
  
  Object.values(player.equipment).forEach(equip => {
    if (equip) {
      const item = getItem(equip.itemId || equip.id);
      if (item) {
        totalCost += Math.floor(item.price * 0.1);
      }
    }
  });
  
  return totalCost;
}
