/**
 * 雨天效果系统
 * 包含粒子雨、闪电、环境光调整等功能
 */

export default class RainEffect {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // 雨粒子系统
    this.rainSystem = null;
    this.rainCount = 8000;
    this.rainArea = 120; // 增大雨区范围

    // 原始光照设置（用于恢复）
    this.originalAmbientIntensity = 0.6;
    this.originalDirectionalIntensity = 0.8;
    this.originalFogNear = 50;
    this.originalFogFar = 150;
    this.originalFogColor = null;
    this.originalBackgroundColor = null;

    // 闪电效果
    this.directionalLight = null;
    this.isLightning = false;
    this.lightningTimer = 0;
    this.lightningInterval = 5 + Math.random() * 5;
    this.lightningDuration = 0.15;
    this.lightningIntensity = 3.0;

    // 地面材质引用
    this.groundMaterials = [];
    this.originalGroundColors = [];

    this.isActive = false;

    // 风向参数
    this.windX = 3; // X方向风速
    this.windZ = 1; // Z方向风速
  }

  /**
   * 启动雨天效果
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;

    // 保存原始设置
    this.saveOriginalSettings();

    // 创建雨粒子
    this.createRainSystem();

    // 调整环境
    this.adjustEnvironment();

    // 获取方向光引用
    this.findDirectionalLight();

    console.log("雨天效果已启动");
  }

  /**
   * 停止雨天效果
   */
  stop() {
    if (!this.isActive) return;
    this.isActive = false;

    // 移除雨粒子
    if (this.rainSystem) {
      this.scene.remove(this.rainSystem);
      this.rainSystem.geometry.dispose();
      this.rainSystem.material.dispose();
      this.rainSystem = null;
    }

    // 恢复原始设置
    this.restoreOriginalSettings();

    console.log("雨天效果已停止");
  }

  /**
   * 保存原始场景设置
   */
  saveOriginalSettings() {
    // 保存环境光
    this.scene.traverse((child) => {
      if (child instanceof THREE.AmbientLight) {
        this.originalAmbientIntensity = child.intensity;
      }
      if (child instanceof THREE.DirectionalLight) {
        this.originalDirectionalIntensity = child.intensity;
        this.directionalLight = child;
      }
    });

    // 保存雾设置
    if (this.scene.fog) {
      this.originalFogNear = this.scene.fog.near;
      this.originalFogFar = this.scene.fog.far;
      this.originalFogColor = this.scene.fog.color.clone();
    }

    // 保存背景色
    if (this.scene.background) {
      this.originalBackgroundColor = this.scene.background.clone();
    }

    // 保存地面材质
    this.groundMaterials = [];
    this.originalGroundColors = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat && mat.color) {
              this.groundMaterials.push(mat);
              this.originalGroundColors.push(mat.color.clone());
            }
          });
        } else if (child.material && child.material.color) {
          this.groundMaterials.push(child.material);
          this.originalGroundColors.push(child.material.color.clone());
        }
      }
    });
  }

  /**
   * 恢复原始设置
   */
  restoreOriginalSettings() {
    // 恢复光照
    this.scene.traverse((child) => {
      if (child instanceof THREE.AmbientLight) {
        child.intensity = this.originalAmbientIntensity;
      }
      if (child instanceof THREE.DirectionalLight) {
        child.intensity = this.originalDirectionalIntensity;
      }
    });

    // 恢复雾
    if (this.scene.fog) {
      this.scene.fog.near = this.originalFogNear;
      this.scene.fog.far = this.originalFogFar;
      if (this.originalFogColor) {
        this.scene.fog.color.copy(this.originalFogColor);
      }
    }

    // 恢复背景色
    if (this.originalBackgroundColor && this.scene.background) {
      this.scene.background.copy(this.originalBackgroundColor);
    }

    // 恢复地面材质
    this.groundMaterials.forEach((mat, index) => {
      if (this.originalGroundColors[index]) {
        mat.color.copy(this.originalGroundColors[index]);
      }
      if (mat.roughness !== undefined) {
        mat.roughness = 0.8;
      }
      if (mat.metalness !== undefined) {
        mat.metalness = 0.0;
      }
    });
  }

  /**
   * 创建雨粒子系统
   */
  createRainSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);

    // 初始化雨滴位置
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.rainArea;
      positions[i * 3 + 1] = Math.random() * 50 + 20; // 提高起始高度
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.rainArea;

      // 每个雨滴的下落速度略有不同
      velocities[i] = 20 + Math.random() * 15;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));

    // 创建雨滴材质 - 使用更细长的雨滴形状
    const material = new THREE.PointsMaterial({
      color: 0xccccdd,
      size: 0.08, // 更小的粒子
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainSystem = new THREE.Points(geometry, material);
    this.scene.add(this.rainSystem);
  }

  /**
   * 调整环境为雨天氛围
   */
  adjustEnvironment() {
    // 降低环境光亮度
    this.scene.traverse((child) => {
      if (child instanceof THREE.AmbientLight) {
        child.intensity = 0.15; // 更暗的环境光
      }
    });

    // 缩短雾的可视距离
    if (this.scene.fog) {
      this.scene.fog.near = 5;
      this.scene.fog.far = 50;
      this.scene.fog.color.setHex(0x1a1a2e);
    }

    // 调整背景色为更深的色调
    if (this.scene.background) {
      this.scene.background.setHex(0x0a0a15);
    }

    // 修改地面材质，添加湿润反光感
    this.groundMaterials.forEach((mat, index) => {
      // 将材质改为 StandardMaterial 以获得更好的反光效果
      if (mat instanceof THREE.MeshLambertMaterial) {
        const newMat = new THREE.MeshStandardMaterial({
          color: mat.color.clone().multiplyScalar(0.6), // 更暗的湿润效果
          roughness: 0.15, // 更低的粗糙度 = 更光滑 = 更多反光
          metalness: 0.2, // 增加金属度增强反光
          envMapIntensity: 1.5, // 增强环境反射
        });

        // 找到使用这个材质的mesh并替换
        this.scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material === mat) {
            child.material = newMat;
          }
        });

        this.groundMaterials[index] = newMat;
      } else if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.multiplyScalar(0.6);
        mat.roughness = 0.15;
        mat.metalness = 0.2;
        mat.envMapIntensity = 1.5;
      }
    });
  }

  /**
   * 查找场景中的方向光
   */
  findDirectionalLight() {
    this.scene.traverse((child) => {
      if (child instanceof THREE.DirectionalLight) {
        this.directionalLight = child;
      }
    });
  }

  /**
   * 触发闪电效果
   */
  triggerLightning() {
    if (!this.directionalLight || this.isLightning) return;

    this.isLightning = true;
    this.lightningTimer = 0;

    // 瞬间拉满方向光强度
    this.directionalLight.intensity = this.lightningIntensity;

    // 闪电时稍微提亮环境
    this.scene.traverse((child) => {
      if (child instanceof THREE.AmbientLight) {
        child.intensity = 0.6;
      }
    });

    // 背景色短暂变亮
    if (this.scene.background) {
      this.scene.background.setHex(0x3a3a5e);
    }

    console.log("⚡ 闪电！");
  }

  /**
   * 更新雨天效果
   */
  update(deltaTime) {
    if (!this.isActive) return;

    // 更新雨滴位置
    this.updateRain(deltaTime);

    // 更新闪电效果
    this.updateLightning(deltaTime);
  }

  /**
   * 更新雨滴动画
   */
  updateRain(deltaTime) {
    if (!this.rainSystem) return;

    const positions = this.rainSystem.geometry.attributes.position.array;
    const velocities = this.rainSystem.geometry.attributes.velocity.array;

    // 获取相机位置用于跟随
    const cameraPos = this.camera.position;

    for (let i = 0; i < this.rainCount; i++) {
      // 更新Y位置（下落）
      positions[i * 3 + 1] -= velocities[i] * deltaTime;

      // 添加风向偏移 - 让雨有斜向落下的效果
      positions[i * 3] += this.windX * deltaTime;
      positions[i * 3 + 2] += this.windZ * deltaTime;

      // 如果雨滴落到地面以下，重置到顶部
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 50 + Math.random() * 20;

        // 重新随机X和Z位置，以相机为中心，但在更大的范围内
        positions[i * 3] = cameraPos.x + (Math.random() - 0.5) * this.rainArea;
        positions[i * 3 + 2] = cameraPos.z + (Math.random() - 0.5) * this.rainArea;
      }
    }

    this.rainSystem.geometry.attributes.position.needsUpdate = true;

    // 让雨粒子系统跟随相机，但保持一定距离感
    // 不直接设置位置，而是让雨滴在相机周围生成
    this.rainSystem.position.x = cameraPos.x * 0.3; // 只跟随30%，创造视差效果
    this.rainSystem.position.z = cameraPos.z * 0.3;
  }

  /**
   * 更新闪电效果
   */
  updateLightning(deltaTime) {
    this.lightningTimer += deltaTime;

    if (this.isLightning) {
      // 闪电持续期间
      if (this.lightningTimer >= this.lightningDuration) {
        // 闪电结束，恢复光照
        this.isLightning = false;

        if (this.directionalLight) {
          // 平滑恢复到较低强度
          this.directionalLight.intensity = 0.05;
        }

        // 恢复环境光
        this.scene.traverse((child) => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 0.15;
          }
        });

        // 恢复背景色
        if (this.scene.background) {
          this.scene.background.setHex(0x0a0a15);
        }

        // 设置下一次闪电间隔
        this.lightningInterval = 3 + Math.random() * 7;
        this.lightningTimer = 0;
      }
    } else {
      // 等待下一次闪电
      if (this.lightningTimer >= this.lightningInterval) {
        this.triggerLightning();
      }
    }

    // 平滑恢复方向光强度
    if (!this.isLightning && this.directionalLight) {
      const targetIntensity = 0.05;
      this.directionalLight.intensity += (targetIntensity - this.directionalLight.intensity) * deltaTime * 2;
    }
  }

  /**
   * 设置雨的密度
   */
  setRainDensity(count) {
    this.rainCount = count;
    if (this.isActive) {
      // 重新创建雨系统
      this.scene.remove(this.rainSystem);
      this.rainSystem.geometry.dispose();
      this.rainSystem.material.dispose();
      this.createRainSystem();
    }
  }

  /**
   * 设置闪电频率
   */
  setLightningFrequency(minInterval, maxInterval) {
    this.lightningInterval = minInterval + Math.random() * (maxInterval - minInterval);
  }

  /**
   * 设置风向
   */
  setWind(windX, windZ) {
    this.windX = windX;
    this.windZ = windZ;
  }
}
