/**
 * 寻道人 - 境界配置
 */

export const REALMS = [
    { level: 0, name: '凡人', bonus: 0, description: '初入修仙，一介凡人' },
    { level: 1, name: '炼气期', bonus: 0.1, description: '初窥门径，开始感应天地灵气' },
    { level: 10, name: '筑基期', bonus: 0.25, description: '筑牢根基，可选择修炼道路', unlock: 'class' },
    { level: 19, name: '金丹期', bonus: 0.45, description: '凝聚金丹，修为大进' },
    { level: 28, name: '元婴期', bonus: 0.70, description: '元婴出窍，神识大增', unlock: 'specialization' },
    { level: 37, name: '化神期', bonus: 1.00, description: '化神归一，法力充沛' },
    { level: 46, name: '炼虚期', bonus: 1.40, description: '炼虚合道，虚实莫辨' },
    { level: 55, name: '合体期', bonus: 1.90, description: '天人合一，力量暴增' },
    { level: 64, name: '大乘期', bonus: 2.50, description: '大乘圆满，渡劫在即' },
    { level: 73, name: '渡劫期', bonus: 3.20, description: '天劫将至，成败在此一举' },
    { level: 81, name: '大罗金仙', bonus: 4.00, description: '超凡入圣，永恒不灭' }
];

/**
 * 根据等级获取境界
 */
export function getRealmByLevel(level) {
    let realm = REALMS[0];
    for (const r of REALMS) {
        if (level >= r.level) {
            realm = r;
        } else {
            break;
        }
    }
    return realm;
}

/**
 * 获取升级所需经验
 */
export function getExpRequired(level) {
    return level * 100 + 50;
}

/**
 * 获取境界属性加成
 */
export function getRealmBonus(level) {
    const realm = getRealmByLevel(level);
    return 1 + realm.bonus;
}
