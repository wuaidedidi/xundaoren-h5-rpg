/**
 * 寻道人 - NPC实体类
 * 圆柱体作为NPC模型（颜色区分）
 */

import { getNPC } from "../data/npcs.js";

export default class NPC {
  constructor(npcId) {
    const config = getNPC(npcId);
    if (!config) {
      throw new Error(`Unknown NPC: ${npcId}`);
    }

    // 复制配置
    this.id = npcId;
    this.name = config.name;
    this.title = config.title;
    this.color = config.color;
    this.size = config.size || 1.0;
    this.position = { ...config.position };
    this.glow = config.glow || false;
    this.type = config.type;
    this.dialogs = config.dialogs;
    this.shopItems = config.shopItems || [];
    this.hidden = config.hidden || false;

    // 3D对象
    this.mesh = null;
    this.glowMesh = null;
    this.hatMesh = null;
    this.weaponMesh = null;

    // 动画状态
    this.animationTime = 0;

    // 交互状态
    this.isInteracting = false;
    this.currentDialog = "default";
  }

  /**
   * 创建3D模型
   */
  createMesh() {
    // 创建圆柱体
    const geometry = new THREE.CylinderGeometry(0.4 * this.size, 0.4 * this.size, 1.6 * this.size, 16);
    const material = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.3),
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y + 0.8 * this.size, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { type: "npc", entity: this };

    // 创建光环效果（如果需要）
    if (this.glow) {
      const glowGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });

      this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      this.glowMesh.position.set(this.position.x, 0.05, this.position.z);
      this.glowMesh.rotation.x = -Math.PI / 2;
    }

    // 创建帽子（村长）
    if (this.id === "villageChief") {
      this.createHat();
    }

    // 创建武器（守卫）
    if (this.id === "guard") {
      this.createWeapon();
    }

    return this.mesh;
  }

  /**
   * 创建帽子（村长专用）
   */
  createHat() {
    const hatGroup = new THREE.Group();

    const hatBaseGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    const hatBaseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const hatBase = new THREE.Mesh(hatBaseGeom, hatBaseMat);
    hatBase.position.y = 0.85 * this.size;
    hatGroup.add(hatBase);

    const hatTopGeom = new THREE.ConeGeometry(0.4, 0.6, 16);
    const hatTopMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const hatTop = new THREE.Mesh(hatTopGeom, hatTopMat);
    hatTop.position.y = 1.2 * this.size;
    hatGroup.add(hatTop);

    const bandGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16);
    const bandMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.position.y = 1.05 * this.size;
    hatGroup.add(band);

    hatGroup.castShadow = true;
    hatGroup.position.copy(this.mesh.position);
    this.hatMesh = hatGroup;
  }

  /**
   * 创建武器（守卫专用）
   */
  createWeapon() {
    const weaponGroup = new THREE.Group();

    const hiltGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const hiltMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const hilt = new THREE.Mesh(hiltGeom, hiltMat);
    weaponGroup.add(hilt);

    const bladeGeom = new THREE.BoxGeometry(0.12, 1.3, 0.06);
    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.9,
    });
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.y = 0.8;
    blade.castShadow = true;
    blade.userData.isBlade = true;
    weaponGroup.add(blade);

    const crossguardGeom = new THREE.BoxGeometry(0.3, 0.1, 0.1);
    const crossguardMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const crossguard = new THREE.Mesh(crossguardGeom, crossguardMat);
    crossguard.position.y = 0.2;
    weaponGroup.add(crossguard);

    const glowGeom = new THREE.BoxGeometry(0.25, 1.45, 0.18);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.6,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.y = 0.8;
    glow.userData.isGlow = true;
    weaponGroup.add(glow);

    weaponGroup.position.set(0.5, 0, 0);
    weaponGroup.rotation.z = -0.3;

    const weaponPivot = new THREE.Group();
    weaponPivot.add(weaponGroup);
    weaponPivot.position.set(this.position.x, 1.6 * this.size, this.position.z);
    this.weaponMesh = weaponPivot;
  }

  /**
   * 更新（动画等）
   */
  update(deltaTime) {
    this.animationTime += deltaTime;

    // 光环旋转动画
    if (this.glowMesh) {
      this.glowMesh.rotation.z += deltaTime * 0.5;
    }

    // 呼吸动画
    const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.03;
    if (this.mesh) {
      this.mesh.scale.y = breathScale;
    }

    // 帽子跟随呼吸动画
    if (this.hatMesh && this.mesh) {
      this.hatMesh.position.x = this.mesh.position.x;
      this.hatMesh.position.z = this.mesh.position.z;
      this.hatMesh.position.y = this.mesh.position.y + (breathScale - 1) * 0.8;
    }

    // 武器位置同步和发光动画
    if (this.weaponMesh) {
      this.weaponMesh.position.x = this.mesh.position.x;
      this.weaponMesh.position.z = this.mesh.position.z;
      this.weaponMesh.position.y = this.mesh.position.y + 0.8 * this.size + (breathScale - 1) * 0.4;

      const glowPulse = 0.3 + Math.sin(this.animationTime * 3) * 0.4;
      const bladePulse = 0.7 + Math.sin(this.animationTime * 3) * 0.3;
      let glowMesh = null;
      let bladeMesh = null;
      this.weaponMesh.traverse((obj) => {
        if (obj.userData && obj.userData.isGlow) {
          glowMesh = obj;
        }
        if (obj.userData && obj.userData.isBlade) {
          bladeMesh = obj;
        }
      });
      if (glowMesh) {
        glowMesh.material.opacity = glowPulse;
      }
      if (bladeMesh) {
        bladeMesh.material.opacity = bladePulse;
      }
    }
  }

  /**
   * 获取当前对话
   */
  getDialog(dialogId = null, player = null) {
    const id = dialogId || this.currentDialog;
    let dialog = this.dialogs[id];

    if (!dialog) {
      dialog = this.dialogs.default;
    }

    // 过滤选项（根据条件）
    if (dialog.options && player) {
      dialog = {
        ...dialog,
        options: dialog.options.filter((option) => {
          if (!option.condition) return true;

          const cond = option.condition;

          if (cond.minLevel && player.level < cond.minLevel) return false;
          if (cond.noClass && player.classId) return false;
          if (cond.hasClass && !player.classId) return false;

          return true;
        }),
      };
    }

    return dialog;
  }

  /**
   * 设置当前对话
   */
  setDialog(dialogId) {
    this.currentDialog = dialogId;
  }

  /**
   * 获取与玩家的距离
   */
  getDistanceTo(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 检查是否可交互
   */
  canInteract(playerPosition, maxDistance = 3) {
    return this.getDistanceTo(playerPosition) <= maxDistance;
  }

  /**
   * 面向玩家
   */
  lookAtPlayer(playerPosition) {
    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    const angle = Math.atan2(dx, dz);

    if (this.mesh) {
      this.mesh.rotation.y = angle;
    }
    if (this.hatMesh) {
      this.hatMesh.rotation.y = angle;
    }
    if (this.weaponMesh) {
      this.weaponMesh.rotation.y = angle;
    }
  }
}
