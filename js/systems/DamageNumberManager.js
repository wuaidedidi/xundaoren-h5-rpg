/**
 * 寻道人 - 3D伤害数字管理器
 * 处理战斗中的伤害数字、治疗数字、闪避等3D空间反馈
 */

export default class DamageNumberManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.numbers = [];
    this.drops = [];

    // 攻击计数（用于暴击判定）
    this.attackCount = 0;

    // Canvas缓存池
    this.canvasPool = [];
    this.maxPoolSize = 20;

    // 预创建材质
    this.materialCache = new Map();
  }

  /**
   * 创建文字纹理
   */
  createTextTexture(text, options = {}) {
    const { fontSize = 48, color = "#ffffff", isBold = false, isStroke = false, strokeColor = "#000000" } = options;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 设置字体
    const fontWeight = isBold ? "bold" : "normal";
    ctx.font = `${fontWeight} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;

    // 测量文字
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + 20;
    const height = fontSize + 20;

    canvas.width = width;
    canvas.height = height;

    // 重新设置字体（canvas resize后需要重新设置）
    ctx.font = `${fontWeight} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 绘制描边
    if (isStroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.strokeText(text, width / 2, height / 2);
    }

    // 绘制文字
    ctx.fillStyle = color;
    ctx.fillText(text, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
  }

  /**
   * 创建伤害数字Sprite
   */
  createDamageNumberSprite(value, position, options = {}) {
    const { isCrit = false, isHeal = false, isDodge = false, isPlayer = false } = options;

    // 确保位置是 Vector3
    if (!position || typeof position.x !== "number") {
      console.warn("Invalid position for damage number:", position);
      return null;
    }

    let text, color, fontSize, scale;

    if (isDodge) {
      text = "闪避";
      color = "#888888";
      fontSize = 32;
      scale = 0.8;
    } else if (isHeal) {
      text = `+${value}`;
      color = "#44ff88";
      fontSize = 40;
      scale = 1.0;
    } else {
      text = `-${value}`;
      // 暴击时显示红色，否则玩家受伤显示红色，攻击怪物显示白色
      if (isCrit) {
        color = "#ff0000";
      } else {
        color = isPlayer ? "#ff4444" : "#ffffff";
      }
      fontSize = isCrit ? 72 : 40;
      scale = isCrit ? 1.5 : 1.0;
    }

    const texture = this.createTextTexture(text, {
      fontSize,
      color,
      isBold: isCrit,
      isStroke: true,
    });

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);

    // 计算合适的尺寸
    const aspect = texture.image.width / texture.image.height;
    sprite.scale.set(aspect * scale, scale, 1);

    // 设置初始位置（目标头顶）
    sprite.position.copy(position);
    sprite.position.y += 2.0;

    // 确保 Sprite 渲染顺序正确
    sprite.renderOrder = 999;

    this.scene.add(sprite);
    console.log("[DamageNumberManager] Sprite added to scene at:", sprite.position, "scale:", sprite.scale);

    // 动画参数
    const animData = {
      sprite,
      material,
      startPos: sprite.position.clone(),
      startTime: Date.now(),
      duration: isDodge ? 800 : 1200,
      isCrit,
      isHeal,
      isDodge,
      initialScale: sprite.scale.clone(),
    };

    // 闪避文字往旁边滑
    if (isDodge) {
      animData.slideDirection = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
    }

    this.numbers.push(animData);
    return sprite;
  }

  /**
   * 显示伤害数字
   */
  showDamage(value, position, isPlayer = false) {
    this.attackCount++;

    // 每三次攻击触发暴击
    const isCrit = this.attackCount % 3 === 0;

    this.createDamageNumberSprite(value, position, {
      isCrit,
      isPlayer,
    });

    // 暴击时额外效果
    if (isCrit) {
      this.createCritEffect(position);
    }
  }

  /**
   * 显示治疗数字
   */
  showHeal(value, position) {
    console.log("[DamageNumberManager] showHeal called:", value, position);
    const sprite = this.createDamageNumberSprite(value, position, {
      isHeal: true,
    });
    console.log("[DamageNumberManager] sprite created:", sprite);
  }

  /**
   * 显示闪避
   */
  showDodge(position) {
    this.createDamageNumberSprite(0, position, {
      isDodge: true,
    });
  }

  /**
   * 暴击特效
   */
  createCritEffect(position) {
    // 创建冲击波圆环
    const ringGeom = new THREE.RingGeometry(0.3, 0.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(position);
    ring.position.y = 1.5;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    // 冲击波动画
    const startTime = Date.now();
    const duration = 400;

    const animateRing = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
        return;
      }

      const scale = 1 + progress * 3;
      ring.scale.set(scale, scale, 1);
      ring.material.opacity = 0.8 * (1 - progress);

      requestAnimationFrame(animateRing);
    };

    animateRing();
  }

  /**
   * 创建掉落物
   */
  createDropItem(itemData, position) {
    const texture = this.createTextTexture(itemData.icon || "📦", {
      fontSize: 36,
      color: this.getRarityColor(itemData.rarity || "common"),
    });

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.position.copy(position);
    sprite.position.y = 0.5;

    this.scene.add(sprite);

    // 抛物线动画参数
    const angle = Math.random() * Math.PI * 2;
    const distance = 1 + Math.random() * 2;
    const velocity = new THREE.Vector3(Math.cos(angle) * distance, 3 + Math.random() * 2, Math.sin(angle) * distance);

    this.drops.push({
      sprite,
      material,
      velocity,
      position: sprite.position.clone(),
      startTime: Date.now(),
      duration: 1500,
      gravity: 8,
    });

    return sprite;
  }

  /**
   * 获取品质颜色
   */
  getRarityColor(rarity) {
    const colors = {
      common: "#ffffff",
      uncommon: "#44ff44",
      rare: "#4444ff",
      epic: "#aa44ff",
      legendary: "#ffaa00",
    };
    return colors[rarity] || colors.common;
  }

  /**
   * 更新所有数字
   */
  update(deltaTime) {
    const now = Date.now();

    // 更新伤害数字
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      const elapsed = now - num.startTime;
      const progress = elapsed / num.duration;

      if (progress >= 1) {
        // 清理
        this.scene.remove(num.sprite);
        num.material.dispose();
        this.numbers.splice(i, 1);
        continue;
      }

      // 更新位置
      if (num.isDodge) {
        // 闪避：往旁边滑动
        const slideSpeed = 3;
        num.sprite.position.x = num.startPos.x + num.slideDirection.x * elapsed * 0.003 * slideSpeed;
        num.sprite.position.z = num.startPos.z + num.slideDirection.z * elapsed * 0.003 * slideSpeed;
        num.sprite.position.y = num.startPos.y + Math.sin(progress * Math.PI) * 0.5;
      } else {
        // 普通/暴击/治疗：往上飘
        const riseSpeed = num.isCrit ? 2.5 : 2.0;
        num.sprite.position.y = num.startPos.y + progress * riseSpeed;
      }

      // 更新透明度（淡出）
      num.material.opacity = 1 - Math.pow(progress, 2);

      // 暴击额外缩放动画
      if (num.isCrit) {
        const scalePulse = 1 + Math.sin(progress * Math.PI) * 0.3;
        num.sprite.scale.copy(num.initialScale).multiplyScalar(scalePulse);
      }

      // Sprite 默认面向相机，不需要手动调用 lookAt
      // 但我们需要确保 Sprite 的朝向正确
      num.sprite.material.rotation = 0;
    }

    // 更新掉落物
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const elapsed = now - drop.startTime;
      const progress = elapsed / drop.duration;

      if (progress >= 1) {
        // 落地后停留一段时间再消失
        if (elapsed > drop.duration + 2000) {
          this.scene.remove(drop.sprite);
          drop.material.dispose();
          this.drops.splice(i, 1);
        }
        continue;
      }

      // 抛物线运动
      const t = progress;
      drop.velocity.y -= drop.gravity * deltaTime;

      drop.sprite.position.x = drop.position.x + drop.velocity.x * t;
      drop.sprite.position.z = drop.position.z + drop.velocity.z * t;
      drop.sprite.position.y = Math.max(0.3, drop.position.y + drop.velocity.y * t - 0.5 * drop.gravity * t * t);

      // 旋转效果
      drop.sprite.material.rotation = t * Math.PI * 2;
    }
  }

  /**
   * 清除所有数字
   */
  clear() {
    this.numbers.forEach((num) => {
      this.scene.remove(num.sprite);
      num.material.dispose();
    });
    this.numbers = [];

    this.drops.forEach((drop) => {
      this.scene.remove(drop.sprite);
      drop.material.dispose();
    });
    this.drops = [];
  }
}
