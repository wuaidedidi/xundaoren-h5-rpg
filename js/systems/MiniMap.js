class MiniMap {
  constructor(mainRenderer, scene) {
    this.mainRenderer = mainRenderer;
    this.scene = scene;
    this.size = 200;
    this.viewDistance = 30;

    this.minimapCamera = null;
    this.renderTarget = null;
    this.minimapElement = null;
    this.markers = new Map();
  }

  init() {
    this.createRenderTarget();
    this.createCamera();
    this.createUIElement();
    this.setupResizeHandler();

    console.log("小地图系统初始化完成");
  }

  createRenderTarget() {
    this.renderTarget = new THREE.WebGLRenderTarget(this.size, this.size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
  }

  createCamera() {
    this.minimapCamera = new THREE.OrthographicCamera(
      -this.viewDistance,
      this.viewDistance,
      this.viewDistance,
      -this.viewDistance,
      1,
      1000
    );
    this.minimapCamera.position.set(0, 100, 0);
    this.minimapCamera.lookAt(0, 0, 0);
    this.minimapCamera.rotation.order = "YXZ";
  }

  createUIElement() {
    this.minimapElement = document.createElement("div");
    this.minimapElement.id = "minimap-container";
    this.minimapElement.className = "minimap-container";

    const canvas = document.createElement("canvas");
    canvas.id = "minimap-canvas";
    canvas.width = this.size;
    canvas.height = this.size;

    this.minimapElement.appendChild(canvas);
    document.body.appendChild(this.minimapElement);

    this.minimapContext = canvas.getContext("2d");
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updatePosition();
    });
    setTimeout(() => this.updatePosition(), 100);
  }

  updatePosition() {
    const padding = 20;
    this.minimapElement.style.right = padding + "px";
    this.minimapElement.style.top = padding + "px";
  }

  update(playerPosition, npcs, monsters, questBeacons = []) {
    this.minimapCamera.position.x = playerPosition.x;
    this.minimapCamera.position.z = playerPosition.z;
    this.minimapCamera.lookAt(playerPosition.x, 0, playerPosition.z);

    this.mainRenderer.setRenderTarget(this.renderTarget);
    this.mainRenderer.clear();
    this.mainRenderer.render(this.scene, this.minimapCamera);
    this.mainRenderer.setRenderTarget(null);

    this.copyRenderTargetToCanvas();

    this.drawMarkers(playerPosition, npcs, monsters, questBeacons);
  }

  copyRenderTargetToCanvas() {
    const pixels = new Uint8Array(this.size * this.size * 4);
    this.mainRenderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.size, this.size, pixels);

    const imageData = this.minimapContext.createImageData(this.size, this.size);
    for (let i = 0; i < pixels.length; i += 4) {
      const srcIndex = i;
      const y = Math.floor(i / 4 / this.size);
      const x = (i / 4) % this.size;
      const destIndex = ((this.size - 1 - y) * this.size + x) * 4;

      imageData.data[destIndex] = pixels[srcIndex];
      imageData.data[destIndex + 1] = pixels[srcIndex + 1];
      imageData.data[destIndex + 2] = pixels[srcIndex + 2];
      imageData.data[destIndex + 3] = 255;
    }

    this.minimapContext.putImageData(imageData, 0, 0);
  }

  drawMarkers(playerPosition, npcs, monsters, questBeacons = []) {
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const scale = this.size / (this.viewDistance * 2);

    npcs.forEach((npc) => {
      if (!npc.mesh) return;
      const pos = npc.mesh.position;
      const x = centerX + (pos.x - playerPosition.x) * scale;
      const y = centerY - (pos.z - playerPosition.z) * scale;
      this.drawMarker(x, y, 4, "#00ff00");
    });

    monsters.forEach((monster) => {
      if (!monster.mesh || monster.isDead) return;
      const pos = monster.mesh.position;
      const x = centerX + (pos.x - playerPosition.x) * scale;
      const y = centerY - (pos.z - playerPosition.z) * scale;
      this.drawMarker(x, y, 4, "#ff0000");
    });

    this.drawMarker(centerX, centerY, 6, "#ffff00", true);

    questBeacons.forEach((beacon) => {
      const pos = beacon.position;
      const x = centerX + (pos.x - playerPosition.x) * scale;
      const y = centerY - (pos.z - playerPosition.z) * scale;
      const color = "#" + beacon.userData.color.toString(16).padStart(6, "0");
      this.drawQuestMarker(x, y, color, beacon.userData.questType);
    });
  }

  drawMarker(x, y, radius, color, glow = false) {
    if (glow) {
      this.minimapContext.beginPath();
      this.minimapContext.arc(x, y, radius + 2, 0, Math.PI * 2);
      this.minimapContext.fillStyle = "rgba(255, 255, 0, 0.3)";
      this.minimapContext.fill();
    }

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, radius, 0, Math.PI * 2);
    this.minimapContext.fillStyle = color;
    this.minimapContext.fill();

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, radius - 1, 0, Math.PI * 2);
    this.minimapContext.strokeStyle = "rgba(255, 255, 255, 0.5)";
    this.minimapContext.lineWidth = 1;
    this.minimapContext.stroke();
  }

  drawQuestMarker(x, y, color, questType) {
    this.minimapContext.save();

    const time = Date.now() * 0.001;
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;
    const rotatePulse = Math.sin(time * 2) * 0.5 + 0.5;
    const rgb = this.hexToRgb(color);

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, 16 * pulse, 0, Math.PI * 2);
    this.minimapContext.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
    this.minimapContext.fill();

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, 12 * pulse, 0, Math.PI * 2);
    this.minimapContext.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.3 * pulse})`;
    this.minimapContext.fill();

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, 9, 0, Math.PI * 2);
    this.minimapContext.strokeStyle = `rgba(255, 255, 255, 0.8)`;
    this.minimapContext.lineWidth = 2;
    this.minimapContext.stroke();

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, 8, 0, Math.PI * 2);
    this.minimapContext.fillStyle = color;
    this.minimapContext.fill();

    this.minimapContext.beginPath();
    this.minimapContext.arc(x, y, 4, 0, Math.PI * 2);
    this.minimapContext.fillStyle = "#ffffff";
    this.minimapContext.fill();

    const typeText =
      questType === "main" ? "主" : questType === "side" ? "支" : questType === "important" ? "重" : "剧";

    this.minimapContext.font = "bold 12px Arial";
    this.minimapContext.textAlign = "center";
    this.minimapContext.textBaseline = "middle";

    this.minimapContext.strokeStyle = "rgba(255, 255, 255, 0.9)";
    this.minimapContext.lineWidth = 3;
    this.minimapContext.strokeText(typeText, x, y + 15);

    this.minimapContext.fillStyle = color;
    this.minimapContext.fillText(typeText, x, y + 15);

    this.minimapContext.restore();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 170, b: 0 };
  }

  dispose() {
    if (this.minimapElement && this.minimapElement.parentNode) {
      this.minimapElement.parentNode.removeChild(this.minimapElement);
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
  }
}

export default MiniMap;
