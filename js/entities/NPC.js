/**
 * 寻道人 - NPC实体类
 * 圆柱体作为NPC模型（颜色区分）
 * 包含各NPC独特视觉效果和呼吸动画
 */

import { getNPC } from "../data/npcs.js";

export default class NPC {
  constructor(npcId) {
    const config = getNPC(npcId);
    if (!config) {
      throw new Error(`Unknown NPC: ${npcId}`);
    }

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

    this.mesh = null;
    this.glowMesh = null;
    this.hat = null;
    this.weapon = null;
    this.furnace = null;
    this.furnaceParticles = null;
    this.spiritParticles = null;
    this.accessories = [];

    this.isInteracting = false;
    this.currentDialog = "default";

    this.breathTime = Math.random() * Math.PI * 2;
    this.breathSpeed = 2.0;
    this.breathAmount = 0.03;
    this.baseY = 0;

    this.particleTime = 0;
  }

  createMesh() {
    const geometry = new THREE.CylinderGeometry(0.4 * this.size, 0.4 * this.size, 1.6 * this.size, 16);
    const material = new THREE.MeshLambertMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.3),
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y + 0.8 * this.size, this.position.z);
    this.baseY = this.mesh.position.y;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { type: "npc", entity: this };

    switch (this.id) {
      case "villageChief":
        this.createVillageChiefEffects();
        break;
      case "blacksmith":
        this.createBlacksmithEffects();
        break;
      case "trainer":
        this.createTrainerEffects();
        break;
      case "guard":
        this.createGuardEffects();
        break;
    }

    return this.mesh;
  }

  createVillageChiefEffects() {
    const hatGroup = new THREE.Group();

    const brimGeom = new THREE.CylinderGeometry(0.5, 0.55, 0.08, 16);
    const brimMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const brim = new THREE.Mesh(brimGeom, brimMat);
    brim.position.y = 0;
    hatGroup.add(brim);

    const crownGeom = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 16);
    const crownMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const crown = new THREE.Mesh(crownGeom, crownMat);
    crown.position.y = 0.24;
    hatGroup.add(crown);

    const topGeom = new THREE.SphereGeometry(0.15, 12, 8);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const top = new THREE.Mesh(topGeom, topMat);
    top.position.y = 0.5;
    hatGroup.add(top);

    const jewelGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const jewelMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
    });
    const jewel = new THREE.Mesh(jewelGeom, jewelMat);
    jewel.position.y = 0.62;
    hatGroup.add(jewel);

    hatGroup.position.set(this.position.x, this.baseY + 0.8 * this.size + 0.04, this.position.z);
    this.hat = hatGroup;
    this.accessories.push(hatGroup);

    const glowGeometry = new THREE.RingGeometry(0.7, 1.0, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });

    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowMesh.position.set(this.position.x, 0.05, this.position.z);
    this.glowMesh.rotation.x = -Math.PI / 2;

    const innerGlowGeom = new THREE.RingGeometry(0.3, 0.6, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeom, innerGlowMat);
    innerGlow.position.set(this.position.x, 0.06, this.position.z);
    innerGlow.rotation.x = -Math.PI / 2;
    this.innerGlow = innerGlow;
    this.accessories.push(innerGlow);
  }

  createBlacksmithEffects() {
    const furnaceGroup = new THREE.Group();

    const baseGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.6, 12);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.3;
    furnaceGroup.add(base);

    const bodyGeom = new THREE.CylinderGeometry(0.45, 0.5, 0.8, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.7;
    furnaceGroup.add(body);

    const openingGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
    const openingMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      emissive: 0xff4400,
    });
    const opening = new THREE.Mesh(openingGeom, openingMat);
    opening.position.y = 1.15;
    furnaceGroup.add(opening);

    const glowGeom = new THREE.SphereGeometry(0.3, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.6,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.y = 1.0;
    glow.scale.y = 0.5;
    furnaceGroup.add(glow);
    this.furnaceGlow = glow;

    furnaceGroup.position.set(this.position.x + 1.2, 0, this.position.z + 0.5);

    this.furnace = furnaceGroup;
    this.accessories.push(furnaceGroup);

    this.createFurnaceParticles();
  }

  createFurnaceParticles() {
    const count = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const furnacePos = {
      x: this.position.x + 1.2,
      y: 1.0,
      z: this.position.z + 0.5,
    };

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = furnacePos.x + (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = furnacePos.y + Math.random() * 0.5;
      positions[i3 + 2] = furnacePos.z + (Math.random() - 0.5) * 0.3;

      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.3;
        colors[i3 + 2] = 0.0;
      } else if (colorChoice < 0.6) {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 0.0;
      } else {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 0.3;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.furnaceParticles = new THREE.Points(geometry, material);
    this.furnaceParticleData = {
      basePos: furnacePos,
      velocities: Array(count)
        .fill(null)
        .map(() => ({
          x: (Math.random() - 0.5) * 0.5,
          y: 1.5 + Math.random() * 1.5,
          z: (Math.random() - 0.5) * 0.5,
        })),
      lifetimes: Array(count)
        .fill(null)
        .map(() => Math.random()),
    };
  }

  createTrainerEffects() {
    const count = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.4;
      positions[i3] = this.position.x + Math.cos(angle) * radius;
      positions[i3 + 1] = 0.3 + Math.random() * 1.8;
      positions[i3 + 2] = this.position.z + Math.sin(angle) * radius;

      colors[i3] = 0.4 + Math.random() * 0.6;
      colors[i3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i3 + 2] = 1.0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.spiritParticles = new THREE.Points(geometry, material);
    this.spiritParticleData = {
      count: count,
      baseAngles: Array(count)
        .fill(null)
        .map((_, i) => (i / count) * Math.PI * 2),
      speeds: Array(count)
        .fill(null)
        .map(() => 0.8 + Math.random() * 0.8),
      heights: Array(count)
        .fill(null)
        .map(() => Math.random() * 1.8),
      radii: Array(count)
        .fill(null)
        .map(() => 0.5 + Math.random() * 0.4),
    };

    const auraGeom = new THREE.RingGeometry(0.4, 0.7, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    aura.position.set(this.position.x, 0.05, this.position.z);
    aura.rotation.x = -Math.PI / 2;
    this.aura = aura;
    this.accessories.push(aura);

    const innerAuraGeom = new THREE.RingGeometry(0.2, 0.35, 32);
    const innerAuraMat = new THREE.MeshBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const innerAura = new THREE.Mesh(innerAuraGeom, innerAuraMat);
    innerAura.position.set(this.position.x, 0.06, this.position.z);
    innerAura.rotation.x = -Math.PI / 2;
    this.innerAura = innerAura;
    this.accessories.push(innerAura);
  }

  createGuardEffects() {
    const weaponGroup = new THREE.Group();

    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.rotation.z = Math.PI / 6;
    weaponGroup.add(handle);

    const bladeGeom = new THREE.BoxGeometry(0.08, 1.2, 0.02);
    const bladeMat = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      emissive: 0x333333,
    });
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.y = 0.9;
    blade.position.x = 0.2;
    blade.rotation.z = Math.PI / 6;
    weaponGroup.add(blade);

    const guardGeom = new THREE.BoxGeometry(0.3, 0.06, 0.04);
    const guardMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const guard = new THREE.Mesh(guardGeom, guardMat);
    guard.position.y = 0.35;
    guard.position.x = 0.08;
    guard.rotation.z = Math.PI / 6;
    weaponGroup.add(guard);

    const glowGeom = new THREE.BoxGeometry(0.15, 1.3, 0.06);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.y = 0.9;
    glow.position.x = 0.2;
    glow.rotation.z = Math.PI / 6;
    weaponGroup.add(glow);
    this.weaponGlow = glow;

    const tipGlowGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const tipGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 1.0,
    });
    const tipGlow = new THREE.Mesh(tipGlowGeom, tipGlowMat);
    tipGlow.position.y = 1.55;
    tipGlow.position.x = 0.38;
    weaponGroup.add(tipGlow);
    this.tipGlow = tipGlow;

    const bladeGlowGeom = new THREE.BoxGeometry(0.06, 1.0, 0.01);
    const bladeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.5,
    });
    const bladeGlow = new THREE.Mesh(bladeGlowGeom, bladeGlowMat);
    bladeGlow.position.y = 0.95;
    bladeGlow.position.x = 0.18;
    bladeGlow.position.z = 0.03;
    bladeGlow.rotation.z = Math.PI / 6;
    weaponGroup.add(bladeGlow);
    this.bladeGlow = bladeGlow;

    weaponGroup.position.set(this.position.x + 0.5, this.baseY - 0.4, this.position.z);

    this.weapon = weaponGroup;
    this.accessories.push(weaponGroup);
  }

  update(deltaTime) {
    this.breathTime += deltaTime * this.breathSpeed;
    const breathOffset = Math.sin(this.breathTime) * this.breathAmount;

    if (this.mesh) {
      this.mesh.position.y = this.baseY + breathOffset;
      this.mesh.scale.y = 1 + breathOffset * 0.5;
    }

    if (this.glowMesh) {
      this.glowMesh.rotation.z += deltaTime * 0.5;
    }

    if (this.innerGlow) {
      this.innerGlow.rotation.z -= deltaTime * 0.3;
      this.innerGlow.material.opacity = 0.3 + Math.sin(this.breathTime * 2) * 0.1;
    }

    if (this.hat) {
      this.hat.position.y = this.baseY + 0.8 * this.size + 0.04 + breathOffset;
    }

    if (this.weapon) {
      this.weapon.position.y = this.baseY - 0.4 + breathOffset;

      this.particleTime += deltaTime;
      if (this.weaponGlow) {
        this.weaponGlow.material.opacity = 0.5 + Math.sin(this.particleTime * 3) * 0.3;
      }
      if (this.tipGlow) {
        this.tipGlow.scale.setScalar(0.8 + Math.sin(this.particleTime * 4) * 0.3);
        this.tipGlow.material.opacity = 0.7 + Math.sin(this.particleTime * 5) * 0.3;
      }
      if (this.bladeGlow) {
        this.bladeGlow.material.opacity = 0.3 + Math.sin(this.particleTime * 6) * 0.2;
      }
    }

    if (this.aura) {
      this.aura.rotation.z += deltaTime * 0.8;
      this.aura.material.opacity = 0.4 + Math.sin(this.breathTime * 1.5) * 0.2;
    }

    if (this.innerAura) {
      this.innerAura.rotation.z -= deltaTime * 1.2;
      this.innerAura.material.opacity = 0.5 + Math.sin(this.breathTime * 2) * 0.2;
    }

    if (this.furnaceParticles) {
      this.updateFurnaceParticles(deltaTime);
    }

    if (this.spiritParticles) {
      this.updateSpiritParticles(deltaTime);
    }

    if (this.furnaceGlow) {
      this.furnaceGlow.material.opacity = 0.4 + Math.sin(this.particleTime * 5) * 0.2;
      this.furnaceGlow.scale.setScalar(1 + Math.sin(this.particleTime * 3) * 0.1);
    }
  }

  updateFurnaceParticles(deltaTime) {
    const positions = this.furnaceParticles.geometry.attributes.position.array;
    const data = this.furnaceParticleData;

    for (let i = 0; i < data.velocities.length; i++) {
      const i3 = i * 3;

      data.lifetimes[i] += deltaTime * 0.8;

      if (data.lifetimes[i] >= 1) {
        data.lifetimes[i] = 0;
        positions[i3] = data.basePos.x + (Math.random() - 0.5) * 0.3;
        positions[i3 + 1] = data.basePos.y;
        positions[i3 + 2] = data.basePos.z + (Math.random() - 0.5) * 0.3;
        data.velocities[i] = {
          x: (Math.random() - 0.5) * 0.5,
          y: 1.5 + Math.random() * 1.5,
          z: (Math.random() - 0.5) * 0.5,
        };
      } else {
        positions[i3] += data.velocities[i].x * deltaTime;
        positions[i3 + 1] += data.velocities[i].y * deltaTime;
        positions[i3 + 2] += data.velocities[i].z * deltaTime;

        data.velocities[i].x += (Math.random() - 0.5) * deltaTime * 2;
        data.velocities[i].z += (Math.random() - 0.5) * deltaTime * 2;
      }
    }

    this.furnaceParticles.geometry.attributes.position.needsUpdate = true;
  }

  updateSpiritParticles(deltaTime) {
    const positions = this.spiritParticles.geometry.attributes.position.array;
    const data = this.spiritParticleData;

    this.particleTime += deltaTime;

    for (let i = 0; i < data.count; i++) {
      const i3 = i * 3;

      data.baseAngles[i] += data.speeds[i] * deltaTime;

      const angle = data.baseAngles[i];
      const radius = data.radii[i];
      const heightOffset = Math.sin(this.particleTime * 2 + i) * 0.3;

      positions[i3] = this.position.x + Math.cos(angle) * radius;
      positions[i3 + 1] = 0.5 + data.heights[i] + heightOffset;
      positions[i3 + 2] = this.position.z + Math.sin(angle) * radius;
    }

    this.spiritParticles.geometry.attributes.position.needsUpdate = true;
    this.spiritParticles.material.opacity = 0.5 + Math.sin(this.particleTime * 2) * 0.2;
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
  }
}
