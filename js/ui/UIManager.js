/**
 * 寻道人 - UI管理器
 * 处理所有UI交互和显示
 */

import { getRealmByLevel, getExpRequired } from "../data/realms.js";
import { getClass, getAllClasses } from "../data/classes.js";
import { getBaseSkills, getClassSkills } from "../data/skills.js";
import { getItem, getRarity, isEquipment, getEquipmentSlot, EQUIPMENT_SLOTS, getSellPrice } from "../data/items.js";

export default class UIManager {
  constructor(game) {
    this.game = game;

    this.elements = {};
    this.initElements();

    this.currentScreen = "loading";
    this.isDialogOpen = false;
    this.currentShopMode = "buy";
  }

  initElements() {
    this.elements.loadingScreen = document.getElementById("loading-screen");
    this.elements.mainMenu = document.getElementById("main-menu");
    this.elements.characterCreation = document.getElementById("create-character");
    this.elements.saveList = document.getElementById("save-list");
    this.elements.settingsPanel = document.getElementById("settings-panel");
    this.elements.gameUI = document.getElementById("game-ui");

    this.elements.loadingProgress = document.getElementById("loading-progress");
    this.elements.loadingText = document.getElementById("loading-text");

    this.elements.characterNameInput = document.getElementById("character-name-input");

    this.elements.playerName = document.getElementById("player-name");
    this.elements.playerLevel = document.getElementById("player-level");
    this.elements.playerRealm = document.getElementById("player-realm");
    this.elements.hpFill = document.getElementById("hp-fill");
    this.elements.hpText = document.getElementById("hp-text");
    this.elements.mpFill = document.getElementById("mp-fill");
    this.elements.mpText = document.getElementById("mp-text");
    this.elements.expFill = document.getElementById("exp-fill");
    this.elements.expText = document.getElementById("exp-text");

    this.elements.targetFrame = document.getElementById("target-frame");
    this.elements.targetName = document.getElementById("target-name");
    this.elements.targetLevel = document.getElementById("target-level");
    this.elements.targetHpFill = document.getElementById("target-hp-fill");
    this.elements.targetHpText = document.getElementById("target-hp-text");

    this.elements.skillBar = document.querySelector(".skill-bar");
    this.elements.skillSlots = document.querySelectorAll(".skill-slot");

    this.elements.characterPanel = document.getElementById("character-panel");
    this.elements.inventoryPanel = document.getElementById("inventory-panel");
    this.elements.skillsPanel = document.getElementById("skills-panel");
    this.elements.questLog = document.getElementById("quests-panel");
    this.elements.shopPanel = document.getElementById("shop-panel");

    this.elements.dialogPanel = document.getElementById("dialog-box");
    this.elements.dialogNpcName = document.getElementById("dialog-speaker");
    this.elements.dialogText = document.getElementById("dialog-content");
    this.elements.dialogOptions = document.getElementById("dialog-options");

    this.elements.qualitySelect = document.getElementById("setting-quality");
    this.elements.damageNumbersCheck = document.getElementById("setting-damage");

    this.elements.toastContainer = document.getElementById("toast-container");
  }

  setLoadingProgress(percent, text) {
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = `${percent}%`;
    }
    if (this.elements.loadingText) {
      this.elements.loadingText.textContent = text;
    }
  }

  showScreen(screenId) {
    const screens = ["loadingScreen", "mainMenu", "characterCreation", "saveList", "settingsPanel", "gameUI"];

    screens.forEach((screen) => {
      if (this.elements[screen]) {
        this.elements[screen].classList.add("hidden");
      }
    });

    const screenElement = this.elements[screenId];
    if (screenElement) {
      screenElement.classList.remove("hidden");
    }

    this.currentScreen = screenId;
  }

  updatePlayerHUD(player) {
    if (!player) return;

    const realm = getRealmByLevel(player.level);
    const expRequired = getExpRequired(player.level);

    this.elements.playerName.textContent = player.name;
    this.elements.playerLevel.textContent = `Lv.${player.level}`;
    this.elements.playerRealm.textContent = realm.name;

    const hpPercent = (player.hp / player.maxHp) * 100;
    this.elements.hpFill.style.width = `${hpPercent}%`;
    this.elements.hpText.textContent = `${Math.floor(player.hp)} / ${player.maxHp}`;

    const mpPercent = (player.mp / player.maxMp) * 100;
    this.elements.mpFill.style.width = `${mpPercent}%`;
    this.elements.mpText.textContent = `${Math.floor(player.mp)} / ${player.maxMp}`;

    const expPercent = player.level >= 81 ? 100 : (player.exp / expRequired) * 100;
    this.elements.expFill.style.width = `${expPercent}%`;
    this.elements.expText.textContent = player.level >= 81 ? "MAX" : `${player.exp} / ${expRequired}`;
  }

  updateTargetFrame(target) {
    if (!this.elements.targetFrame) return;

    if (!target) {
      this.elements.targetFrame.classList.add("hidden");
      return;
    }

    this.elements.targetFrame.classList.remove("hidden");
    if (this.elements.targetName) this.elements.targetName.textContent = target.name;
    if (this.elements.targetLevel) this.elements.targetLevel.textContent = `Lv.${target.level}`;

    const hpPercent = (target.hp / target.maxHp) * 100;
    if (this.elements.targetHpFill) this.elements.targetHpFill.style.width = `${hpPercent}%`;
    if (this.elements.targetHpText)
      this.elements.targetHpText.textContent = `${Math.floor(target.hp)} / ${target.maxHp}`;
  }

  updateSkillBar(player) {
    const skills = getBaseSkills();
    if (player.classId) {
      skills.push(...getClassSkills(player.classId));
    }

    this.elements.skillSlots.forEach((slot, index) => {
      const skill = skills[index];
      const iconEl = slot.querySelector(".skill-icon");
      const keyEl = slot.querySelector(".skill-key");
      const nameEl = slot.querySelector(".skill-name");
      const cooldownEl = slot.querySelector(".skill-cooldown");

      if (skill) {
        slot.classList.remove("locked");
        if (iconEl) iconEl.textContent = skill.icon || "";
        if (keyEl) keyEl.textContent = skill.key || index + 1;
        if (nameEl) nameEl.textContent = skill.name || "";

        let onCooldown = false;
        let noMp = false;

        const cooldown = player.skillCooldowns[skill.id];
        if (cooldownEl) {
          if (cooldown && cooldown > 0) {
            onCooldown = true;
            cooldownEl.classList.remove("hidden");
            const seconds = Math.ceil(cooldown / 1000);
            cooldownEl.textContent = seconds;

            const totalCd = skill.cooldown * 1000;
            const percent = (cooldown / totalCd) * 100;
            slot.style.setProperty("--cd-percent", `${percent}%`);
          } else {
            cooldownEl.classList.add("hidden");
            slot.style.removeProperty("--cd-percent");
          }
        }

        if (player.mp < skill.mpCost) {
          noMp = true;
        }

        if (onCooldown) {
          slot.classList.add("on-cooldown");
          slot.classList.remove("no-mp");
        } else if (noMp) {
          slot.classList.add("no-mp");
          slot.classList.remove("on-cooldown");
        } else {
          slot.classList.remove("on-cooldown");
          slot.classList.remove("no-mp");
        }

        slot.dataset.skillId = skill.id;
      } else {
        slot.classList.add("locked");
        if (iconEl) iconEl.textContent = "";
        if (keyEl) keyEl.textContent = index + 1;
        if (nameEl) nameEl.textContent = "-";
        if (cooldownEl) cooldownEl.classList.add("hidden");
        slot.classList.remove("on-cooldown", "no-mp");
        delete slot.dataset.skillId;
      }
    });
  }

  showDialog(npc, dialog) {
    this.isDialogOpen = true;
    this.elements.dialogPanel.classList.remove("hidden");
    this.elements.dialogNpcName.textContent = npc.name;
    this.elements.dialogText.textContent = dialog.text;

    this.elements.dialogOptions.innerHTML = "";

    dialog.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "dialog-option";
      btn.textContent = option.text;
      btn.dataset.index = index;
      btn.dataset.action = option.action || "";
      btn.dataset.next = option.next || "";
      this.elements.dialogOptions.appendChild(btn);
    });
  }

  hideDialog() {
    this.isDialogOpen = false;
    this.elements.dialogPanel.classList.add("hidden");
  }

  showClassSelection(onSelect) {
    const panel = document.getElementById("class-panel");
    if (!panel) return;

    panel.querySelectorAll(".class-select-btn").forEach((btn) => {
      const option = btn.closest(".class-option");
      if (!option) return;
      const classId = option.dataset.class;
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", () => {
        if (onSelect) onSelect(classId);
        panel.classList.add("hidden");
      });
    });

    panel.classList.remove("hidden");
  }

  showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  showDamageNumber(x, y, damage, isPlayer = false) {
    const num = document.createElement("div");
    num.className = `damage-number ${isPlayer ? "damage-taken" : "damage-dealt"}`;
    num.textContent = `-${damage}`;
    num.style.left = `${x}px`;
    num.style.top = `${y}px`;

    document.body.appendChild(num);

    setTimeout(() => num.remove(), 1000);
  }

  showExpGain(exp) {
    this.showToast(`获得 ${exp} 经验值`, "success");
  }

  showGoldGain(gold) {
    this.showToast(`获得 ${gold} 金币`, "success");
  }

  showLevelUp(level) {
    this.showToast(`升级了！当前等级: ${level}`, "success", 5000);
  }

  showRealmUp(realmName) {
    this.showToast(`境界突破！${realmName}`, "success", 5000);
  }

  togglePanel(panelId) {
    const panel = this.elements[panelId];
    if (!panel) return;

    const isHidden = panel.classList.contains("hidden");

    ["characterPanel", "inventoryPanel", "skillsPanel", "questLog", "shopPanel"].forEach((id) => {
      if (this.elements[id] && id !== panelId) {
        this.elements[id].classList.add("hidden");
      }
    });

    if (isHidden) {
      panel.classList.remove("hidden");
    } else {
      panel.classList.add("hidden");
    }
  }

  closeAllPanels() {
    ["characterPanel", "inventoryPanel", "skillsPanel", "questLog", "shopPanel"].forEach((id) => {
      if (this.elements[id]) {
        this.elements[id].classList.add("hidden");
      }
    });
    this.hideDialog();
  }

  getRarityClass(rarity) {
    const r = getRarity(rarity);
    return `rarity-${r.id}`;
  }

  getRarityStyle(rarity) {
    const r = getRarity(rarity);
    return `color: ${r.color}; border-color: ${r.borderColor};`;
  }

  formatStats(stats) {
    if (!stats) return "";
    const parts = [];
    if (stats.attack) parts.push(`攻击+${stats.attack}`);
    if (stats.defense) parts.push(`防御+${stats.defense}`);
    if (stats.hp) parts.push(`生命+${stats.hp}`);
    if (stats.mp) parts.push(`法力+${stats.mp}`);
    if (stats.speed) parts.push(`速度+${stats.speed}`);
    return parts.join(" | ");
  }

  updateCharacterPanel(player) {
    const content = this.elements.characterPanel?.querySelector(".panel-content");
    if (!content) return;

    const cls = player.classId ? getClass(player.classId) : null;
    const equipment = player.getAllEquipment();

    let equipmentHtml = '<div class="equipment-section"><h3>装备栏</h3><div class="equipment-slots">';

    Object.entries(EQUIPMENT_SLOTS).forEach(([slotId, slotInfo]) => {
      const equip = equipment[slotId];
      const rarityClass = equip ? this.getRarityClass(equip.rarity) : "";
      const rarityStyle = equip ? this.getRarityStyle(equip.rarity) : "";

      equipmentHtml += `
                <div class="equipment-slot ${rarityClass}" 
                     data-slot="${slotId}" 
                     style="${rarityStyle}"
                     title="${equip ? equip.name : slotInfo.name}">
                    <div class="slot-icon">${equip ? equip.icon : slotInfo.icon}</div>
                    <div class="slot-name">${slotInfo.name}</div>
                    ${equip ? `<div class="equip-name">${equip.name}</div>` : ""}
                </div>
            `;
    });

    equipmentHtml += "</div></div>";

    content.innerHTML = `
            <div class="stat-section">
                <h3>基础信息</h3>
                <div class="stat-row"><span>姓名</span><span>${player.name}</span></div>
                <div class="stat-row"><span>等级</span><span>${player.level}</span></div>
                <div class="stat-row"><span>境界</span><span>${player.realm.name}</span></div>
                <div class="stat-row"><span>职业</span><span>${cls ? cls.name : "未选择"}</span></div>
            </div>
            <div class="stat-section">
                <h3>战斗属性</h3>
                <div class="stat-row"><span>攻击力</span><span>${player.attack}</span></div>
                <div class="stat-row"><span>防御力</span><span>${player.defense}</span></div>
                <div class="stat-row"><span>生命上限</span><span>${player.maxHp}</span></div>
                <div class="stat-row"><span>法力上限</span><span>${player.maxMp}</span></div>
                <div class="stat-row"><span>移动速度</span><span>${player.speed}</span></div>
            </div>
            <div class="stat-section">
                <h3>财富</h3>
                <div class="stat-row"><span>金币</span><span>${player.gold}</span></div>
            </div>
            ${equipmentHtml}
        `;

    content.querySelectorAll(".equipment-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        const slotId = slot.dataset.slot;
        if (this.game && this.game.handleEquipmentClick) {
          this.game.handleEquipmentClick(slotId);
        }
      });
    });
  }

  updateInventoryPanel(player) {
    if (this.elements.inventoryPanel) {
      const goldEl = this.elements.inventoryPanel.querySelector("#player-gold");
      if (goldEl) goldEl.textContent = player.gold;

      const grid = this.elements.inventoryPanel.querySelector("#inventory-grid");
      if (grid) {
        grid.innerHTML = "";

        for (let i = 0; i < 24; i++) {
          const slot = document.createElement("div");
          slot.className = "inventory-slot";

          const invItem = player.inventory[i];
          if (invItem) {
            const itemData = getItem(invItem.itemId);

            if (itemData) {
              const displayItem = { ...itemData, count: invItem.count };
              const rarityClass = this.getRarityClass(displayItem.rarity);
              const rarityStyle = this.getRarityStyle(displayItem.rarity);

              slot.classList.add(rarityClass);
              slot.style.cssText = rarityStyle;

              slot.dataset.itemId = displayItem.id;
              slot.dataset.index = i;

              const statsText = isEquipment(displayItem) ? this.formatStats(displayItem.stats) : "";

              slot.innerHTML = `
                                <div class="item-icon">${displayItem.icon}</div>
                                <div class="item-count">${displayItem.count > 1 ? displayItem.count : ""}</div>
                                <div class="item-tooltip">
                                    <div class="item-name" style="color: ${getRarity(displayItem.rarity).color}">${
                displayItem.name
              }</div>
                                    ${
                                      displayItem.rarity && displayItem.rarity !== "common"
                                        ? `<div class="item-rarity" style="color: ${
                                            getRarity(displayItem.rarity).color
                                          }">[${getRarity(displayItem.rarity).name}]</div>`
                                        : ""
                                    }
                                    ${statsText ? `<div class="item-stats">${statsText}</div>` : ""}
                                    <div class="item-desc">${displayItem.description}</div>
                                    <div class="item-price">价格: ${displayItem.price} 金币</div>
                                </div>
                            `;

              slot.addEventListener("click", () => {
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

  updateSkillsPanel(player) {
    const content = this.elements.skillsPanel?.querySelector("#skills-content");
    if (!content) return;

    content.innerHTML = "";

    if (!player.learnedSkills || player.learnedSkills.length === 0) {
      content.innerHTML = '<div class="no-data">暂无习得技能</div>';
      return;
    }

    const allSkills = {};
    getBaseSkills().forEach((s) => (allSkills[s.id] = s));
    if (player.classId) {
      getClassSkills(player.classId).forEach((s) => (allSkills[s.id] = s));
    }

    player.learnedSkills.forEach((skillId) => {
      const skill = allSkills[skillId];
      if (!skill) return;

      const card = document.createElement("div");
      card.className = "skill-card";
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
                        <span>按键: ${skill.key || "-"}</span>
                    </div>
                </div>
            `;
      content.appendChild(card);
    });
  }

  showShop(items, playerGold, mode = "buy", callbacks = {}) {
    if (!this.elements.shopPanel) return;

    this.currentShopMode = mode;

    const goldEl = this.elements.shopPanel.querySelector("#shop-player-gold");
    if (goldEl) goldEl.textContent = playerGold;

    const itemsContainer = this.elements.shopPanel.querySelector("#shop-items");
    if (!itemsContainer) return;

    itemsContainer.innerHTML = "";

    items.forEach((item, index) => {
      const rarityClass = this.getRarityClass(item.rarity);
      const rarityStyle = this.getRarityStyle(item.rarity);
      const statsText = isEquipment(item) ? this.formatStats(item.stats) : "";
      const price = mode === "buy" ? item.price : getSellPrice(item);

      const itemEl = document.createElement("div");
      itemEl.className = `shop-item ${rarityClass}`;
      itemEl.style.cssText = rarityStyle;
      itemEl.dataset.itemId = item.id;
      itemEl.dataset.index = index;

      itemEl.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name" style="color: ${getRarity(item.rarity).color}">${item.name}</div>
                    ${
                      item.rarity && item.rarity !== "common"
                        ? `<div class="shop-item-rarity" style="color: ${getRarity(item.rarity).color}">[${
                            getRarity(item.rarity).name
                          }]</div>`
                        : ""
                    }
                    ${statsText ? `<div class="shop-item-stats">${statsText}</div>` : ""}
                    <div class="shop-item-desc">${item.description}</div>
                </div>
                <div class="shop-item-price">${price} 💰</div>
                <button class="shop-buy-btn">${mode === "buy" ? "购买" : "出售"}</button>
            `;

      const btn = itemEl.querySelector(".shop-buy-btn");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mode === "buy" && callbacks.onBuy) {
          callbacks.onBuy(item, index);
        } else if (mode === "sell" && callbacks.onSell) {
          callbacks.onSell(item, index);
        }
      });

      itemsContainer.appendChild(itemEl);
    });

    this.elements.shopPanel.classList.remove("hidden");
  }

  hideShop() {
    if (this.elements.shopPanel) {
      this.elements.shopPanel.classList.add("hidden");
    }
  }

  showSellPanel(player, callbacks = {}) {
    if (!this.elements.shopPanel) return;

    const goldEl = this.elements.shopPanel.querySelector("#shop-player-gold");
    if (goldEl) goldEl.textContent = player.gold;

    const titleEl = this.elements.shopPanel.querySelector("#shop-title");
    if (titleEl) titleEl.textContent = "出售物品";

    const itemsContainer = this.elements.shopPanel.querySelector("#shop-items");
    if (!itemsContainer) return;

    itemsContainer.innerHTML = "";

    player.inventory.forEach((invItem, index) => {
      const itemData = getItem(invItem.itemId);
      if (!itemData) return;

      const displayItem = { ...itemData, count: invItem.count };
      const rarityClass = this.getRarityClass(displayItem.rarity);
      const rarityStyle = this.getRarityStyle(displayItem.rarity);
      const statsText = isEquipment(displayItem) ? this.formatStats(displayItem.stats) : "";
      const price = getSellPrice(displayItem);

      const itemEl = document.createElement("div");
      itemEl.className = `shop-item ${rarityClass}`;
      itemEl.style.cssText = rarityStyle;
      itemEl.dataset.itemId = displayItem.id;
      itemEl.dataset.index = index;

      itemEl.innerHTML = `
                <div class="shop-item-icon">${displayItem.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name" style="color: ${getRarity(displayItem.rarity).color}">${
        displayItem.name
      }</div>
                    ${
                      displayItem.rarity && displayItem.rarity !== "common"
                        ? `<div class="shop-item-rarity" style="color: ${getRarity(displayItem.rarity).color}">[${
                            getRarity(displayItem.rarity).name
                          }]</div>`
                        : ""
                    }
                    ${statsText ? `<div class="shop-item-stats">${statsText}</div>` : ""}
                    <div class="shop-item-count">数量: ${displayItem.count}</div>
                </div>
                <div class="shop-item-price">${price} 💰</div>
                <button class="shop-buy-btn">出售</button>
            `;

      const btn = itemEl.querySelector(".shop-buy-btn");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (callbacks.onSell) {
          callbacks.onSell(displayItem, index);
        }
      });

      itemsContainer.appendChild(itemEl);
    });

    if (player.inventory.length === 0) {
      itemsContainer.innerHTML = '<div class="no-data">背包空空如也</div>';
    }

    this.elements.shopPanel.classList.remove("hidden");
  }

  updateQuestLog(player) {
    const content = this.elements.questLog?.querySelector("#quests-content");
    if (!content) return;

    if (!player.quests || player.quests.length === 0) {
      content.innerHTML = '<p class="no-quests">暂无进行中的任务</p>';
      return;
    }

    content.innerHTML = player.quests
      .map(
        (quest) => `
            <div class="quest-item">
                <h4>${quest.name}</h4>
                <p>${quest.description}</p>
                <div class="quest-progress">${quest.progress || ""}</div>
            </div>
        `
      )
      .join("");
  }

  bindMenuEvents(callbacks) {
    const continueBtn = document.getElementById("btn-load-game");
    const newGameBtn = document.getElementById("btn-new-game");
    const settingsBtn = document.getElementById("btn-settings");
    const createBtn = document.getElementById("btn-create-confirm");
    const saveSettingsBtn = document.getElementById("btn-settings-save");
    const createBackBtn = document.getElementById("btn-create-back");
    const settingsBackBtn = document.getElementById("btn-settings-back");
    const saveBackBtn = document.getElementById("btn-save-back");

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (callbacks.onContinue) callbacks.onContinue();
      });
    }

    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => {
        this.showScreen("characterCreation");
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.showScreen("settingsPanel");
      });
    }

    if (createBtn) {
      createBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("char-name");
        const name = nameInput ? nameInput.value.trim() : "";
        if (name && callbacks.onCreateCharacter) {
          callbacks.onCreateCharacter(name);
        } else if (!name) {
          this.showToast("请输入角色名称", "warning");
        }
      });
    }

    if (createBackBtn) {
      createBackBtn.addEventListener("click", () => {
        this.showScreen("mainMenu");
      });
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => {
        const quality = this.elements.qualitySelect ? this.elements.qualitySelect.value : "medium";
        const showDamage = this.elements.damageNumbersCheck ? this.elements.damageNumbersCheck.checked : true;
        if (callbacks.onSaveSettings) {
          callbacks.onSaveSettings({ quality, showDamageNumbers: showDamage });
        }
        this.showScreen("mainMenu");
      });
    }

    if (settingsBackBtn) {
      settingsBackBtn.addEventListener("click", () => {
        this.showScreen("mainMenu");
      });
    }

    if (saveBackBtn) {
      saveBackBtn.addEventListener("click", () => {
        this.showScreen("mainMenu");
      });
    }
  }

  bindGameUIEvents(callbacks) {
    this.elements.skillSlots.forEach((slot) => {
      slot.addEventListener("click", () => {
        const skillId = slot.dataset.skillId;
        if (skillId && callbacks.onSkillUse) {
          callbacks.onSkillUse(skillId);
        }
      });
    });

    this.elements.dialogOptions.addEventListener("click", (e) => {
      const btn = e.target.closest(".dialog-option");
      if (btn) {
        const index = parseInt(btn.dataset.index);
        const option = {
          index,
          action: btn.dataset.action,
          next: btn.dataset.next,
          text: btn.textContent,
        };
        if (callbacks.onDialogOption) {
          callbacks.onDialogOption(option);
        }
      }
    });

    const panelCloseBtns = document.querySelectorAll(".panel-close[data-panel]");
    panelCloseBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.dataset.panel;
        this.togglePanel(panel);
      });
    });

    const btnCharacter = document.getElementById("btn-character");
    if (btnCharacter) {
      btnCharacter.addEventListener("click", () => {
        if (callbacks.onPanelOpen) callbacks.onPanelOpen("character");
        this.togglePanel("characterPanel");
      });
    }

    const btnInventory = document.getElementById("btn-inventory");
    if (btnInventory) {
      btnInventory.addEventListener("click", () => {
        if (callbacks.onPanelOpen) callbacks.onPanelOpen("inventory");
        this.togglePanel("inventoryPanel");
      });
    }

    const btnSkills = document.getElementById("btn-skills");
    if (btnSkills) {
      btnSkills.addEventListener("click", () => {
        if (callbacks.onPanelOpen) callbacks.onPanelOpen("skills");
        this.togglePanel("skillsPanel");
      });
    }

    const btnQuests = document.getElementById("btn-quests");
    if (btnQuests) {
      btnQuests.addEventListener("click", () => {
        if (callbacks.onPanelOpen) callbacks.onPanelOpen("quest");
        this.togglePanel("questLog");
      });
    }

    const saveBtn = document.getElementById("btn-save");
    if (saveBtn && callbacks.onSave) {
      saveBtn.addEventListener("click", () => callbacks.onSave());
    }

    const menuBtn = document.getElementById("btn-menu");
    if (menuBtn && callbacks.onMenu) {
      menuBtn.addEventListener("click", () => callbacks.onMenu());
    }

    const dialogCloseBtn = document.getElementById("dialog-close");
    if (dialogCloseBtn) {
      dialogCloseBtn.addEventListener("click", () => {
        this.hideDialog();
      });
    }
  }

  showShop(items, playerGold, mode, callbacks) {
    const panel = this.elements.shopPanel;
    if (!panel) return;

    this.currentShopMode = mode;

    panel.innerHTML = `
            <div class="panel-header">
                <h2>铁匠铺</h2>
                <button class="close-btn" id="shop-close-btn">×</button>
            </div>
            <div class="shop-content">
                <div class="shop-player-gold">金币: <span id="shop-player-gold">${playerGold}</span></div>
                <div class="shop-items" id="shop-items"></div>
            </div>
        `;

    const itemsContainer = panel.querySelector("#shop-items");

    items.forEach((item, index) => {
      const rarityClass = this.getRarityClass(item.rarity);
      const rarityStyle = this.getRarityStyle(item.rarity);
      const statsText = isEquipment(item) ? this.formatStats(item.stats) : "";

      const itemEl = document.createElement("div");
      itemEl.className = `shop-item ${rarityClass}`;
      itemEl.style.cssText = rarityStyle;
      itemEl.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name" style="color: ${getRarity(item.rarity).color}">${item.name}</div>
                    ${
                      item.rarity && item.rarity !== "common"
                        ? `<div class="item-rarity" style="color: ${getRarity(item.rarity).color}">[${
                            getRarity(item.rarity).name
                          }]</div>`
                        : ""
                    }
                    ${statsText ? `<div class="item-stats">${statsText}</div>` : ""}
                    <div class="item-desc">${item.description}</div>
                </div>
                <div class="item-price">${item.price} 金币</div>
                <button class="buy-btn" data-index="${index}">购买</button>
            `;

      itemEl.querySelector(".buy-btn").addEventListener("click", () => {
        if (callbacks.onBuy) callbacks.onBuy(item, index);
      });

      itemsContainer.appendChild(itemEl);
    });

    panel.querySelector("#shop-close-btn").addEventListener("click", () => {
      panel.classList.add("hidden");
    });

    panel.classList.remove("hidden");
  }

  showSellPanel(player, callbacks) {
    const panel = this.elements.shopPanel;
    if (!panel) return;

    const sellableItems = player.inventory.map((inv, idx) => ({ ...inv, index: idx })).filter((inv) => inv.itemId);

    panel.innerHTML = `
            <div class="panel-header">
                <h2>出售物品</h2>
                <button class="close-btn" id="shop-close-btn">×</button>
            </div>
            <div class="shop-content">
                <div class="shop-player-gold">金币: <span id="shop-player-gold">${player.gold}</span></div>
                <div class="shop-items" id="shop-items"></div>
            </div>
        `;

    const itemsContainer = panel.querySelector("#shop-items");

    if (sellableItems.length === 0) {
      itemsContainer.innerHTML = '<div class="no-data">背包中没有可出售的物品</div>';
    } else {
      sellableItems.forEach((invItem) => {
        const itemData = getItem(invItem.itemId);
        if (!itemData) return;

        const sellPrice = getSellPrice(itemData);
        const rarityClass = this.getRarityClass(itemData.rarity);
        const rarityStyle = this.getRarityStyle(itemData.rarity);

        const itemEl = document.createElement("div");
        itemEl.className = `shop-item ${rarityClass}`;
        itemEl.style.cssText = rarityStyle;
        itemEl.innerHTML = `
                    <div class="item-icon">${itemData.icon}</div>
                    <div class="item-info">
                        <div class="item-name" style="color: ${getRarity(itemData.rarity).color}">${itemData.name}</div>
                        <div class="item-count">数量: ${invItem.count}</div>
                    </div>
                    <div class="item-price">售价: ${sellPrice} 金币</div>
                    <button class="sell-btn" data-index="${invItem.index}">出售</button>
                `;

        itemEl.querySelector(".sell-btn").addEventListener("click", () => {
          if (callbacks.onSell) callbacks.onSell(itemData, invItem.index);
        });

        itemsContainer.appendChild(itemEl);
      });
    }

    panel.querySelector("#shop-close-btn").addEventListener("click", () => {
      panel.classList.add("hidden");
    });

    panel.classList.remove("hidden");
  }

  updateQuestLog(player) {
    const content = this.elements.questLog?.querySelector(".panel-content");
    if (!content) return;

    if (!player.quests || player.quests.length === 0) {
      content.innerHTML = '<div class="no-data">暂无进行中的任务</div>';
      return;
    }

    content.innerHTML = player.quests
      .map(
        (quest) => `
            <div class="quest-item">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-desc">${quest.description}</div>
            </div>
        `
      )
      .join("");
  }
}
