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
    color: 0xcccccc,
    emissive: 0.1,
    size: 0.6,
    aggroRange: 8,
    attackRange: 2,
    monsterType: "rabbitDemon",
    drops: [{ itemId: "rabbitFur", chance: 0.5, countMin: 1, countMax: 2 }],
    description: "初级妖兽，胆小但数量众多",
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
    emissive: 0.3,
    size: 0.8,
    aggroRange: 6,
    attackRange: 2,
    monsterType: "woodSpirit",
    drops: [{ itemId: "woodCore", chance: 0.4, countMin: 1, countMax: 1 }],
    description: "由灵气滋养的草木化形",
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
    color: 0x707070,
    emissive: 0.05,
    size: 1.0,
    aggroRange: 5,
    attackRange: 2.5,
    monsterType: "stoneGolem",
    drops: [{ itemId: "stoneChunk", chance: 0.6, countMin: 1, countMax: 3 }],
    description: "坚硬的石头傀儡，行动迟缓但防御极高",
  },
};

export const ELITE_MONSTERS = {
  eliteRabbitDemon: {
    id: "eliteRabbitDemon",
    name: "狂暴兔妖",
    level: 3,
    hp: 90,
    attack: 15,
    defense: 6,
    speed: 4,
    exp: 30,
    gold: 15,
    color: 0xffaaaa,
    emissive: 0.4,
    size: 0.6,
    aggroRange: 12,
    attackRange: 2.5,
    monsterType: "rabbitDemon",
    isElite: true,
    drops: [{ itemId: "rabbitFur", chance: 0.8, countMin: 2, countMax: 4 }],
    description: "被妖气侵蚀的狂暴兔妖",
  },
  eliteWoodSpirit: {
    id: "eliteWoodSpirit",
    name: "千年木精",
    level: 5,
    hp: 150,
    attack: 20,
    defense: 10,
    speed: 2,
    exp: 60,
    gold: 30,
    color: 0x44cc44,
    emissive: 0.5,
    size: 0.8,
    aggroRange: 8,
    attackRange: 3,
    monsterType: "woodSpirit",
    isElite: true,
    drops: [{ itemId: "woodCore", chance: 0.9, countMin: 2, countMax: 3 }],
    description: "修炼千年的木精，灵气充沛",
  },
  eliteStoneGolem: {
    id: "eliteStoneGolem",
    name: "玄石傀儡",
    level: 7,
    hp: 250,
    attack: 30,
    defense: 20,
    speed: 1,
    exp: 100,
    gold: 50,
    color: 0x8888aa,
    emissive: 0.2,
    size: 1.0,
    aggroRange: 6,
    attackRange: 3,
    monsterType: "stoneGolem",
    isElite: true,
    drops: [{ itemId: "stoneChunk", chance: 1.0, countMin: 3, countMax: 5 }],
    description: "由玄石构成的强大傀儡",
  },
};

/**
 * 获取怪物信息
 */
export function getMonster(monsterId) {
  return MONSTERS[monsterId] || ELITE_MONSTERS[monsterId] || null;
}

/**
 * 获取所有怪物列表（包含精英怪）
 */
export function getAllMonsters() {
  return [...Object.values(MONSTERS), ...Object.values(ELITE_MONSTERS)];
}

/**
 * 获取指定等级范围的怪物
 */
export function getMonstersByLevel(minLevel, maxLevel) {
  return getAllMonsters().filter((m) => m.level >= minLevel && m.level <= maxLevel);
}

/**
 * 获取所有精英怪
 */
export function getEliteMonsters() {
  return Object.values(ELITE_MONSTERS);
}
