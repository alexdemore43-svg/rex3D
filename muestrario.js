document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    body.classList.add('loaded', 'loading-done');
    body.style.opacity = '1';

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
    const contenedor = canvas?.parentElement || document.querySelector('#muestrario-left .contenedor-tarjeta-esfera') || document.querySelector('.contenedor-tarjeta-esfera');
    if (!canvas || !contenedor) {
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
        const rect = contenedor.getBoundingClientRect();
        return { width: Math.max(320, Math.floor(rect.width)), height: Math.max(320, Math.floor(rect.height)) };
    };

    const size = getSize();
    const camera = new THREE.PerspectiveCamera(42, size.width / size.height, 0.1, 100);
    camera.position.set(0, 0, 4);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size.width, size.height, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.physicallyCorrectLights = true;
    canvas.style.width = size.width + 'px';
    canvas.style.height = size.height + 'px';

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const setEnvironment = (texture) => {
        scene.environment = texture;
        // keep background dark for premium contrast
        scene.background = new THREE.Color(0x05070b);
    };

    const createFallbackEnvironment = () => {
        const width = 128;
        const height = 64;
        const sizeData = width * height;
        const data = new Uint8Array(sizeData * 3);
        for (let y = 0; y < height; y++) {
            const t = y / (height - 1);
            const r = Math.round(20 + 120 * (1 - t));
            const g = Math.round(24 + 96 * (1 - t));
            const b = Math.round(40 + 120 * t);
            for (let x = 0; x < width; x++) {
                const index = (x + y * width) * 3;
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
            }
        }
        const texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat);
        texture.needsUpdate = true;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(texture);
        texture.dispose();
        setEnvironment(envMap.texture);
        return envMap;
    };

    const loadHDR = (urls, index = 0) => {
        return new Promise((resolve) => {
            if (index >= urls.length) {
                resolve(null);
                return;
            }
            const loader = new THREE.RGBELoader();
            loader.setDataType(THREE.UnsignedByteType);
            loader.load(urls[index], (hdrEquirect) => {
                const envMap = pmremGenerator.fromEquirectangular(hdrEquirect);
                hdrEquirect.dispose();
                setEnvironment(envMap.texture);
                resolve(envMap);
            }, undefined, () => {
                resolve(loadHDR(urls, index + 1));
            });
        });
    };

    loadHDR(['studio.hdr', 'environment.hdr', 'env.hdr']).then((envMap) => {
        if (!envMap) {
            createFallbackEnvironment();
        }
    });

    if (THREE.RectAreaLightUniformsLib) {
        THREE.RectAreaLightUniformsLib.init();
    }

    const rectLight = new THREE.RectAreaLight(0xffffff, 3.5, 3.5, 2.2);
    rectLight.position.set(0, 1.5, 2.5);
    rectLight.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(rectLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 1.5, 10);
    cyanLight.position.set(-1.5, 1.2, 2);
    scene.add(cyanLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

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
            model.scale.set(0.5, 0.5, 0.5);
            model.traverse((child) => {
                if (child.isMesh && child.geometry && typeof child.geometry.center === 'function') {
                    child.geometry.center();
                }
            });
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
