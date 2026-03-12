/**
 * 寻道人 - NPC配置
 */

export const NPCS = {
    villageChief: {
        id: 'villageChief',
        name: '村长·云老',
        title: '新手村村长',
        color: 0xffffff,
        size: 1.0,
        position: { x: 0, y: 0, z: -2 },
        glow: true,
        type: 'quest',
        dialogs: {
            default: {
                text: '欢迎来到修仙世界，年轻人。我是这里的村长云老，有什么可以帮助你的？',
                options: [
                    { text: '我该如何变强？', next: 'guide' },
                    { text: '我想转职', action: 'showClass', condition: { minLevel: 10, noClass: true } },
                    { text: '我想重新转职', action: 'showClass', condition: { minLevel: 10, hasClass: true } },
                    { text: '告辞', action: 'close' }
                ]
            },
            guide: {
                text: '修仙之路漫漫，需脚踏实地。先去村子外围击杀一些低级妖兽，积累经验。达到10级后，再来找我选择修炼道路。',
                options: [
                    { text: '明白了', action: 'close' }
                ]
            },
            classComplete: {
                text: '很好！你已经选择了自己的道路。继续修炼吧！',
                options: [
                    { text: '谢谢指点', action: 'close' }
                ]
            }
        }
    },
    blacksmith: {
        id: 'blacksmith',
        name: '铁匠·王大锤',
        title: '铸造大师',
        color: 0xffa500,
        size: 1.1,
        position: { x: -10, y: 0, z: 5 },
        type: 'craft',
        dialogs: {
            default: {
                text: '哈哈！来找我打造装备吗？可惜现在材料不够，等你收集够了再来吧！',
                options: [
                    { text: '好的', action: 'close' }
                ]
            }
        }
    },
    trainer: {
        id: 'trainer',
        name: '修炼指导·青衣',
        title: '技能师傅',
        color: 0x0088ff,
        size: 0.95,
        position: { x: 10, y: 0, z: 5 },
        type: 'trainer',
        dialogs: {
            default: {
                text: '修炼之道，在于精进技艺。我可以教你一些基础功法。',
                options: [
                    { text: '学习擒龙功', action: 'learnDragonGrip' },
                    { text: '询问境界突破', next: 'realm' },
                    { text: '告辞', action: 'close' }
                ]
            },
            realm: {
                text: '境界突破需要足够的修为（等级）和悟性。每突破一个大境界，实力都会有质的提升。',
                options: [
                    { text: '明白了', action: 'close' }
                ]
            }
        }
    },
    guard: {
        id: 'guard',
        name: '守卫·李猛',
        title: '村庄守卫',
        color: 0xff0000,
        size: 1.05,
        position: { x: -5, y: 0, z: -5 },
        type: 'quest',
        dialogs: {
            default: {
                text: '站住！你是新来的修士吧？想要出村冒险，先让我看看你的实力！',
                options: [
                    { text: '接受战斗教学', action: 'startTutorial' },
                    { text: '我已经会战斗了', action: 'close' }
                ]
            },
            afterTutorial: {
                text: '不错不错！你已经掌握了基本战斗技巧，可以出去历练了。小心那些妖兽！',
                options: [
                    { text: '谢谢', action: 'close' }
                ]
            }
        }
    }
};

/**
 * 获取NPC信息
 */
export function getNPC(npcId) {
    return NPCS[npcId] || null;
}

/**
 * 获取所有NPC列表
 */
export function getAllNPCs() {
    return Object.values(NPCS);
}

/**
 * 获取可见的NPC（排除隐藏NPC）
 */
export function getVisibleNPCs() {
    return Object.values(NPCS).filter(npc => !npc.hidden);
}
