/**
 * 寻道人 - UI管理器
 * 处理所有UI交互和显示
 */

import { getRealmByLevel, getExpRequired } from '../data/realms.js';
import { getClass, getAllClasses } from '../data/classes.js';
import { getBaseSkills, getClassSkills } from '../data/skills.js';
import { getItem } from '../data/items.js';

export default class UIManager {
    constructor(game) {
        this.game = game;
        
        // 缓存DOM元素
        this.elements = {};
        this.initElements();
        
        // UI状态
        this.currentScreen = 'loading';
        this.isDialogOpen = false;
    }

    /**
     * 初始化DOM元素引用
     */
    initElements() {
        // 屏幕
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.mainMenu = document.getElementById('main-menu');
        this.elements.characterCreation = document.getElementById('create-character');
        this.elements.saveList = document.getElementById('save-list');
        this.elements.settingsPanel = document.getElementById('settings-panel');
        this.elements.gameUI = document.getElementById('game-ui');
        
        // 加载相关
        this.elements.loadingProgress = document.getElementById('loading-progress');
        this.elements.loadingText = document.getElementById('loading-text');
        
        // 角色创建
        this.elements.characterNameInput = document.getElementById('character-name-input');
        
        // HUD元素
        this.elements.playerName = document.getElementById('player-name');
        this.elements.playerLevel = document.getElementById('player-level');
        this.elements.playerRealm = document.getElementById('player-realm');
        this.elements.hpFill = document.getElementById('hp-fill');
        this.elements.hpText = document.getElementById('hp-text');
        this.elements.mpFill = document.getElementById('mp-fill');
        this.elements.mpText = document.getElementById('mp-text');
        this.elements.expFill = document.getElementById('exp-fill');
        this.elements.expText = document.getElementById('exp-text');
        
        // 目标框
        this.elements.targetFrame = document.getElementById('target-frame');
        this.elements.targetName = document.getElementById('target-name');
        this.elements.targetLevel = document.getElementById('target-level');
        this.elements.targetHpFill = document.getElementById('target-hp-fill');
        this.elements.targetHpText = document.getElementById('target-hp-text');
        
        // 技能栏
        this.elements.skillBar = document.querySelector('.skill-bar');
        this.elements.skillSlots = document.querySelectorAll('.skill-slot');
        
        // 面板
        this.elements.characterPanel = document.getElementById('character-panel');
        this.elements.inventoryPanel = document.getElementById('inventory-panel');
        this.elements.skillsPanel = document.getElementById('skills-panel');
        this.elements.questLog = document.getElementById('quests-panel');
        
        // 对话系统
        this.elements.dialogPanel = document.getElementById('dialog-box');
        this.elements.dialogNpcName = document.getElementById('dialog-speaker');
        this.elements.dialogText = document.getElementById('dialog-content');
        this.elements.dialogOptions = document.getElementById('dialog-options');
        
        // 设置
        this.elements.qualitySelect = document.getElementById('quality-select');
        this.elements.damageNumbersCheck = document.getElementById('damage-numbers-check');
        
        // Toast
        this.elements.toastContainer = document.getElementById('toast-container');
    }

    /**
     * 设置加载进度
     */
    setLoadingProgress(percent, text) {
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = `${percent}%`;
        }
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    }

    /**
     * 显示指定屏幕
     */
    showScreen(screenId) {
        // 隐藏所有屏幕
        const screens = ['loadingScreen', 'mainMenu', 'characterCreation', 
                         'saveList', 'settingsPanel', 'gameUI'];
        
        screens.forEach(screen => {
            if (this.elements[screen]) {
                this.elements[screen].classList.add('hidden');
            }
        });
        
        // 显示目标屏幕
        const screenElement = this.elements[screenId];
        if (screenElement) {
            screenElement.classList.remove('hidden');
        }
        
        this.currentScreen = screenId;
    }

    /**
     * 更新玩家HUD
     */
    updatePlayerHUD(player) {
        if (!player) return;
        
        const realm = getRealmByLevel(player.level);
        const expRequired = getExpRequired(player.level);
        
        // 基本信息
        this.elements.playerName.textContent = player.name;
        this.elements.playerLevel.textContent = `Lv.${player.level}`;
        this.elements.playerRealm.textContent = realm.name;
        
        // 生命值
        const hpPercent = (player.hp / player.maxHp) * 100;
        this.elements.hpFill.style.width = `${hpPercent}%`;
        this.elements.hpText.textContent = `${Math.floor(player.hp)} / ${player.maxHp}`;
        
        // 法力值
        const mpPercent = (player.mp / player.maxMp) * 100;
        this.elements.mpFill.style.width = `${mpPercent}%`;
        this.elements.mpText.textContent = `${Math.floor(player.mp)} / ${player.maxMp}`;
        
        // 经验值
        const expPercent = player.level >= 81 ? 100 : (player.exp / expRequired) * 100;
        this.elements.expFill.style.width = `${expPercent}%`;
        this.elements.expText.textContent = player.level >= 81 ? 'MAX' : `${player.exp} / ${expRequired}`;
    }

    /**
     * 更新目标框
     */
    updateTargetFrame(target) {
        if (!this.elements.targetFrame) return;
        
        if (!target) {
            this.elements.targetFrame.classList.add('hidden');
            return;
        }
        
        this.elements.targetFrame.classList.remove('hidden');
        if (this.elements.targetName) this.elements.targetName.textContent = target.name;
        if (this.elements.targetLevel) this.elements.targetLevel.textContent = `Lv.${target.level}`;
        
        const hpPercent = (target.hp / target.maxHp) * 100;
        if (this.elements.targetHpFill) this.elements.targetHpFill.style.width = `${hpPercent}%`;
        if (this.elements.targetHpText) this.elements.targetHpText.textContent = `${Math.floor(target.hp)} / ${target.maxHp}`;
    }

    /**
     * 更新技能栏
     */
    updateSkillBar(player) {
        const skills = getBaseSkills();
        if (player.classId) {
            skills.push(...getClassSkills(player.classId));
        }
        
        this.elements.skillSlots.forEach((slot, index) => {
            const skill = skills[index];
            const iconEl = slot.querySelector('.skill-icon');
            const keyEl = slot.querySelector('.skill-key');
            const nameEl = slot.querySelector('.skill-name');
            const cooldownEl = slot.querySelector('.skill-cooldown');
            
            if (skill) {
                slot.classList.remove('locked');
                if (iconEl) iconEl.textContent = skill.icon || '';
                if (keyEl) keyEl.textContent = skill.key || (index + 1);
                if (nameEl) nameEl.textContent = skill.name || '';
                
                // 状态检查
                let onCooldown = false;
                let noMp = false;

                // 冷却显示
                const cooldown = player.skillCooldowns[skill.id];
                if (cooldownEl) {
                    if (cooldown && cooldown > 0) {
                        onCooldown = true;
                        cooldownEl.classList.remove('hidden');
                        const seconds = Math.ceil(cooldown / 1000);
                        cooldownEl.textContent = seconds;
                        
                        // 动态遮罩高度 (新功能：倒计时效果)
                        const totalCd = skill.cooldown * 1000;
                        const percent = (cooldown / totalCd) * 100;
                        // 使用CSS变量或直接修改样式来做遮罩动画，这里简单用高度控制
                        // 但由于cooldownEl是覆盖层，我们可以用clip-path
                        // 或者简单地给slot加样式
                        slot.style.setProperty('--cd-percent', `${percent}%`);
                    } else {
                        cooldownEl.classList.add('hidden');
                        slot.style.removeProperty('--cd-percent');
                    }
                }
                
                // MP检查
                if (player.mp < skill.mpCost) {
                    noMp = true;
                }

                // 应用样式状态
                if (onCooldown) {
                    slot.classList.add('on-cooldown');
                    slot.classList.remove('no-mp');
                } else if (noMp) {
                    slot.classList.add('no-mp');
                    slot.classList.remove('on-cooldown');
                } else {
                    slot.classList.remove('on-cooldown');
                    slot.classList.remove('no-mp');
                }
                
                slot.dataset.skillId = skill.id;
            } else {
                slot.classList.add('locked');
                if (iconEl) iconEl.textContent = '';
                if (keyEl) keyEl.textContent = index + 1;
                if (nameEl) nameEl.textContent = '-';
                if (cooldownEl) cooldownEl.classList.add('hidden');
                slot.classList.remove('on-cooldown', 'no-mp');
                delete slot.dataset.skillId;
            }
        });
    }

    /**
     * 显示NPC对话
     */
    showDialog(npc, dialog) {
        this.isDialogOpen = true;
        this.elements.dialogPanel.classList.remove('hidden');
        this.elements.dialogNpcName.textContent = npc.name;
        this.elements.dialogText.textContent = dialog.text;
        
        // 清空并创建选项
        this.elements.dialogOptions.innerHTML = '';
        
        dialog.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'dialog-option';
            btn.textContent = option.text;
            btn.dataset.index = index;
            btn.dataset.action = option.action || '';
            btn.dataset.next = option.next || '';
            this.elements.dialogOptions.appendChild(btn);
        });
    }

    /**
     * 隐藏对话
     */
    hideDialog() {
        this.isDialogOpen = false;
        this.elements.dialogPanel.classList.add('hidden');
    }

    /**
     * 显示职业选择
     */
    showClassSelection(onSelect) {
        const panel = document.getElementById('class-panel');
        if (!panel) return;

        // 绑定选择按钮点击事件
        panel.querySelectorAll('.class-select-btn').forEach(btn => {
            const option = btn.closest('.class-option');
            if (!option) return;
            const classId = option.dataset.class;
            // 克隆替换，清除旧事件
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                if (onSelect) onSelect(classId);
                panel.classList.add('hidden');
            });
        });

        panel.classList.remove('hidden');
    }

    /**
     * 显示Toast通知
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        // 动画进入
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 自动消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * 显示伤害数字
     */
    showDamageNumber(x, y, damage, isPlayer = false) {
        const num = document.createElement('div');
        num.className = `damage-number ${isPlayer ? 'damage-taken' : 'damage-dealt'}`;
        num.textContent = `-${damage}`;
        num.style.left = `${x}px`;
        num.style.top = `${y}px`;
        
        document.body.appendChild(num);
        
        // 动画结束后移除
        setTimeout(() => num.remove(), 1000);
    }

    /**
     * 显示经验获得
     */
    showExpGain(exp) {
        this.showToast(`获得 ${exp} 经验值`, 'success');
    }

    /**
     * 显示金币获得
     */
    showGoldGain(gold) {
        this.showToast(`获得 ${gold} 金币`, 'success');
    }

    /**
     * 显示升级
     */
    showLevelUp(level) {
        this.showToast(`升级了！当前等级: ${level}`, 'success', 5000);
    }

    /**
     * 显示境界突破
     */
    showRealmUp(realmName) {
        this.showToast(`境界突破！${realmName}`, 'success', 5000);
    }

    /**
     * 切换面板显示
     */
    togglePanel(panelId) {
        const panel = this.elements[panelId];
        if (!panel) return;
        
        const isHidden = panel.classList.contains('hidden');
        
        // 关闭其他面板
        ['characterPanel', 'inventoryPanel', 'skillsPanel', 'questLog'].forEach(id => {
            if (this.elements[id] && id !== panelId) {
                this.elements[id].classList.add('hidden');
            }
        });
        
        // 切换当前面板
        if (isHidden) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }

    /**
     * 关闭所有面板
     */
    closeAllPanels() {
        ['characterPanel', 'inventoryPanel', 'skillsPanel', 'questLog'].forEach(id => {
            if (this.elements[id]) {
                this.elements[id].classList.add('hidden');
            }
        });
        this.hideDialog();
    }

    /**
     * 更新角色面板
     */
    updateCharacterPanel(player) {
        const content = this.elements.characterPanel?.querySelector('.panel-content');
        if (!content) return;
        
        const cls = player.classId ? getClass(player.classId) : null;
        
        content.innerHTML = `
            <div class="stat-row"><span>姓名</span><span>${player.name}</span></div>
            <div class="stat-row"><span>等级</span><span>${player.level}</span></div>
            <div class="stat-row"><span>境界</span><span>${player.realm.name}</span></div>
            <div class="stat-row"><span>职业</span><span>${cls ? cls.name : '未选择'}</span></div>
            <div class="stat-row"><span>攻击力</span><span>${player.attack}</span></div>
            <div class="stat-row"><span>防御力</span><span>${player.defense}</span></div>
            <div class="stat-row"><span>移动速度</span><span>${player.speed}</span></div>
            <div class="stat-row"><span>金币</span><span>${player.gold}</span></div>
        `;
    }

    /**
     * 更新背包面板
     */
    updateInventoryPanel(player) {
        if (this.elements.inventoryPanel) {
            // 更新金币
            const goldEl = this.elements.inventoryPanel.querySelector('#player-gold');
            if (goldEl) goldEl.textContent = player.gold;
            
            // 更新物品网格
            const grid = this.elements.inventoryPanel.querySelector('#inventory-grid');
            if (grid) {
                grid.innerHTML = '';
                
                // 填充背包（假设最大24格）
                for (let i = 0; i < 24; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'inventory-slot';
                    
                    // Inventory items are stored as { itemId: 'id', count: N }
                    const invItem = player.inventory[i];
                    if (invItem) {
                        // Resolve full item data
                        const itemData = getItem(invItem.itemId);
                        
                        if (itemData) {
                            // Merge count into item data for display/usage
                            const displayItem = { ...itemData, count: invItem.count };
                            
                            slot.dataset.itemId = displayItem.id;
                            slot.dataset.index = i;
                            slot.innerHTML = `
                                <div class="item-icon">${displayItem.icon}</div>
                                <div class="item-count">${displayItem.count > 1 ? displayItem.count : ''}</div>
                                <div class="item-tooltip">
                                    <div class="item-name">${displayItem.name}</div>
                                    <div class="item-desc">${displayItem.description}</div>
                                </div>
                            `;
                            
                            // 绑定点击事件（使用/装备）
                            slot.addEventListener('click', () => {
                                if (this.game && this.game.handleItemClick) {
                                    this.game.handleItemClick(displayItem, i);
                                }
                            });
                        }
                    }
                    
                    grid.appendChild(slot);
                }
            }
        }
    }

    /**
     * 更新技能面板
     */
    updateSkillsPanel(player) {
        const content = this.elements.skillsPanel?.querySelector('#skills-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        if (!player.learnedSkills || player.learnedSkills.length === 0) {
            content.innerHTML = '<div class="no-data">暂无习得技能</div>';
            return;
        }
        
        // 导入getSkill (需要在文件顶部导入，或者假设已导入)
        // 由于这里不能方便地修改顶部导入，我们假设getSkill可用或通过player获取详细信息
        // 实际上Player.js没有存储详细信息，只存储ID。
        // 我们需要依赖外部传入skill数据，或者在UIManager中访问skills数据
        // 检查文件顶部引用：import { getBaseSkills, getClassSkills } from '../data/skills.js';
        // 还需要 getSkill。
        // 我们可以遍历 player.learnedSkills ID列表，然后查找。
        
        // 由于我们无法直接调用 getSkill (除非添加到顶部import)，
        // 我们暂时只通过 player.learnedSkills 查找。
        // 为了方便，我们可以从 getBaseSkills 和 getClassSkills 结果中查找。
        
        // 创建一个临时查找表
        const allSkills = {};
        getBaseSkills().forEach(s => allSkills[s.id] = s);
        if (player.classId) {
            getClassSkills(player.classId).forEach(s => allSkills[s.id] = s);
        }
        
        player.learnedSkills.forEach(skillId => {
            const skill = allSkills[skillId];
            if (!skill) return;
            
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <div class="skill-icon-large">${skill.icon}</div>
                <div class="skill-info">
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-cost">MP: ${skill.mpCost}</span>
                    </div>
                    <div class="skill-desc">${skill.description}</div>
                    <div class="skill-meta">
                        <span>冷却: ${skill.cooldown}s</span>
                        <span>按键: ${skill.key || '-'}</span>
                    </div>
                </div>
            `;
            content.appendChild(card);
        });
    }

    /**
     * 更新任务面板
     */
    updateQuestLog(player) {
        const content = this.elements.questLog?.querySelector('#quests-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        if (!player.quests || player.quests.length === 0) {
            content.innerHTML = '<p class="no-quests">暂无进行中的任务</p>';
            return;
        }
        
        player.quests.forEach(quest => {
            const item = document.createElement('div');
            item.className = 'quest-item';
            
            // 简单的任务显示
            item.innerHTML = `
                <div class="quest-title">${quest.title || '未知任务'}</div>
                <div class="quest-desc">${quest.description || '...'}</div>
                <div class="quest-progress">状态: ${quest.completed ? '已完成' : '进行中'}</div>
            `;
            content.appendChild(item);
        });
    }

    /**
     * 绑定菜单按钮事件
     */
    bindMenuEvents(callbacks) {
        // 新游戏
        document.getElementById('btn-new-game')?.addEventListener('click', () => {
            this.showScreen('characterCreation');
        });
        
        // 继续游戏
        document.getElementById('btn-load-game')?.addEventListener('click', () => {
            if (callbacks.onContinue) callbacks.onContinue();
        });
        
        // 设置
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.showScreen('settingsPanel');
        });
        
        // 创建角色确认
        document.getElementById('btn-create-confirm')?.addEventListener('click', () => {
            const name = document.getElementById('char-name')?.value.trim() || '无名修士';
            if (callbacks.onCreateCharacter) callbacks.onCreateCharacter(name);
        });
        
        // 返回按钮
        document.getElementById('btn-create-back')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        document.getElementById('btn-save-back')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        document.getElementById('btn-settings-back')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // 保存设置
        document.getElementById('btn-settings-save')?.addEventListener('click', () => {
            if (callbacks.onSaveSettings) {
                callbacks.onSaveSettings({
                    quality: document.getElementById('setting-quality')?.value || 'medium',
                    showDamageNumbers: document.getElementById('setting-damage')?.checked !== false
                });
            }
            this.showScreen('mainMenu');
        });
    }

    /**
     * 绑定游戏UI事件
     */
    bindGameUIEvents(callbacks) {
        // 技能栏点击
        this.elements.skillSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const skillId = slot.dataset.skillId;
                if (skillId && callbacks.onSkillUse) {
                    callbacks.onSkillUse(skillId);
                }
            });
        });

        // 绑定底部菜单按钮
        const menuBindings = [
            { id: 'btn-character', panel: 'characterPanel' },
            { id: 'btn-inventory', panel: 'inventoryPanel' },
            { id: 'btn-skills', panel: 'skillsPanel' },
            { id: 'btn-quests', panel: 'questLog' }
        ];

        menuBindings.forEach(binding => {
            document.getElementById(binding.id)?.addEventListener('click', () => {
                this.togglePanel(binding.panel);
                if (callbacks.onPanelOpen) {
                    callbacks.onPanelOpen(binding.panel.replace('Panel', '').replace('Log', ''));
                }
            });
        });

        // 绑定面板关闭按钮
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panelId = e.target.dataset.panel;
                // 注意：HTML中data-panel可能直接是css id，比如 'character-panel'
                // 但togglePanel使用JS属性名 'characterPanel'
                // 我们需要映射或统一
                // 查看index.html: data-panel="character-panel"
                // 我们的elements映射: this.elements.characterPanel = document.getElementById('character-panel')
                // 所以我们需要根据panelId找到对应的JS属性名，或者直接操作DOM
                // 简单点：根据ID直接隐藏
                const panelEl = document.getElementById(panelId);
                if (panelEl) panelEl.classList.add('hidden');
            });
        });
        
        // 绑定其他按钮
        document.getElementById('btn-save')?.addEventListener('click', () => {
            if (callbacks.onSave) callbacks.onSave();
        });

        document.getElementById('btn-menu')?.addEventListener('click', () => {
            if (callbacks.onMenu) callbacks.onMenu();
        });

        // 绑定游戏内菜单弹窗按钮
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            // 继续游戏，再次调用onMenu切换菜单状态
            if (callbacks.onMenu) callbacks.onMenu();
        });

        document.getElementById('btn-save-game')?.addEventListener('click', () => {
            if (callbacks.onSave) callbacks.onSave();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            // 返回主菜单，简单重载页面以重置状态
            location.reload();
        });
        

        
        // 对话框关闭按钮
        document.getElementById('dialog-close')?.addEventListener('click', () => {
            this.hideDialog();
        });
        

        
        // 对话选项点击
        this.elements.dialogOptions?.addEventListener('click', (e) => {
            if (e.target.classList.contains('dialog-option')) {
                const index = parseInt(e.target.dataset.index);
                const action = e.target.dataset.action;
                const next = e.target.dataset.next;
                
                if (callbacks.onDialogOption) {
                    callbacks.onDialogOption({ index, action, next });
                }
            }
        });
        
        // 面板切换键
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen !== 'gameUI') return;
            
            switch(e.key.toLowerCase()) {
                case 'c':
                    this.togglePanel('characterPanel');
                    if (callbacks.onPanelOpen) callbacks.onPanelOpen('character');
                    break;
                case 'b':
                    this.togglePanel('inventoryPanel');
                    break;
                case 'k':
                    this.togglePanel('skillsPanel');
                    break;
                case 'l':
                    this.togglePanel('questLog');
                    break;
                case 'escape':
                    this.closeAllPanels();
                    break;
            }
        });
    }
}
