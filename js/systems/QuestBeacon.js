/**
 * 寻道人 - 任务光柱系统
 * 从地面到天空的光柱效果，远处可见
 */

export default class QuestBeacon {
  constructor(scene) {
    this.scene = scene;
    this.beacons = new Map();

    this.beaconColors = {
      main: 0xffd700,
      side: 0x9c27b0,
      daily: 0x00bcd4,
      boss: 0xff5252,
      escort: 0x4caf50,
      collection: 0xff9800,
    };

    this.beaconHeight = 50;
    this.beaconRadius = 2.5;
  }

  createBeacon(id, position, questType = "main") {
    if (this.beacons.has(id)) {
      this.updateBeacon(id, position, questType);
      return this.beacons.get(id);
    }

    const color = this.beaconColors[questType] || this.beaconColors.main;
    const beacon = this.createBeaconMesh(color);

    beacon.position.set(position.x, this.beaconHeight / 2, position.z);
    beacon.userData = { id, questType, baseY: this.beaconHeight / 2 };

    this.scene.add(beacon);
    this.beacons.set(id, beacon);

    return beacon;
  }

  createBeaconMesh(color) {
    const group = new THREE.Group();

    const outerPillarGeometry = new THREE.CylinderGeometry(
      this.beaconRadius * 0.8,
      this.beaconRadius * 1.5,
      this.beaconHeight,
      32,
      1,
      true
    );
    const outerPillarMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const outerPillar = new THREE.Mesh(outerPillarGeometry, outerPillarMaterial);
    group.add(outerPillar);

    const pillarGeometry = new THREE.CylinderGeometry(
      this.beaconRadius * 0.4,
      this.beaconRadius * 0.9,
      this.beaconHeight,
      32,
      1,
      true
    );
    const pillarMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    group.add(pillar);

    const coreGeometry = new THREE.CylinderGeometry(
      this.beaconRadius * 0.15,
      this.beaconRadius * 0.4,
      this.beaconHeight,
      16,
      1,
      true
    );
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const baseRingGeometry = new THREE.RingGeometry(3, 6, 64);
    const baseRingMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const baseRing = new THREE.Mesh(baseRingGeometry, baseRingMaterial);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = -this.beaconHeight / 2;
    group.add(baseRing);

    const baseRing2Geometry = new THREE.RingGeometry(1, 3, 64);
    const baseRing2Material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const baseRing2 = new THREE.Mesh(baseRing2Geometry, baseRing2Material);
    baseRing2.rotation.x = -Math.PI / 2;
    baseRing2.position.y = -this.beaconHeight / 2 + 0.1;
    group.add(baseRing2);

    const topRingGeometry = new THREE.RingGeometry(2, 4, 64);
    const topRingMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const topRing = new THREE.Mesh(topRingGeometry, topRingMaterial);
    topRing.rotation.x = -Math.PI / 2;
    topRing.position.y = this.beaconHeight / 2;
    group.add(topRing);

    const particles = this.createParticleEffect(color);
    group.add(particles);

    return group;
  }

  createParticleEffect(color) {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.beaconRadius * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.beaconHeight;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      velocities.push({
        y: 0.8 + Math.random() * 0.8,
        angle: angle,
        radius: radius,
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    particles.userData.time = 0;

    return particles;
  }

  updateBeacon(id, position, questType) {
    const beacon = this.beacons.get(id);
    if (!beacon) return;

    const newColor = this.beaconColors[questType] || this.beaconColors.main;
    const currentColor = beacon.children[0].material.color.getHex();

    if (currentColor !== newColor) {
      beacon.children.forEach((child) => {
        if (child.material) {
          child.material.color.setHex(newColor);
        }
        if (child.children) {
          child.children.forEach((subChild) => {
            if (subChild.material) {
              subChild.material.color.setHex(newColor);
            }
          });
        }
      });
    }

    beacon.position.set(position.x, this.beaconHeight / 2, position.z);
  }

  removeBeacon(id) {
    const beacon = this.beacons.get(id);
    if (!beacon) return;

    this.scene.remove(beacon);

    beacon.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.beacons.delete(id);
  }

  update(deltaTime) {
    this.beacons.forEach((beacon) => {
      const time = performance.now() * 0.001;

      beacon.children.forEach((child) => {
        if (child.type === "Mesh" && child.geometry.type === "CylinderGeometry") {
          child.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
        }

        if (child.type === "Mesh" && child.geometry.type === "RingGeometry") {
          child.rotation.z = time * 0.5;
          child.material.opacity = 0.3 + Math.sin(time * 3) * 0.2;
        }
      });

      const particles = beacon.children.find((c) => c.type === "Points");
      if (particles && particles.userData.velocities) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        particles.userData.time += deltaTime;
        const t = particles.userData.time;

        for (let i = 0; i < velocities.length; i++) {
          const vel = velocities[i];
          const normalizedY = (t * vel.y) % 1;
          positions[i * 3 + 1] = (normalizedY - 0.5) * this.beaconHeight;

          const angle = vel.angle + t * 0.5;
          const radius = vel.radius * (1 + Math.sin(t * 2) * 0.2);
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
        }

        particles.geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  clear() {
    this.beacons.forEach((beacon, id) => {
      this.removeBeacon(id);
    });
  }

  getBeaconColor(questType) {
    return this.beaconColors[questType] || this.beaconColors.main;
  }
}
