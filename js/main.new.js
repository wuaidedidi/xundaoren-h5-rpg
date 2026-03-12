/**
 * 寻道人 - 游戏主类（重构版）
 * 整合所有新架构模块
 */

import { playerStore, gameStore, networkStore } from "./stores/index.js";
import SecureStorage from "./core/SecureStorage.js";
import EventBus from "./core/EventBus.js";
import NetworkManager from "./core/NetworkManager.js";
import ResourceLoader, { ResourcePriority } from "./core/ResourceLoader.js";
import ResponsiveAdapter from "./core/ResponsiveAdapter.js";
import Renderer from "./core/Renderer.js";
import InputManager from "./core/InputManager.js";
import StarterVillage from "./world/StarterVillage.js";
import CombatSystem from "./systems/Combat.js";
import EffectsManager from "./systems/EffectsManager.js";
import UIManager from "./ui/UIManager.js";
import { getItem, useItem } from "./data/items.js";

class Game {
  constructor() {
    // Stores（直接引用单例）
    this.playerStore = playerStore;
    this.gameStore = gameStore;
    this.networkStore = networkStore;

    // 核心组件
    this.renderer = Renderer;
    this.input = InputManager;
    this.storage = SecureStorage;
    this.network = NetworkManager;
    this.resources = ResourceLoader;
    this.responsive = ResponsiveAdapter;

    // 游戏对象
    this.world = null;
    this.combat = null;
    this.effects = null;
    this.ui = null;

    // 自动保存定时器
    this.autoSaveTimer = 0;

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定全局事件
   */
  bindEvents() {
    // 网络事件
    EventBus.on("network:restored", () => {
      this.gameStore.dispatch("addMessage", "网络已恢复", "success");
    });

    EventBus.on("network:reconnecting", () => {
      this.gameStore.dispatch("addMessage", "网络断开，正在重连...", "warning");
    });

    EventBus.on("network:reconnectFailed", () => {
      this.gameStore.dispatch("addMessage", "网络连接失败，请检查网络", "error");
    });

    // 资源加载事件
    EventBus.on("resource:progress", ({ progress }) => {
      this.ui?.setLoadingProgress(progress, "正在加载资源...");
    });

    EventBus.on("resource:batchComplete", () => {
      console.log("资源加载完成");
    });

    // 响应式适配事件
    window.addEventListener("responsive:resize", (e) => {
      console.log("屏幕尺寸变化:", e.detail);
    });
  }

  /**
   * 初始化游戏
   */
  async init() {
    console.log("寻道人 - 正在初始化...");

    try {
      // 初始化响应式适配
      this.responsive.init();

      // 初始化UI
      this.ui = new UIManager(this);
      this.ui.setLoadingProgress(10, "正在初始化存储...");

      // 初始化安全存储
      await this.storage.init();
      this.ui.setLoadingProgress(25, "正在初始化网络...");

      // 初始化网络管理器
      this.network.init();
      this.ui.setLoadingProgress(40, "正在加载设置...");

      // 加载设置
      const settings = await this.storage.getSettings();
      this.gameStore.dispatch("updateSettings", settings);
      this.ui.setLoadingProgress(55, "正在初始化渲染器...");

      // 初始化渲染器
      const canvas = document.getElementById("game-canvas");
      this.renderer.init(canvas, settings.quality);
      this.ui.setLoadingProgress(70, "正在初始化输入系统...");

      // 初始化输入
      this.input.init(canvas);
      this.input.setEnabled(false);
      this.ui.setLoadingProgress(85, "正在预加载资源...");

      // 注册关键资源
      this.registerCriticalResources();

      // 绑定UI事件
      this.bindUIEvents();

      // 完成加载
      this.ui.setLoadingProgress(100, "加载完成！");

      setTimeout(() => {
        this.gameStore.dispatch("setCurrentScreen", "mainMenu");
        this.ui.showScreen("mainMenu");
      }, 500);

      console.log("寻道人 - 初始化完成");
    } catch (error) {
      console.error("游戏初始化失败:", error);
      this.ui.showToast("游戏初始化失败: " + error.message, "error");
    }
  }

  /**
   * 注册关键资源
   */
  registerCriticalResources() {
    // 这里注册游戏需要预加载的关键资源
    // 例如：纹理、模型、音效等
  }

  /**
   * 绑定UI事件
   */
  bindUIEvents() {
    this.ui.bindMenuEvents({
      onContinue: () => this.showSaveList(),
      onCreateCharacter: (name) => this.createNewGame(name),
      onSaveSettings: (settings) => this.saveSettings(settings),
    });

    this.ui.bindGameUIEvents({
      onSkillUse: (skillId) => this.useSkill(skillId),
      onDialogOption: (option) => this.handleDialogOption(option),
      onPanelOpen: (panel) => this.handlePanelOpen(panel),
      onSave: () => this.manualSave(),
      onMenu: () => this.toggleGameMenu(),
    });

    // [DEBUG] F8 快速生成测试存档
    window.addEventListener("keydown", async (e) => {
      if (e.key === "F8") {
        await this.createTestSave();
      }
    });
  }

  /**
   * 创建测试存档
   */
  async createTestSave() {
    console.log("正在生成测试存档...");
    this.ui.showToast("正在生成测试存档...", "info");

    // 使用 Store 初始化测试数据
    this.playerStore.dispatch("initPlayer", "测试天尊");
    this.playerStore.state.level = 81;
    this.playerStore.state.gold = 999999;
    this.playerStore.state.classId = "body";
    this.playerStore.state.learnedSkills = [
      "punch",
      "breathe",
      "dodge",
      "charge",
      "ironFist",
      "vajraBody",
      "earthquake",
    ];
    this.playerStore.state.hp = this.playerStore.getters.maxHp;
    this.playerStore.state.mp = this.playerStore.getters.maxMp;

    // 添加测试物品
    const testItems = [
      { itemId: "hpPotion", count: 99 },
      { itemId: "mpPotion", count: 99 },
      { itemId: "woodCore", count: 99 },
      { itemId: "stoneChunk", count: 99 },
    ];
    testItems.forEach((item) => this.playerStore.state.inventory.push(item));

    const saveData = {
      name: "测试天尊",
      player: this.playerStore.dispatch("toSaveData"),
    };

    try {
      await this.storage.saveGame(saveData);
      this.ui.showToast("测试存档已生成！请刷新页面读取", "success");
      console.log("测试存档已生成");
    } catch (error) {
      console.error("生成测试存档失败:", error);
      this.ui.showToast("生成测试存档失败", "error");
    }
  }

  /**
   * 创建新游戏
   */
  async createNewGame(playerName) {
    console.log("创建新游戏:", playerName);

    // 使用 Store 初始化玩家
    this.playerStore.dispatch("initPlayer", playerName);

    // 创建世界
    this.world = new StarterVillage();
    this.world.create(this.renderer.scene);

    // 创建玩家模型
    const playerMesh = this.playerStore.dispatch("createMesh");
    this.renderer.add(playerMesh);

    // 初始化战斗系统
    this.combat = new CombatSystem(this);
    this.combat.init(this.playerStore);

    // 初始化效果管理器
    this.effects = new EffectsManager(this.renderer.scene);
    this.combat.setEffectsManager(this.effects);

    // 保存初始存档（加密存储）
    const saveData = {
      name: playerName,
      player: this.playerStore.dispatch("toSaveData"),
    };

    try {
      const saveId = await this.storage.saveGame(saveData);
      this.gameStore.dispatch("setCurrentSaveId", saveId);
      this.startGame();
    } catch (error) {
      console.error("保存初始存档失败:", error);
      this.ui.showToast("保存存档失败", "error");
    }
  }

  /**
   * 加载存档
   */
  async loadGame(saveId) {
    console.log("加载存档:", saveId);

    try {
      const saveData = await this.storage.getSave(saveId);
      if (!saveData) {
        this.ui.showToast("存档不存在", "error");
        return;
      }

      // 从存档恢复玩家数据
      this.playerStore.dispatch("loadFromSaveData", saveData.player);

      // 创建世界
      this.world = new StarterVillage();
      this.world.create(this.renderer.scene);

      // 创建玩家模型
      const playerMesh = this.playerStore.dispatch("createMesh");
      this.renderer.add(playerMesh);

      // 初始化战斗系统
      this.combat = new CombatSystem(this);
      this.combat.init(this.playerStore);

      // 初始化效果管理器
      this.effects = new EffectsManager(this.renderer.scene);
      this.combat.setEffectsManager(this.effects);

      this.gameStore.dispatch("setCurrentSaveId", saveId);
      this.startGame();
    } catch (error) {
      console.error("加载存档失败:", error);
      this.ui.showToast("加载存档失败: " + error.message, "error");
    }
  }

  /**
   * 显示存档列表
   */
  async showSaveList() {
    try {
      const saves = await this.storage.getAllSaves();

      if (saves.length === 0) {
        this.ui.showToast("没有存档", "info");
        return;
      }

      // 显示存档列表界面
      this.renderSaveList(saves);
      this.gameStore.dispatch("setCurrentScreen", "saveList");
      this.ui.showScreen("saveList");
    } catch (error) {
      console.error("获取存档列表失败:", error);
      this.ui.showToast("获取存档列表失败", "error");
    }
  }

  /**
   * 渲染存档列表
   */
  renderSaveList(saves) {
    const container = document.querySelector(".saves-container");
    if (!container) return;

    container.innerHTML = "";

    saves.forEach((save) => {
      const div = document.createElement("div");
      div.className = "save-item";
      div.dataset.saveId = save.id;

      const date = new Date(save.updateTime).toLocaleString();

      div.innerHTML = `
                <div class="save-info">
                    <div class="save-name">${save.name}</div>
                    <div class="save-details">Lv.${save.player.level} | ${date}</div>
                </div>
                <div class="save-actions">
                    <button class="btn-load">加载</button>
                    <button class="btn-delete">删除</button>
                </div>
            `;

      // 加载按钮事件
      div.querySelector(".btn-load").addEventListener("click", (e) => {
        e.stopPropagation();
        this.loadGame(save.id);
      });

      // 删除按钮事件
      div.querySelector(".btn-delete").addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("确定要删除这个存档吗？")) {
          try {
            await this.storage.deleteSave(save.id);
            this.ui.showToast("存档已删除", "info");
            this.showSaveList();
          } catch (error) {
            this.ui.showToast("删除存档失败", "error");
          }
        }
      });

      container.appendChild(div);
    });
  }

  /**
   * 保存设置
   */
  async saveSettings(settings) {
    try {
      this.gameStore.dispatch("updateSettings", settings);
      await this.storage.saveSettings(settings);
      this.renderer.setQuality(settings.quality);
      this.ui.showToast("设置已保存", "success");
    } catch (error) {
      console.error("保存设置失败:", error);
      this.ui.showToast("保存设置失败", "error");
    }
  }

  /**
   * 启动游戏循环
   */
  startGame() {
    this.gameStore.dispatch("setRunning", true);
    this.input.setEnabled(true);
    this.gameStore.dispatch("setCurrentScreen", "gameUI");
    this.ui.showScreen("gameUI");

    // 初始化UI
    this.ui.updatePlayerHUD(this.playerStore);
    this.ui.updateSkillBar(this.playerStore);

    // 绑定输入事件
    this.bindInputEvents();

    // 开始游戏循环
    this.gameStore.dispatch("resetTime");
    requestAnimationFrame((time) => this.gameLoop(time));

    this.ui.showToast(`欢迎来到寻道世界，${this.playerStore.state.name}！`, "info");
  }

  /**
   * 绑定输入事件
   */
  bindInputEvents() {
    // 鼠标点击选中目标
    this.input.on("click", (mouse, event) => {
      if (this.gameStore.state.openPanels.length > 0) return;

      const intersects = this.renderer.raycast({ x: mouse.x, y: mouse.y }, this.world.getSelectableObjects());

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const entity = hit.userData.entity;

        if (entity) {
          if (hit.userData.type === "monster" && !entity.isDead) {
            this.combat.setTarget(entity);
            this.ui.updateTargetFrame(entity);
          } else if (hit.userData.type === "npc") {
            this.interactWithNPC(entity);
          }
        }
      } else {
        this.combat.clearTarget();
        this.ui.updateTargetFrame(null);
      }
    });

    // 右键丢弃目标
    this.input.on("rightclick", () => {
      this.combat.clearTarget();
      this.ui.updateTargetFrame(null);
    });

    // 技能快捷键
    this.input.on("keydown", (key) => {
      if (this.gameStore.state.openPanels.length > 0) return;

      // 数字键使用技能
      if (key >= "1" && key <= "7") {
        const skillSlots = document.querySelectorAll(".skill-slot");
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
    if (!this.gameStore.state.isRunning) return;

    // 更新时间
    this.gameStore.dispatch("updateTime", time);
    const deltaTime = this.gameStore.state.deltaTime;

    if (!this.gameStore.state.isPaused) {
      this.update(deltaTime);
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

    // 更新玩家位置
    this.playerStore.dispatch("updatePosition", deltaTime, direction);

    // 边界限制
    this.playerStore.dispatch(
      "clampPosition",
      this.world.bounds.minX + 1,
      this.world.bounds.maxX - 1,
      this.world.bounds.minZ + 1,
      this.world.bounds.maxZ - 1
    );

    // 更新相机
    this.renderer.updateCamera({
      x: this.playerStore.state.position.x,
      y: this.playerStore.state.position.y,
      z: this.playerStore.state.position.z,
    });

    // 更新世界和获取怪物攻击
    const monsterAttacks = this.world.update(deltaTime, this.playerStore);

    // 处理怪物攻击
    monsterAttacks.forEach((attack) => {
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
    this.ui.updatePlayerHUD(this.playerStore);
    this.ui.updateSkillBar(this.playerStore);

    // 更新目标框
    if (this.combat.target) {
      this.ui.updateTargetFrame(this.combat.target);
    }

    // 自动保存（每60秒）
    this.autoSaveTimer += deltaTime;
    if (this.autoSaveTimer >= 60) {
      this.autoSaveTimer = 0;
      this.autoSave();
    }

    // 检查玩家死亡
    if (this.playerStore.state.hp <= 0) {
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
      this.ui.showToast(result.message, "warning");
    }
  }

  /**
   * 处理战斗结果
   */
  handleCombatResult(result) {
    if (!result) return;

    // 显示伤害数字
    if (result.type === "damage" && this.gameStore.state.settings.showDamageNumbers) {
      let screenPos;

      if (result.source === "player" && result.target) {
        screenPos = this.renderer.worldToScreen(result.target.mesh.position);
      } else if (result.source === "monster") {
        screenPos = this.renderer.worldToScreen({
          x: this.playerStore.state.position.x,
          y: this.playerStore.state.position.y,
          z: this.playerStore.state.position.z,
        });
      }

      if (screenPos) {
        this.ui.showDamageNumber(screenPos.x, screenPos.y, result.damage, result.source === "monster");
      }
    }

    // 击杀奖励
    if (result.killed) {
      // 经验
      if (result.exp) {
        const expResults = this.playerStore.dispatch("gainExp", result.exp);
        this.ui.showExpGain(result.exp);

        expResults.forEach((r) => {
          if (r.type === "levelUp") {
            this.ui.showLevelUp(r.level);
          } else if (r.type === "realmUp") {
            this.ui.showRealmUp(r.realm);
          }
        });
      }

      // 金币
      if (result.gold) {
        this.playerStore.dispatch("gainGold", result.gold);
        this.ui.showGoldGain(result.gold);
      }

      // 掉落物品
      if (result.drops) {
        result.drops.forEach((drop) => {
          const item = getItem(drop.itemId);
          if (item && this.playerStore.dispatch("addItem", item, drop.count)) {
            this.ui.showToast(`获得 ${item.name} x${drop.count}`, "success");
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
    // 计算距离
    const dx = npc.position.x - this.playerStore.state.position.x;
    const dz = npc.position.z - this.playerStore.state.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 3) {
      this.ui.showToast("距离太远了", "warning");
      return;
    }

    this.gameStore.dispatch("setCurrentNPC", npc);
    npc.lookAtPlayer(this.playerStore.state.position);

    const dialog = npc.getDialog(null, this.playerStore);
    this.ui.showDialog(npc, dialog);
  }

  /**
   * 处理对话选项
   */
  handleDialogOption(option) {
    const { action, next } = option;

    if (next) {
      const npc = this.gameStore.state.currentNPC;
      const dialog = npc.getDialog(next, this.playerStore);
      this.ui.showDialog(npc, dialog);
      return;
    }

    switch (action) {
      case "close":
        this.ui.hideDialog();
        this.gameStore.dispatch("setCurrentNPC", null);
        break;

      case "showClass":
        this.ui.hideDialog();
        this.ui.showClassSelection((classId) => {
          this.selectClass(classId);
        });
        break;

      case "openShop":
        this.ui.hideDialog();
        this.ui.showToast("商店功能开发中...", "info");
        break;

      case "openSkills":
        this.ui.hideDialog();
        this.gameStore.dispatch("togglePanel", "skillsPanel");
        break;

      case "startTutorial":
        this.ui.hideDialog();
        this.ui.showToast("战斗教程：用1-4键释放技能，点击怪物攻击", "info");
        this.playerStore.state.tutorialComplete = true;
        break;

      case "learnDragonGrip":
        if (this.playerStore.state.learnedSkills.includes("dragonGrip")) {
          this.ui.showToast("你已经学会擒龙功了", "warning");
        } else {
          this.playerStore.dispatch("learnSkill", "dragonGrip");
          this.playerStore.state.baseHp += 50;
          this.playerStore.state.hp = this.playerStore.getters.maxHp;
          this.ui.updatePlayerHUD(this.playerStore);
          this.ui.showToast("学会了擒龙功！基础生命值+50", "success");
        }
        this.ui.hideDialog();
        break;

      case "giveGift":
        this.playerStore.dispatch("gainGold", 100);
        this.playerStore.state.foundMysteriousElder = true;
        this.ui.showToast("神秘老者赠予你100金币！", "success");
        this.gameStore.state.currentNPC.setDialog("afterGift");
        const dialog = this.gameStore.state.currentNPC.getDialog("afterGift", this.playerStore);
        this.ui.showDialog(this.gameStore.state.currentNPC, dialog);
        break;

      default:
        this.ui.hideDialog();
    }
  }

  /**
   * 选择/重新选择职业
   */
  selectClass(classId) {
    const hadClass = !!this.playerStore.state.classId;
    if (hadClass) {
      // 移除旧职业技能
      const oldSkills = this.getClassSkillIds(this.playerStore.state.classId);
      this.playerStore.state.learnedSkills = this.playerStore.state.learnedSkills.filter(
        (id) => !oldSkills.includes(id)
      );
      this.playerStore.state.classId = null;
      this.playerStore.state.specializationId = null;
    }

    this.playerStore.dispatch("selectClass", classId);

    this.ui.updatePlayerHUD(this.playerStore);
    this.ui.updateSkillBar(this.playerStore);
    this.ui.showToast(hadClass ? "重新转职成功！" : "转职成功！", "success");
  }

  /**
   * 获取职业技能ID列表
   */
  getClassSkillIds(classId) {
    const map = {
      body: ["ironFist", "vajraBody", "earthquake"],
      qi: ["qiBlast", "thunderStrike", "spiritShield"],
      spirit: ["paralyze", "rejuvenate", "soulFear"],
    };
    return map[classId] || [];
  }

  /**
   * 面板打开回调
   */
  handlePanelOpen(panel) {
    if (panel === "character") {
      this.ui.updateCharacterPanel(this.playerStore);
    } else if (panel === "inventory") {
      this.ui.updateInventoryPanel(this.playerStore);
    } else if (panel === "skills") {
      this.ui.updateSkillsPanel(this.playerStore);
    } else if (panel === "quest") {
      this.ui.updateQuestLog(this.playerStore);
    }
  }

  /**
   * 处理玩家死亡
   */
  handlePlayerDeath() {
    this.ui.showToast("你被击败了！将在原地复活...", "error");
    this.playerStore.dispatch("revive");
    this.combat.clearTarget();
    this.ui.updateTargetFrame(null);
  }

  /**
   * 自动保存
   */
  async autoSave() {
    const saveId = this.gameStore.state.currentSaveId;
    if (!saveId) return;

    try {
      await this.storage.saveGame({
        id: saveId,
        name: this.playerStore.state.name,
        player: this.playerStore.dispatch("toSaveData"),
      });
      console.log("自动保存完成");
    } catch (error) {
      console.error("自动保存失败:", error);
    }
  }

  /**
   * 手动保存
   */
  async manualSave() {
    await this.autoSave();
    this.ui.showToast("游戏已保存", "success");
  }

  /**
   * 切换游戏菜单
   */
  toggleGameMenu() {
    this.gameStore.dispatch("togglePause");
    const gameMenu = document.getElementById("game-menu");
    if (gameMenu) {
      gameMenu.classList.toggle("hidden", !this.gameStore.state.isPaused);
    }
  }

  /**
   * 销毁游戏
   */
  destroy() {
    this.gameStore.dispatch("setRunning", false);
    this.network.destroy();
    this.responsive.destroy();
    EventBus.clear();
  }
}

// 启动游戏
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.init();

  // 暴露到全局以便调试
  window.game = game;
});

export default Game;
