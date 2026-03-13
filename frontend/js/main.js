/**
 * 寻道人 - 游戏主类
 * 整合所有模块的核心入口
 */

import Renderer from './core/Renderer.js';
import InputManager from './core/InputManager.js';
import Storage from './core/Storage.js';
import Player from './entities/Player.js';
import StarterVillage from './world/StarterVillage.js';
import CombatSystem from './systems/Combat.js';
import EffectsManager from './systems/EffectsManager.js';
import UIManager from './ui/UIManager.js';
import { getItem, useItem } from './data/items.js';

class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        
        // 核心组件
        this.renderer = Renderer;
        this.input = InputManager;
        this.storage = Storage;
        
        // 游戏对象
        this.player = null;
        this.world = null;
        this.combat = null;
        this.effects = null;
        this.ui = null;
        
        // 当前存档
        this.currentSaveId = null;
        
        // 时间追踪
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // 设置
        this.settings = {
            quality: 'medium',
            showDamageNumbers: true
        };
        
        // 当前交互NPC
        this.currentNPC = null;
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('寻道人 - 正在初始化...');
        
        try {
            // 初始化UI
            this.ui = new UIManager(this);
            this.ui.setLoadingProgress(10, '正在初始化存储...');
            
            // 初始化存储
            await this.storage.init();
            this.ui.setLoadingProgress(30, '正在加载设置...');
            
            // 加载设置
            this.settings = await this.storage.getSettings();
            this.ui.setLoadingProgress(50, '正在初始化渲染器...');
            
            // 初始化渲染器
            const canvas = document.getElementById('game-canvas');
            this.renderer.init(canvas, this.settings.quality);
            this.ui.setLoadingProgress(70, '正在初始化输入系统...');
            
            // 初始化输入
            this.input.init(canvas);
            this.input.setEnabled(false);
            this.ui.setLoadingProgress(90, '正在完成初始化...');
            
            // 绑定UI事件
            this.bindUIEvents();
            
            // 完成加载
            this.ui.setLoadingProgress(100, '加载完成！');
            
            setTimeout(() => {
                this.ui.showScreen('mainMenu');
            }, 500);
            
            console.log('寻道人 - 初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.ui.showToast('游戏初始化失败', 'error');
        }
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        this.ui.bindMenuEvents({
            onContinue: () => this.showSaveList(),
            onCreateCharacter: (name) => this.createNewGame(name),
            onSaveSettings: (settings) => this.saveSettings(settings)
        });
        
        this.ui.bindGameUIEvents({
            onSkillUse: (skillId) => this.useSkill(skillId),
            onDialogOption: (option) => this.handleDialogOption(option),
            onPanelOpen: (panel) => this.handlePanelOpen(panel),
            onSave: () => this.manualSave(),
            onMenu: () => this.toggleGameMenu()
        });
        
        // [DEBUG] F8 快速生成81级测试存档
        window.addEventListener('keydown', async (e) => {
            if (e.key === 'F8') {
                console.log('正在生成测试存档...');
                this.ui.showToast('正在生成测试存档...', 'info');

                const playerData = {
                    name: "测试天尊",
                    level: 81,
                    exp: 0,
                    gold: 999999,
                    classId: "body",
                    specializationId: null,
                    baseHp: 16000,
                    baseMp: 4000,
                    baseAttack: 2000,
                    baseDefense: 1500,
                    baseSpeed: 10,
                    hp: 99999,
                    mp: 99999,
                    position: { x: 0, y: 0, z: 5 },
                    rotation: 0,
                    inventory: [
                        { itemId: "hpPotion", count: 99 },
                        { itemId: "mpPotion", count: 99 },
                        { itemId: "woodCore", count: 99 },
                        { itemId: "stoneChunk", count: 99 }
                    ],
                    equipment: {
                        weapon: null,
                        armor: null,
                        accessory: null
                    },
                    learnedSkills: ["punch", "breathe", "dodge", "charge", "ironFist", "vajraBody", "earthquake"],
                    skillCooldowns: {},
                    quests: [],
                    completedQuests: [],
                    tutorialComplete: true,
                    foundMysteriousElder: false
                };

                const saveData = {
                    name: "测试天尊",
                    player: playerData
                };

                await this.storage.saveGame(saveData);
                this.ui.showToast('测试存档已生成！请刷新页面读取', 'success');
                console.log('测试存档已生成');
            }
        });
    }

    /**
     * 创建新游戏
     */
    async createNewGame(playerName) {
        console.log('创建新游戏:', playerName);
        
        // 创建玩家
        this.player = new Player(playerName);
        
        // 创建世界
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        // 创建玩家模型
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        // 初始化战斗系统
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        // 初始化效果管理器
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        // 保存初始存档
        const saveData = {
            name: playerName,
            player: this.player.toSaveData()
        };
        this.currentSaveId = await this.storage.saveGame(saveData);
        
        // 启动游戏
        this.startGame();
    }

    /**
     * 加载存档
     */
    async loadGame(saveId) {
        console.log('加载存档:', saveId);
        
        const saveData = await this.storage.getSave(saveId);
        if (!saveData) {
            this.ui.showToast('存档不存在', 'error');
            return;
        }
        
        // 创建玩家
        this.player = new Player();
        this.player.loadFromSaveData(saveData.player);
        
        // 创建世界
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        // 创建玩家模型
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        // 初始化战斗系统
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        // 初始化效果管理器
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        this.currentSaveId = saveId;
        
        // 启动游戏
        this.startGame();
    }

    /**
     * 显示存档列表
     */
    async showSaveList() {
        const saves = await this.storage.getAllSaves();
        
        if (saves.length === 0) {
            this.ui.showToast('没有存档', 'info');
            return;
        }
        
        // 显示存档列表界面
        const container = document.querySelector('.saves-container');
        if (container) {
            container.innerHTML = '';
            
            saves.forEach(save => {
                const div = document.createElement('div');
                div.className = 'save-item';
                div.dataset.saveId = save.id;
                
                const player = save.player;
                const date = new Date(save.updateTime).toLocaleString();
                
                div.innerHTML = `
                    <div class="save-info">
                        <span class="save-name">${player.name}</span>
                        <span class="save-level">Lv.${player.level}</span>
                    </div>
                    <div class="save-date">${date}</div>
                    <button class="delete-save-btn" data-save-id="${save.id}">删除</button>
                `;
                
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-save-btn')) {
                        this.loadGame(save.id);
                    }
                });
                
                container.appendChild(div);
            });
            
            // 删除按钮事件
            container.querySelectorAll('.delete-save-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const saveId = parseInt(btn.dataset.saveId);
                    await this.storage.deleteSave(saveId);
                    this.ui.showToast('存档已删除', 'info');
                    this.showSaveList();
                });
            });
        }
        
        this.ui.showScreen('saveList');
    }

    /**
     * 保存设置
     */
    async saveSettings(settings) {
        this.settings = settings;
        await this.storage.saveSettings(settings);
        this.renderer.setQuality(settings.quality);
        this.ui.showToast('设置已保存', 'success');
    }

    /**
     * 启动游戏循环
     */
    startGame() {
        this.isRunning = true;
        this.input.setEnabled(true);
        this.ui.showScreen('gameUI');
        
        // 初始化UI
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        // 绑定输入事件
        this.bindInputEvents();
        
        // 开始游戏循环
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
        
        this.ui.showToast(`欢迎来到寻道世界，${this.player.name}！`, 'info');
    }

    /**
     * 绑定输入事件
     */
    bindInputEvents() {
        // 鼠标点击选中目标
        this.input.on('click', (mouse, event) => {
            if (this.ui.isDialogOpen) return;
            
            const intersects = this.renderer.raycast(
                { x: mouse.x, y: mouse.y },
                this.world.getSelectableObjects()
            );
            
            if (intersects.length > 0) {
                const hit = intersects[0].object;
                const entity = hit.userData.entity;
                
                if (entity) {
                    if (hit.userData.type === 'monster' && !entity.isDead) {
                        this.combat.setTarget(entity);
                        this.ui.updateTargetFrame(entity);
                    } else if (hit.userData.type === 'npc') {
                        this.interactWithNPC(entity);
                    }
                }
            } else {
                this.combat.clearTarget();
                this.ui.updateTargetFrame(null);
            }
        });
        
        // 右键丢弃目标
        this.input.on('rightclick', () => {
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        });
        
        // 技能快捷键
        this.input.on('keydown', (key) => {
            if (this.ui.isDialogOpen) return;
            
            // 数字键使用技能
            if (key >= '1' && key <= '7') {
                const skillSlots = document.querySelectorAll('.skill-slot');
                const slot = skillSlots[parseInt(key) - 1];
                if (slot && slot.dataset.skillId) {
                    this.useSkill(slot.dataset.skillId);
                }
            }
        });
    }

    /**
     * 游戏主循环
     */
    gameLoop(time) {
        if (!this.isRunning) return;
        
        // 计算deltaTime
        this.deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // 限制deltaTime防止卡顿
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * 更新游戏状态
     */
    update(deltaTime) {
        // 获取移动输入
        const direction = this.input.getMovementDirection();
        
        // 更新玩家
        this.player.update(deltaTime, direction);
        
        // 边界限制
        this.player.clampPosition(
            this.world.bounds.minX + 1,
            this.world.bounds.maxX - 1,
            this.world.bounds.minZ + 1,
            this.world.bounds.maxZ - 1
        );
        
        // 更新相机
        this.renderer.updateCamera(this.player.mesh.position);
        
        // 更新世界和获取怪物攻击
        const monsterAttacks = this.world.update(deltaTime, this.player);
        
        // 处理怪物攻击
        monsterAttacks.forEach(attack => {
            const result = this.combat.processMonsterAttack(attack);
            this.handleCombatResult(result);
        });
        
        // 更新战斗系统
        const combatResult = this.combat.update(deltaTime);
        if (combatResult) {
            this.handleCombatResult(combatResult);
        }
        
        // 更新视觉效果
        if (this.effects) {
            this.effects.update(deltaTime);
        }
        
        // 更新UI
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        // 更新目标框
        if (this.combat.target) {
            this.ui.updateTargetFrame(this.combat.target);
        }
        
        // 自动保存（每60秒）
        this.autoSaveTimer = (this.autoSaveTimer || 0) + deltaTime;
        if (this.autoSaveTimer >= 60) {
            this.autoSaveTimer = 0;
            this.autoSave();
        }
        
        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.handlePlayerDeath();
        }
    }

    /**
     * 渲染
     */
    render() {
        this.renderer.render();
    }

    /**
     * 使用技能
     */
    useSkill(skillId) {
        const result = this.combat.useSkill(skillId);
        
        if (result.success) {
            this.handleCombatResult(result);
        } else {
            this.ui.showToast(result.message, 'warning');
        }
    }

    /**
     * 处理战斗结果
     */
    handleCombatResult(result) {
        if (!result) return;
        
        // 显示伤害数字
        if (result.type === 'damage' && this.settings.showDamageNumbers) {
            let screenPos;
            
            if (result.source === 'player' && result.target) {
                screenPos = this.renderer.worldToScreen(result.target.mesh.position);
            } else if (result.source === 'monster') {
                screenPos = this.renderer.worldToScreen(this.player.mesh.position);
            }
            
            if (screenPos) {
                this.ui.showDamageNumber(screenPos.x, screenPos.y, result.damage, result.source === 'monster');
            }
        }
        
        // 击杀奖励
        if (result.killed) {
            // 经验
            if (result.exp) {
                const expResults = this.player.gainExp(result.exp);
                this.ui.showExpGain(result.exp);
                
                expResults.forEach(r => {
                    if (r.type === 'levelUp') {
                        this.ui.showLevelUp(r.level);
                    } else if (r.type === 'realmUp') {
                        this.ui.showRealmUp(r.realm);
                    }
                });
            }
            
            // 金币
            if (result.gold) {
                this.player.gainGold(result.gold);
                this.ui.showGoldGain(result.gold);
            }
            
            // 掉落物品
            if (result.drops) {
                result.drops.forEach(drop => {
                    const item = getItem(drop.itemId);
                    if (item && this.player.addItem(item, drop.count)) {
                        this.ui.showToast(`获得 ${item.name} x${drop.count}`, 'success');
                    }
                });
            }
            
            // 清除目标
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        }
    }

    /**
     * 与NPC交互
     */
    interactWithNPC(npc) {
        if (!npc.canInteract(this.player.position)) {
            this.ui.showToast('距离太远了', 'warning');
            return;
        }
        
        this.currentNPC = npc;
        npc.lookAtPlayer(this.player.position);
        
        const dialog = npc.getDialog(null, this.player);
        this.ui.showDialog(npc, dialog);
    }

    /**
     * 处理对话选项
     */
    handleDialogOption(option) {
        const { action, next } = option;
        
        if (next) {
            // 跳转到下一段对话
            const dialog = this.currentNPC.getDialog(next, this.player);
            this.ui.showDialog(this.currentNPC, dialog);
            return;
        }
        
        switch (action) {
            case 'close':
                this.ui.hideDialog();
                this.currentNPC = null;
                break;
                
            case 'showClass':
                this.ui.hideDialog();
                this.ui.showClassSelection((classId) => {
                    this.selectClass(classId);
                });
                break;
                
            case 'openShop':
                this.ui.hideDialog();
                this.ui.showToast('商店功能开发中...', 'info');
                break;
                
            case 'openSkills':
                this.ui.hideDialog();
                this.ui.togglePanel('skillsPanel');
                break;
                
            case 'startTutorial':
                this.ui.hideDialog();
                this.ui.showToast('战斗教程：用1-4键释放技能，点击怪物攻击', 'info');
                this.player.tutorialComplete = true;
                break;

            case 'learnDragonGrip':
                if (this.player.learnedSkills.includes('dragonGrip')) {
                    this.ui.showToast('你已经学会擒龙功了', 'warning');
                } else {
                    this.player.learnedSkills.push('dragonGrip');
                    this.player.baseHp += 50;
                    this.player.hp = this.player.maxHp;
                    this.ui.updatePlayerHUD(this.player);
                    this.ui.showToast('学会了擒龙功！基础生命值+50', 'success');
                }
                this.ui.hideDialog();
                break;

            case 'giveGift':
                this.player.gainGold(100);
                this.player.foundMysteriousElder = true;
                this.ui.showToast('神秘老者赠予你100金币！', 'success');
                this.currentNPC.setDialog('afterGift');
                const dialog = this.currentNPC.getDialog('afterGift', this.player);
                this.ui.showDialog(this.currentNPC, dialog);
                break;
                
            default:
                this.ui.hideDialog();
        }
    }

    /**
     * 选择/重新选择职业
     */
    selectClass(classId) {
        const hadClass = !!this.player.classId;
        if (hadClass) {
            // 移除旧职业技能
            const oldSkills = this.getClassSkillIds(this.player.classId);
            this.player.learnedSkills = this.player.learnedSkills.filter(id => !oldSkills.includes(id));
            this.player.classId = null;
            this.player.specializationId = null;
        }

        this.player.classId = classId;

        // 学习新职业技能
        const newSkills = this.getClassSkillIds(classId);
        newSkills.forEach(id => {
            if (!this.player.learnedSkills.includes(id)) {
                this.player.learnedSkills.push(id);
            }
        });

        // 更新属性
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;

        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        this.ui.showToast(hadClass ? '重新转职成功！' : '转职成功！', 'success');
    }

    /**
     * 获取职业技能ID列表
     */
    getClassSkillIds(classId) {
        // 硬编码映射，避免异步问题
        const map = {
            body: ['ironFist', 'vajraBody', 'earthquake'],
            qi: ['qiBlast', 'thunderStrike', 'spiritShield'],
            spirit: ['paralyze', 'rejuvenate', 'soulFear']
        };
        return map[classId] || [];
    }

    /**
     * 面板打开回调
     */
    handlePanelOpen(panel) {
        if (panel === 'character') {
            this.ui.updateCharacterPanel(this.player);
        } else if (panel === 'inventory') {
            this.ui.updateInventoryPanel(this.player);
        } else if (panel === 'skills') {
            this.ui.updateSkillsPanel(this.player);
        } else if (panel === 'quest') {
            this.ui.updateQuestLog(this.player);
        }
    }

    /**
     * 处理物品点击
     */
    handleItemClick(item, index) {
        if (!item) return;

        // 使用物品逻辑
        if (item.type === 'consumable') {
             const result = useItem(item, this.player);
             if (result.success) {
                 this.ui.showToast(result.message, 'success');
                 // 减少数量或移除
                 if (item.stackable && item.count > 1) {
                     item.count--;
                 } else {
                     this.player.inventory[index] = null;
                 }
                 this.ui.updateInventoryPanel(this.player);
                 this.ui.updatePlayerHUD(this.player);
             } else {
                 this.ui.showToast(result.message, 'warning'); // 例如满血时
             }
        } else {
            // 其他物品显示描述
            this.ui.showToast(item.description, 'info');
        }
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDeath() {
        this.ui.showToast('你被击败了！将在原地复活...', 'error');
        
        // 复活
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        this.player.position = { x: 0, y: 0, z: 5 };
        
        if (this.player.mesh) {
            this.player.mesh.position.set(0, 0.9, 5);
        }
        
        this.combat.clearTarget();
        this.ui.updateTargetFrame(null);
    }

    /**
     * 自动保存
     */
    async autoSave() {
        if (!this.currentSaveId) return;
        
        try {
            await this.storage.saveGame({
                id: this.currentSaveId,
                name: this.player.name,
                player: this.player.toSaveData()
            });
            console.log('自动保存完成');
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }

    /**
     * 手动保存
     */
    async manualSave() {
        await this.autoSave();
        this.ui.showToast('游戏已保存', 'success');
    }

    /**
     * 切换游戏菜单
     */
    toggleGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu) {
            const isHidden = gameMenu.classList.contains('hidden');
            gameMenu.classList.toggle('hidden');
            this.isPaused = isHidden;
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    
    // 暴露到全局以便调试
    window.game = game;
});

export default Game;
