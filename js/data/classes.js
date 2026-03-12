/**
 * 寻道人 - 职业配置
 */

export const CLASSES = {
    body: {
        id: 'body',
        name: '锻体',
        icon: '💪',
        description: '以肉身证道，近战坦克',
        baseStats: {
            hp: 150,
            mp: 30,
            attack: 12,
            defense: 10,
            speed: 4
        },
        specializations: {
            vajra: {
                id: 'vajra',
                name: '金刚道',
                description: '极限防御，固若金汤',
                bonusStats: { defense: 1.5, hp: 1.3 }
            },
            king: {
                id: 'king',
                name: '力王道',
                description: '爆发输出，势不可挡',
                bonusStats: { attack: 1.5, hp: 1.1 }
            }
        }
    },
    qi: {
        id: 'qi',
        name: '练气',
        icon: '🌀',
        description: '以灵气御敌，远程法师',
        baseStats: {
            hp: 80,
            mp: 100,
            attack: 15,
            defense: 5,
            speed: 5
        },
        specializations: {
            thunder: {
                id: 'thunder',
                name: '雷法道',
                description: '单体爆发，雷霆万钧',
                bonusStats: { attack: 1.6, mp: 1.2 }
            },
            fire: {
                id: 'fire',
                name: '火法道',
                description: '范围伤害，焚天灭地',
                bonusStats: { attack: 1.4, mp: 1.3 }
            }
        }
    },
    spirit: {
        id: 'spirit',
        name: '通灵',
        icon: '👻',
        description: '以神魂服众，控制辅助',
        baseStats: {
            hp: 100,
            mp: 80,
            attack: 10,
            defense: 7,
            speed: 6
        },
        specializations: {
            summon: {
                id: 'summon',
                name: '驭灵道',
                description: '召唤助战，灵体协攻',
                bonusStats: { attack: 1.3, speed: 1.2 }
            },
            heal: {
                id: 'heal',
                name: '医仙道',
                description: '治疗回复，妙手回春',
                bonusStats: { mp: 1.4, hp: 1.2 }
            }
        }
    }
};

/**
 * 获取职业信息
 */
export function getClass(classId) {
    return CLASSES[classId] || null;
}

/**
 * 获取专精信息
 */
export function getSpecialization(classId, specId) {
    const cls = CLASSES[classId];
    return cls ? cls.specializations[specId] : null;
}

/**
 * 获取所有职业列表
 */
export function getAllClasses() {
    return Object.values(CLASSES);
}
