class QuestBeacon {
    constructor(scene) {
        this.scene = scene;
        this.beacons = new Map();
        this.effectsManager = null;
    }

    createBeacon(id, position, questType = 'main') {
        const colors = {
            main: 0xffaa00,
            side: 0x00aaff,
            important: 0xff0000,
            story: 0xaa00ff
        };

        const color = colors[questType] || colors.main;
        const beacon = new THREE.Group();
        beacon.position.copy(position);
        beacon.position.y = 0;

        const height = 100;
        const segments = 8;
        const radius = 0.5;

        const pillarGeometry = new THREE.CylinderGeometry(radius, radius, height, segments, 1, true);
        const pillarMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = height / 2;
        beacon.add(pillar);

        const innerPillarGeometry = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, height, segments, 1, true);
        const innerPillarMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const innerPillar = new THREE.Mesh(innerPillarGeometry, innerPillarMaterial);
        innerPillar.position.y = height / 2;
        beacon.add(innerPillar);

        const glowGeometry = new THREE.CylinderGeometry(radius * 1.5, radius * 2, height, segments, 1, true);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = height / 2;
        beacon.add(glow);

        const topGeometry = new THREE.CircleGeometry(radius * 3, 16);
        const topMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.rotation.x = Math.PI / 2;
        top.position.y = height;
        beacon.add(top);

        const bottomGeometry = new THREE.CircleGeometry(radius * 2, 16);
        const bottomMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
        bottom.rotation.x = Math.PI / 2;
        bottom.position.y = 0.1;
        beacon.add(bottom);

        const particles = this.createParticles(color, height);
        beacon.add(particles);

        beacon.userData = {
            id,
            questType,
            color,
            height,
            particles,
            time: 0
        };

        this.scene.add(beacon);
        this.beacons.set(id, beacon);

        return beacon;
    }

    createParticles(color, height) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.5;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.random() * height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            sizes[i] = Math.random() * 8 + 4;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geometry, material);
    }

    update(deltaTime) {
        this.beacons.forEach(beacon => {
            beacon.userData.time += deltaTime;
            const time = beacon.userData.time;

            beacon.children.forEach(child => {
                if (child.material) {
                    const pulse = Math.sin(time * 2) * 0.1 + 0.3;
                    if (child.geometry.type === 'CylinderGeometry' && child.material.opacity < 0.5) {
                        child.material.opacity = pulse;
                    }
                }
            });

            const particles = beacon.userData.particles;
            if (particles) {
                const positions = particles.geometry.attributes.position.array;
                const height = beacon.userData.height;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += deltaTime * 5;
                    if (positions[i + 1] > height) {
                        positions[i + 1] = 0;
                    }
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }

            beacon.rotation.y += deltaTime * 0.5;
        });
    }

    removeBeacon(id) {
        const beacon = this.beacons.get(id);
        if (beacon) {
            this.scene.remove(beacon);
            this.beacons.delete(id);
            return true;
        }
        return false;
    }

    clearAll() {
        this.beacons.forEach(beacon => {
            this.scene.remove(beacon);
        });
        this.beacons.clear();
    }

    setQuestType(id, questType) {
        const beacon = this.beacons.get(id);
        if (!beacon) return;

        const colors = {
            main: 0xffaa00,
            side: 0x00aaff,
            important: 0xff0000,
            story: 0xaa00ff
        };

        const color = colors[questType] || colors.main;
        beacon.userData.questType = questType;
        beacon.userData.color = color;

        beacon.children.forEach(child => {
            if (child.material) {
                child.material.color.setHex(color);
            }
        });
    }
}

export default QuestBeacon;
