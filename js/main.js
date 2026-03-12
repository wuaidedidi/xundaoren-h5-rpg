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
import { 
    getItem, 
    useItem, 
    isEquipment, 
    getBlacksmithShopItems, 
    getSellPrice,
    getRepairCost,
    generateDrop
} from './data/items.js';

class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        
        this.renderer = Renderer;
        this.input = InputManager;
        this.storage = Storage;
        
        this.player = null;
        this.world = null;
        this.combat = null;
        this.effects = null;
        this.ui = null;
        
        this.currentSaveId = null;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.settings = {
            quality: 'medium',
            showDamageNumbers: true
        };
        
        this.currentNPC = null;
    }

    async init() {
        console.log('寻道人 - 正在初始化...');
        
        try {
            this.ui = new UIManager(this);
            this.ui.setLoadingProgress(10, '正在初始化存储...');
            
            await this.storage.init();
            this.ui.setLoadingProgress(30, '正在加载设置...');
            
            this.settings = await this.storage.getSettings();
            this.ui.setLoadingProgress(50, '正在初始化渲染器...');
            
            const canvas = document.getElementById('game-canvas');
            this.renderer.init(canvas, this.settings.quality);
            this.ui.setLoadingProgress(70, '正在初始化输入系统...');
            
            this.input.init(canvas);
            this.input.setEnabled(false);
            this.ui.setLoadingProgress(90, '正在完成初始化...');
            
            this.bindUIEvents();
            
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
                        { itemId: "ironSwordRare", count: 1 },
                        { itemId: "clothRobeRare", count: 1 },
                        { itemId: "spiritJade", count: 1 },
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

    async createNewGame(playerName) {
        console.log('创建新游戏:', playerName);
        
        this.player = new Player(playerName);
        
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        const saveData = {
            name: playerName,
            player: this.player.toSaveData()
        };
        this.currentSaveId = await this.storage.saveGame(saveData);
        
        this.startGame();
    }

    async loadGame(saveId) {
        console.log('加载存档:', saveId);
        
        const saveData = await this.storage.getSave(saveId);
        if (!saveData) {
            this.ui.showToast('存档不存在', 'error');
            return;
        }
        
        this.player = new Player();
        this.player.loadFromSaveData(saveData.player);
        
        this.world = new StarterVillage();
        this.world.create(this.renderer.scene);
        
        const playerMesh = this.player.createMesh();
        this.renderer.add(playerMesh);
        
        this.combat = new CombatSystem(this);
        this.combat.init(this.player);
        
        this.effects = new EffectsManager(this.renderer.scene);
        this.combat.setEffectsManager(this.effects);
        
        this.currentSaveId = saveId;
        
        this.startGame();
    }

    async showSaveList() {
        const saves = await this.storage.getAllSaves();
        
        if (saves.length === 0) {
            this.ui.showToast('没有存档', 'info');
            return;
        }
        
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

    async saveSettings(settings) {
        this.settings = settings;
        await this.storage.saveSettings(settings);
        this.renderer.setQuality(settings.quality);
        this.ui.showToast('设置已保存', 'success');
    }

    startGame() {
        this.isRunning = true;
        this.input.setEnabled(true);
        this.ui.showScreen('gameUI');
        
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        this.bindInputEvents();
        
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
        
        this.ui.showToast(`欢迎来到寻道世界，${this.player.name}！`, 'info');
    }

    bindInputEvents() {
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
        
        this.input.on('rightclick', () => {
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        });
        
        this.input.on('keydown', (key) => {
            if (this.ui.isDialogOpen) return;
            
            if (key >= '1' && key <= '7') {
                const skillSlots = document.querySelectorAll('.skill-slot');
                const slot = skillSlots[parseInt(key) - 1];
                if (slot && slot.dataset.skillId) {
                    this.useSkill(slot.dataset.skillId);
                }
            }
        });
    }

    gameLoop(time) {
        if (!this.isRunning) return;
        
        this.deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        const direction = this.input.getMovementDirection();
        
        this.player.update(deltaTime, direction);
        
        this.player.clampPosition(
            this.world.bounds.minX + 1,
            this.world.bounds.maxX - 1,
            this.world.bounds.minZ + 1,
            this.world.bounds.maxZ - 1
        );
        
        this.renderer.updateCamera(this.player.mesh.position);
        
        const monsterAttacks = this.world.update(deltaTime, this.player);
        
        monsterAttacks.forEach(attack => {
            const result = this.combat.processMonsterAttack(attack);
            this.handleCombatResult(result);
        });
        
        const combatResult = this.combat.update(deltaTime);
        if (combatResult) {
            this.handleCombatResult(combatResult);
        }
        
        if (this.effects) {
            this.effects.update(deltaTime);
        }
        
        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        
        if (this.combat.target) {
            this.ui.updateTargetFrame(this.combat.target);
        }
        
        this.autoSaveTimer = (this.autoSaveTimer || 0) + deltaTime;
        if (this.autoSaveTimer >= 60) {
            this.autoSaveTimer = 0;
            this.autoSave();
        }
        
        if (this.player.hp <= 0) {
            this.handlePlayerDeath();
        }
    }

    render() {
        this.renderer.render();
    }

    useSkill(skillId) {
        const result = this.combat.useSkill(skillId);
        
        if (result.success) {
            this.handleCombatResult(result);
        } else {
            this.ui.showToast(result.message, 'warning');
        }
    }

    handleCombatResult(result) {
        if (!result) return;
        
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
        
        if (result.killed) {
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
            
            if (result.gold) {
                this.player.gainGold(result.gold);
                this.ui.showGoldGain(result.gold);
            }
            
            if (result.drops) {
                result.drops.forEach(drop => {
                    const item = getItem(drop.itemId);
                    if (item && this.player.addItem(item, drop.count)) {
                        this.ui.showToast(`获得 ${item.name} x${drop.count}`, 'success');
                    }
                });
            }
            
            if (result.monsterLevel) {
                const equipDrops = generateDrop(result.monsterLevel);
                equipDrops.forEach(drop => {
                    const item = getItem(drop.itemId);
                    if (item && this.player.addItem(item, drop.count)) {
                        this.ui.showToast(`获得装备 ${item.name}！`, 'success');
                    }
                });
            }
            
            this.combat.clearTarget();
            this.ui.updateTargetFrame(null);
        }
    }

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

    handleDialogOption(option) {
        const { action, next } = option;
        
        if (next) {
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
                this.openBlacksmithShop();
                break;
                
            case 'openSell':
                this.ui.hideDialog();
                this.openSellPanel();
                break;
                
            case 'repairEquipment':
                this.ui.hideDialog();
                this.repairEquipment();
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

    openBlacksmithShop() {
        const shopItems = getBlacksmithShopItems();
        
        this.ui.showShop(shopItems, this.player.gold, 'buy', {
            onBuy: (item, index) => {
                this.buyItem(item);
            }
        });
    }

    openSellPanel() {
        this.ui.showSellPanel(this.player, {
            onSell: (item, index) => {
                this.sellItem(item, index);
            }
        });
    }

    buyItem(item) {
        if (this.player.gold < item.price) {
            this.ui.showToast('金币不足！', 'warning');
            return;
        }
        
        if (this.player.inventory.length >= this.player.maxInventory) {
            this.ui.showToast('背包已满！', 'warning');
            return;
        }
        
        this.player.gold -= item.price;
        this.player.addItem(item, 1);
        
        this.ui.showToast(`购买了 ${item.name}`, 'success');
        
        const goldEl = document.querySelector('#shop-player-gold');
        if (goldEl) goldEl.textContent = this.player.gold;
        
        this.ui.updateInventoryPanel(this.player);
        this.ui.updatePlayerHUD(this.player);
    }

    sellItem(item, index) {
        const sellPrice = getSellPrice(item);
        
        if (!item || index < 0 || index >= this.player.inventory.length) {
            this.ui.showToast('出售失败', 'error');
            return;
        }
        
        this.player.gold += sellPrice;
        this.player.removeItem(item.id, 1);
        
        this.ui.showToast(`出售了 ${item.name}，获得 ${sellPrice} 金币`, 'success');
        
        this.openSellPanel();
        
        this.ui.updateInventoryPanel(this.player);
        this.ui.updatePlayerHUD(this.player);
    }

    repairEquipment() {
        const repairCost = getRepairCost(this.player);
        
        if (repairCost === 0) {
            if (this.currentNPC && this.currentNPC.id === 'blacksmith') {
                const dialog = this.currentNPC.getDialog('nothingToRepair', this.player);
                this.ui.showDialog(this.currentNPC, dialog);
            } else {
                this.ui.showToast('没有需要修理的装备', 'info');
            }
            return;
        }
        
        if (this.player.gold < repairCost) {
            if (this.currentNPC && this.currentNPC.id === 'blacksmith') {
                const dialog = this.currentNPC.getDialog('repairFailed', this.player);
                this.ui.showDialog(this.currentNPC, dialog);
            } else {
                this.ui.showToast(`金币不足！需要 ${repairCost} 金币`, 'warning');
            }
            return;
        }
        
        this.player.gold -= repairCost;
        
        if (this.currentNPC && this.currentNPC.id === 'blacksmith') {
            const dialog = this.currentNPC.getDialog('repairSuccess', this.player);
            this.ui.showDialog(this.currentNPC, dialog);
        } else {
            this.ui.showToast(`装备修理完成！花费 ${repairCost} 金币`, 'success');
        }
        
        this.ui.updatePlayerHUD(this.player);
    }

    selectClass(classId) {
        const hadClass = !!this.player.classId;
        if (hadClass) {
            const oldSkills = this.getClassSkillIds(this.player.classId);
            this.player.learnedSkills = this.player.learnedSkills.filter(id => !oldSkills.includes(id));
            this.player.classId = null;
            this.player.specializationId = null;
        }

        this.player.classId = classId;

        const newSkills = this.getClassSkillIds(classId);
        newSkills.forEach(id => {
            if (!this.player.learnedSkills.includes(id)) {
                this.player.learnedSkills.push(id);
            }
        });

        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;

        this.ui.updatePlayerHUD(this.player);
        this.ui.updateSkillBar(this.player);
        this.ui.showToast(hadClass ? '重新转职成功！' : '转职成功！', 'success');
    }

    getClassSkillIds(classId) {
        const map = {
            body: ['ironFist', 'vajraBody', 'earthquake'],
            qi: ['qiBlast', 'thunderStrike', 'spiritShield'],
            spirit: ['paralyze', 'rejuvenate', 'soulFear']
        };
        return map[classId] || [];
    }

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

    handleItemClick(item, index) {
        if (!item) return;

        if (item.type === 'consumable') {
            const result = useItem(item, this.player);
            if (result.success) {
                this.ui.showToast(result.message, 'success');
                this.player.removeItem(item.id, 1);
                this.ui.updateInventoryPanel(this.player);
                this.ui.updatePlayerHUD(this.player);
            } else {
                this.ui.showToast(result.message, 'warning');
            }
        } else if (isEquipment(item)) {
            const result = this.player.equipItem(item, index);
            if (result.success) {
                this.ui.showToast(result.message, 'success');
                this.ui.updateInventoryPanel(this.player);
                this.ui.updatePlayerHUD(this.player);
                this.ui.updateCharacterPanel(this.player);
            } else {
                this.ui.showToast(result.message, 'warning');
            }
        } else {
            this.ui.showToast(item.description, 'info');
        }
    }

    handleEquipmentClick(slotId) {
        const result = this.player.unequipItem(slotId);
        if (result.success) {
            this.ui.showToast(result.message, 'success');
            this.ui.updateInventoryPanel(this.player);
            this.ui.updatePlayerHUD(this.player);
            this.ui.updateCharacterPanel(this.player);
        } else {
            this.ui.showToast(result.message, 'warning');
        }
    }

    handlePlayerDeath() {
        this.ui.showToast('你被击败了！将在原地复活...', 'error');
        
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        this.player.position = { x: 0, y: 0, z: 5 };
        
        if (this.player.mesh) {
            this.player.mesh.position.set(0, 0.9, 5);
        }
        
        this.combat.clearTarget();
        this.ui.updateTargetFrame(null);
    }

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

    async manualSave() {
        await this.autoSave();
        this.ui.showToast('游戏已保存', 'success');
    }

    toggleGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu) {
            const isHidden = gameMenu.classList.contains('hidden');
            gameMenu.classList.toggle('hidden');
            this.isPaused = isHidden;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    
    window.game = game;
});

export default Game;
