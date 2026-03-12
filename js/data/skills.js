/**
 * 寻道人 - 技能配置
 */

// 基础技能（所有角色可学）
export const BASE_SKILLS = {
    punch: {
        id: 'punch',
        name: '挥拳',
        icon: '👊',
        key: '1',
        type: 'physical',
        cooldown: 0,
        mpCost: 0,
        range: 2,
        damage: 1.0,
        description: '基础近战攻击，造成100%攻击力伤害'
    },
    breathe: {
        id: 'breathe',
        name: '吐纳术',
        icon: '🌬️',
        key: '2',
        type: 'heal',
        cooldown: 10,
        mpCost: 0,
        range: 0,
        healPercent: 0.3,
        duration: 5,
        description: '5秒内持续回复30%最大生命值'
    },
    dodge: {
        id: 'dodge',
        name: '闪避',
        icon: '💨',
        key: '3',
        type: 'movement',
        cooldown: 5,
        mpCost: 10,
        range: 0,
        distance: 3,
        description: '快速后退3米，躲避攻击'
    },
    charge: {
        id: 'charge',
        name: '蓄力',
        icon: '⚡',
        key: '4',
        type: 'buff',
        cooldown: 8,
        mpCost: 15,
        range: 0,
        damageBonus: 0.5,
        duration: 10,
        description: '增益效果，下次攻击伤害+50%'
    }
};

// 锻体职业技能
export const BODY_SKILLS = {
    ironFist: {
        id: 'ironFist',
        name: '铁拳·碎石',
        icon: '🥊',
        key: '5',
        type: 'physical',
        cooldown: 6,
        mpCost: 20,
        range: 2.5,
        damage: 1.5,
        knockback: 2,
        description: '造成150%伤害并击退目标'
    },
    vajraBody: {
        id: 'vajraBody',
        name: '金刚不坏',
        icon: '🛡️',
        key: '6',
        type: 'buff',
        cooldown: 20,
        mpCost: 30,
        range: 0,
        damageReduction: 0.5,
        duration: 5,
        description: '5秒内减少受到伤害50%'
    },
    earthquake: {
        id: 'earthquake',
        name: '震地',
        icon: '🌋',
        key: '7',
        type: 'physical',
        cooldown: 12,
        mpCost: 25,
        range: 5,
        aoe: true,
        damage: 0.8,
        slowPercent: 0.3,
        slowDuration: 3,
        description: '对周围敌人造成80%伤害并减速3秒'
    }
};

// 练气职业技能
export const QI_SKILLS = {
    qiBlast: {
        id: 'qiBlast',
        name: '御气诀',
        icon: '🔮',
        key: '5',
        type: 'magic',
        cooldown: 3,
        mpCost: 15,
        range: 10,
        damage: 1.2,
        description: '远程攻击，造成120%法术伤害'
    },
    thunderStrike: {
        id: 'thunderStrike',
        name: '雷引',
        icon: '⚡',
        key: '6',
        type: 'magic',
        cooldown: 15,
        mpCost: 40,
        range: 8,
        aoe: true,
        damage: 2.0,
        description: '对目标区域造成200%范围伤害'
    },
    spiritShield: {
        id: 'spiritShield',
        name: '灵盾',
        icon: '🔵',
        key: '7',
        type: 'buff',
        cooldown: 25,
        mpCost: 35,
        range: 0,
        shieldHits: 1,
        description: '创建护盾，吸收一次伤害'
    }
};

// 通灵职业技能
export const SPIRIT_SKILLS = {
    paralyze: {
        id: 'paralyze',
        name: '定身咒',
        icon: '🔒',
        key: '5',
        type: 'control',
        cooldown: 10,
        mpCost: 25,
        range: 8,
        stunDuration: 2,
        description: '定身敌人2秒，无法移动'
    },
    rejuvenate: {
        id: 'rejuvenate',
        name: '回春术',
        icon: '💚',
        key: '6',
        type: 'heal',
        cooldown: 8,
        mpCost: 30,
        range: 10,
        healPercent: 0.2,
        description: '为目标回复20%最大生命值'
    },
    soulFear: {
        id: 'soulFear',
        name: '灵魂震慑',
        icon: '👁️',
        key: '7',
        type: 'debuff',
        cooldown: 18,
        mpCost: 35,
        range: 6,
        aoe: true,
        damageReduction: 0.2,
        duration: 5,
        description: '降低周围敌人20%伤害，持续5秒'
    }
};

/**
 * 获取基础技能列表
 */
export function getBaseSkills() {
    return Object.values(BASE_SKILLS);
}

/**
 * 根据职业获取技能列表
 */
export function getClassSkills(classId) {
    switch (classId) {
        case 'body': return Object.values(BODY_SKILLS);
        case 'qi': return Object.values(QI_SKILLS);
        case 'spirit': return Object.values(SPIRIT_SKILLS);
        default: return [];
    }
}

/**
 * 获取技能信息
 */
export function getSkill(skillId) {
    return BASE_SKILLS[skillId] || 
           BODY_SKILLS[skillId] || 
           QI_SKILLS[skillId] || 
           SPIRIT_SKILLS[skillId] || 
           null;
}

/**
 * 获取玩家所有可用技能
 */
export function getAvailableSkills(playerClass, level) {
    const skills = [...Object.values(BASE_SKILLS)];
    
    if (level >= 10 && playerClass) {
        skills.push(...getClassSkills(playerClass));
    }
    
    return skills;
}
