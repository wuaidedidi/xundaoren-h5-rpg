/**
 * 寻道人 - 怪物配置
 */

export const MONSTERS = {
  rabbitDemon: {
    id: "rabbitDemon",
    name: "野兔妖",
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
    drops: [{ itemId: "rabbitFur", chance: 0.5, countMin: 1, countMax: 2 }],
    description: "初级妖兽，胆小但数量众多",
    // 3D表现配置
    monsterType: "rabbit", // 兔妖
    emissiveIntensity: 0.1, // 自发光强度
    isElite: false, // 是否精英怪
  },
  woodSpirit: {
    id: "woodSpirit",
    name: "木精",
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
    drops: [{ itemId: "woodCore", chance: 0.4, countMin: 1, countMax: 1 }],
    description: "由灵气滋养的草木化形",
    // 3D表现配置
    monsterType: "wood", // 木精
    emissiveIntensity: 0.15, // 自发光强度
    isElite: false, // 是否精英怪
  },
  stoneGolem: {
    id: "stoneGolem",
    name: "石傀儡",
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
    drops: [{ itemId: "stoneChunk", chance: 0.6, countMin: 1, countMax: 3 }],
    description: "坚硬的石头傀儡，行动迟缓但防御极高",
    // 3D表现配置
    monsterType: "stone", // 石傀儡
    emissiveIntensity: 0.05, // 自发光强度
    isElite: false, // 是否精英怪
  },
  // 精英怪示例
  eliteRabbitDemon: {
    id: "eliteRabbitDemon",
    name: "兔妖首领",
    level: 5,
    hp: 80,
    attack: 12,
    defense: 5,
    speed: 3.5,
    exp: 35,
    gold: 25,
    color: 0xff6666,
    size: 0.6,
    aggroRange: 10,
    attackRange: 2.5,
    drops: [
      { itemId: "rabbitFur", chance: 0.8, countMin: 2, countMax: 4 },
      { itemId: "demonCore", chance: 0.3, countMin: 1, countMax: 1 },
    ],
    description: "兔妖族群的首领，体型更大更凶猛",
    // 3D表现配置
    monsterType: "rabbit", // 兔妖
    emissiveIntensity: 0.3, // 自发光强度（更强）
    isElite: true, // 精英怪
    eliteColor: 0xff4444, // 精英怪光圈颜色
  },
  eliteStoneGolem: {
    id: "eliteStoneGolem",
    name: "巨石守卫",
    level: 8,
    hp: 200,
    attack: 25,
    defense: 18,
    speed: 0.8,
    exp: 80,
    gold: 60,
    color: 0x666699,
    size: 1.0,
    aggroRange: 7,
    attackRange: 3,
    drops: [
      { itemId: "stoneChunk", chance: 0.9, countMin: 3, countMax: 6 },
      { itemId: "golemCore", chance: 0.4, countMin: 1, countMax: 1 },
    ],
    description: "由上古灵石构成的强大傀儡",
    // 3D表现配置
    monsterType: "stone", // 石傀儡
    emissiveIntensity: 0.2, // 自发光强度
    isElite: true, // 精英怪
    eliteColor: 0xff8800, // 精英怪光圈颜色（橙色）
  },
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
  return Object.values(MONSTERS).filter((m) => m.level >= minLevel && m.level <= maxLevel);
}

/**
 * 获取普通怪物列表（排除精英）
 */
export function getNormalMonsters() {
  return Object.values(MONSTERS).filter((m) => !m.isElite);
}

/**
 * 获取精英怪物列表
 */
export function getEliteMonsters() {
  return Object.values(MONSTERS).filter((m) => m.isElite);
}
