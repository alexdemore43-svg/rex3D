document.addEventListener('DOMContentLoaded', () => {
    // Header scroll behavior (independent)
    const header = document.getElementById('main-header');
    let lastY = window.scrollY || 0;
    const onScrollHeader = () => {
        if (!header) return;
        const currentY = window.scrollY || 0;
        if (currentY > 20) header.classList.add('scroll-active'); else header.classList.remove('scroll-active');
        if (currentY > lastY && currentY > 50) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        lastY = currentY;
    };
    window.addEventListener('scroll', () => requestAnimationFrame(onScrollHeader), { passive: true });
    onScrollHeader();

    // Canvas and wrapper
    const canvas = document.getElementById('muestrario-canvas');
    const wrapper = document.querySelector('#muestrario-left .muestrario-canvas-wrapper') || document.querySelector('.muestrario-canvas-wrapper');
    if (!canvas || !wrapper) {
        console.warn('muestrario: canvas or wrapper not found');
        return;
    }

    // Three.js scene
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070b);

    const getSize = () => {
        const rect = wrapper.getBoundingClientRect();
        return { width: Math.max(320, Math.floor(rect.width)), height: Math.max(320, Math.floor(rect.height)) };
    };

    const size = getSize();
    const camera = new THREE.PerspectiveCamera(42, size.width / size.height, 0.1, 100);
    camera.position.set(0, 0, 1.8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size.width, size.height, false);
    canvas.style.width = size.width + 'px';
    canvas.style.height = size.height + 'px';

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(2, 2, 2);
    const fill = new THREE.DirectionalLight(0x92f8ff, 0.45);
    fill.position.set(-2, 1.2, 1);
    const rim = new THREE.DirectionalLight(0x68f7ff, 0.35);
    rim.position.set(-1.5, 2, -1.5);
    scene.add(ambient, key, fill, rim);

    let model = null;

    const buildMaterial = ({ color = 0x888888, metalness = 0, roughness = 0.8, emissive = 0x000000 }) => {
        return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, envMapIntensity: 1, clearcoat: metalness > 0.9 ? 0.18 : 0, clearcoatRoughness: metalness > 0.9 ? 0.12 : 1 });
    };

    const materialPresets = {
        'primer-gris': { color: 0x8f9398, metalness: 0.0, roughness: 0.8, emissive: 0x020202 },
        'primer-negro': { color: 0x121212, metalness: 0.0, roughness: 0.8, emissive: 0x040404 },
        'hidrocromo-verde': { color: 0x00ff99, metalness: 1.0, roughness: 0.05, emissive: 0x002222 },
        'hidrocromo-plata': { color: 0xd6d8de, metalness: 1.0, roughness: 0.05, emissive: 0x111111 },
    };

    const applyMaterialToModel = (key) => {
        if (!model) return;
        const preset = materialPresets[key] || materialPresets['primer-gris'];
        const mat = buildMaterial(preset);
        model.traverse((node) => {
            if (node.isMesh) {
                node.material = mat;
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
    };

    // Fallback box for debug
    const addFallback = () => {
        const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.1, roughness: 0.5 });
        const box = new THREE.Mesh(geo, mat);
        scene.add(box);
        model = box;
        applyMaterialToModel('primer-gris');
    };

    // Load GLTF
    try {
        const loader = new THREE.GLTFLoader();
        loader.load('shader_ball.glb', (gltf) => {
            model = gltf.scene;
            model.rotation.y = 0;
            model.scale.set(1.05, 1.05, 1.05);
            scene.add(model);
            applyMaterialToModel('primer-gris');
        }, undefined, (err) => {
            console.warn('muestrario: GLTF load failed, using fallback box', err);
            addFallback();
        });
    } catch (e) {
        console.error('muestrario: loader error', e);
        addFallback();
    }

    const animate = () => {
        if (model) model.rotation.y += 0.003;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    animate();

    // Resize handling
    const onResize = () => {
        const s = getSize();
        renderer.setSize(s.width, s.height, false);
        camera.aspect = s.width / s.height;
        camera.updateProjectionMatrix();
        canvas.style.width = s.width + 'px';
        canvas.style.height = s.height + 'px';
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Buttons
    const buttons = document.querySelectorAll('.finish-button');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const key = btn.dataset.material;
            applyMaterialToModel(key);
        });
    });

});
