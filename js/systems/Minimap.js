/**
 * 寻道人 - 小地图系统
 * 正交视角俯视小地图，使用独立RenderTarget渲染
 */

export default class Minimap {
  constructor(game) {
    this.game = game;

    this.size = 200;
    this.worldSize = 60;
    this.renderTarget = null;
    this.orthoCamera = null;
    this.scene = null;

    this.playerMarker = null;
    this.npcMarkers = new Map();
    this.monsterMarkers = new Map();

    this.container = null;
    this.canvas = null;
    this.ctx = null;

    this.colors = {
      player: 0x00ff88,
      npc: 0x4fc3f7,
      monster: 0xff5252,
      background: 0x1a1a2e,
      grid: 0x2a2a4e,
    };

    this.enabled = true;
  }

  init() {
    this.createRenderTarget();
    this.createOrthoCamera();
    this.createMinimapScene();
    this.createUI();
    console.log("小地图系统初始化完成");
  }

  createRenderTarget() {
    this.renderTarget = new THREE.WebGLRenderTarget(this.size, this.size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }

  createOrthoCamera() {
    const halfSize = this.worldSize / 2;
    this.orthoCamera = new THREE.OrthographicCamera(-halfSize, halfSize, halfSize, -halfSize, 0.1, 1000);
    this.orthoCamera.position.set(0, 100, 0);
    this.orthoCamera.lookAt(0, 0, 0);
    this.orthoCamera.up.set(0, 0, -1);
  }

  createMinimapScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.background);

    const gridHelper = new THREE.GridHelper(this.worldSize, 20, this.colors.grid, this.colors.grid);
    gridHelper.position.y = 0.1;
    this.scene.add(gridHelper);

    this.createPlayerMarker();
  }

  createPlayerMarker() {
    const geometry = new THREE.CircleGeometry(1.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.colors.player,
      transparent: true,
      opacity: 0.9,
    });
    this.playerMarker = new THREE.Mesh(geometry, material);
    this.playerMarker.rotation.x = -Math.PI / 2;
    this.playerMarker.position.y = 2;
    this.scene.add(this.playerMarker);

    const ringGeometry = new THREE.RingGeometry(1.8, 2.2, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.player,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.playerMarker.add(ring);

    const dirGeometry = new THREE.ConeGeometry(0.6, 2, 4);
    const dirMaterial = new THREE.MeshBasicMaterial({ color: this.colors.player });
    const direction = new THREE.Mesh(dirGeometry, dirMaterial);
    direction.position.set(0, 0, -2.5);
    direction.rotation.x = Math.PI;
    this.playerMarker.add(direction);
  }

  createNPCMarker(npc) {
    const geometry = new THREE.CircleGeometry(1.2, 12);
    const material = new THREE.MeshBasicMaterial({
      color: this.colors.npc,
      transparent: true,
      opacity: 0.9,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(npc.position.x, 1, npc.position.z);
    this.scene.add(marker);
    this.npcMarkers.set(npc.id, marker);
    return marker;
  }

  createMonsterMarker(monster) {
    const geometry = new THREE.CircleGeometry(1, 8);
    const material = new THREE.MeshBasicMaterial({
      color: this.colors.monster,
      transparent: true,
      opacity: 0.8,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(monster.position.x, 0.5, monster.position.z);
    this.scene.add(marker);
    this.monsterMarkers.set(monster.uuid, marker);
    return marker;
  }

  updatePlayerMarker(player) {
    if (!this.playerMarker || !player) return;

    this.playerMarker.position.x = player.position.x;
    this.playerMarker.position.z = player.position.z;
    this.playerMarker.rotation.z = player.rotation;
  }

  updateNPCMarker(npc) {
    let marker = this.npcMarkers.get(npc.id);
    if (!marker) {
      marker = this.createNPCMarker(npc);
    }
    marker.position.x = npc.position.x;
    marker.position.z = npc.position.z;
    marker.visible = !npc.hidden;
  }

  updateMonsterMarker(monster) {
    let marker = this.monsterMarkers.get(monster.uuid);

    if (monster.isDead) {
      if (marker) {
        marker.visible = false;
      }
      return;
    }

    if (!marker) {
      marker = this.createMonsterMarker(monster);
    }

    marker.position.x = monster.position.x;
    marker.position.z = monster.position.z;
    marker.visible = true;
  }

  removeMonsterMarker(monster) {
    const marker = this.monsterMarkers.get(monster.uuid);
    if (marker) {
      this.scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
      this.monsterMarkers.delete(monster.uuid);
    }
  }

  createUI() {
    this.container = document.getElementById("minimap-container");
    if (!this.container) {
      console.warn("小地图容器未找到");
      return;
    }

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.className = "minimap-canvas";
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
  }

  render(renderer) {
    if (!this.enabled || !this.renderTarget || !this.scene || !this.orthoCamera) return;

    const originalTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.orthoCamera);
    renderer.setRenderTarget(originalTarget);

    this.renderToCanvas();
  }

  renderToCanvas() {
    if (!this.ctx || !this.renderTarget) return;

    const width = this.size;
    const height = this.size;

    const buffer = new Uint8Array(width * height * 4);
    this.game.renderer.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, width, height, buffer);

    const imageData = this.ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = ((height - 1 - y) * width + x) * 4;
        const dstIndex = (y * width + x) * 4;
        imageData.data[dstIndex] = buffer[srcIndex];
        imageData.data[dstIndex + 1] = buffer[srcIndex + 1];
        imageData.data[dstIndex + 2] = buffer[srcIndex + 2];
        imageData.data[dstIndex + 3] = buffer[srcIndex + 3];
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  updateCamera(player) {
    if (!this.orthoCamera || !player) return;

    this.orthoCamera.position.x = player.position.x;
    this.orthoCamera.position.y = 100;
    this.orthoCamera.position.z = player.position.z;
    this.orthoCamera.lookAt(player.position.x, 0, player.position.z);
  }

  update(deltaTime, player, npcs, monsters) {
    if (!this.enabled) return;

    this.updateCamera(player);
    this.updatePlayerMarker(player);

    if (npcs) {
      npcs.forEach((npc) => this.updateNPCMarker(npc));
    }

    if (monsters) {
      monsters.forEach((monster) => this.updateMonsterMarker(monster));
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (this.container) {
      this.container.style.display = enabled ? "block" : "none";
    }
  }

  dispose() {
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }

    this.npcMarkers.forEach((marker) => {
      marker.geometry.dispose();
      marker.material.dispose();
    });

    this.monsterMarkers.forEach((marker) => {
      marker.geometry.dispose();
      marker.material.dispose();
    });

    this.npcMarkers.clear();
    this.monsterMarkers.clear();
  }
}
