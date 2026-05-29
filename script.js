document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const loadingLine = document.getElementById('loadingLine');
    const header = document.getElementById('main-header');
    const heroTitle = document.querySelector('.hero-title');
    const revealElements = document.querySelectorAll('.reveal');
    const modal = document.getElementById('modal-cotizacion');
    const modalBackdrop = document.querySelector('.quote-modal-backdrop');
    const closeButton = document.querySelector('.modal-close');
    const stickyQuoteBtn = document.getElementById('btn-cotizar-flotante');
    const prevButtons = document.querySelectorAll('.prev-step');
    const confirmButton = document.getElementById('btn-confirmar');
    const btnNextPaso1 = document.getElementById('btn-siguiente-paso-1');
    const btnNextPaso2 = document.getElementById('btn-siguiente-paso-2');
    const btnNextPaso3 = document.getElementById('btn-siguiente-paso-3');
    const btnPrevPaso2 = document.getElementById('btn-anterior-paso-2');
    const btnPrevPaso3 = document.getElementById('btn-anterior-paso-3');
    const btnPrevPaso4 = document.getElementById('btn-anterior-paso-4');
    const btnUploadImages = document.getElementById('btn-subir-imagenes');
    const inputImagenes = document.getElementById('input-imagenes');
    const muestrarioCanvas = document.getElementById('muestrario-canvas') || document.getElementById('muestrarioCanvas');
    const materialButtons = document.querySelectorAll('.finish-button');
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');
    const paso3 = document.getElementById('paso-3');
    const paso4 = document.getElementById('paso-4');
    const selectBase = document.getElementById('acabadoSelect');
    const selectEffect = document.getElementById('efectoSelect');
    const inputLargo = document.getElementById('input-largo');
    const inputAncho = document.getElementById('input-ancho');
    const inputAlto = document.getElementById('input-alto');
    const estimateResult = document.getElementById('estimateResult');
    const quoteErrorPaso1 = document.getElementById('quoteError-paso-1');
    const quoteErrorPaso2 = document.getElementById('quoteError-paso-2');
    const quoteErrorPaso3 = document.getElementById('quoteError-paso-3');
    const detailOverlay = document.getElementById('detailOverlay');
    const detailButtons = document.querySelectorAll('.detail-card');
    const detailPanels = document.querySelectorAll('.detail-panel');
    const detailClose = document.querySelector('.detail-close');
    let ticking = false;

    const finishLoading = () => {
        body.classList.add('loaded');
        setTimeout(() => {
            body.classList.add('loading-done');
            loadingLine.style.opacity = '0';
        }, 300);
    };

    requestAnimationFrame(() => {
        loadingLine.style.width = '100%';
        setTimeout(finishLoading, 1200);
    });

        // --- Control Panel (Acordeón) & Material update helpers ---
        function setupControlPanel() {
            const accordion = document.getElementById('customAccordion');
            if (!accordion) return;

            accordion.addEventListener('click', (e) => {
                const header = e.target.closest('.accordion-header');
                if (!header) return;
                const item = header.parentElement;
                // close others (acordeón limpio)
                accordion.querySelectorAll('.accordion-item').forEach(i => {
                    if (i !== item) i.classList.remove('open');
                });
                item.classList.toggle('open');
            });

            // Color palette
            document.querySelectorAll('.color-swatch').forEach(btn => {
                btn.addEventListener('click', () => {
                    const hex = btn.dataset.hex;
                    const picker = document.getElementById('colorPicker');
                    const hexInput = document.getElementById('colorHex');
                    if (picker) picker.value = hex;
                    if (hexInput) hexInput.value = hex;
                    updateMeshMaterial('color', hex);
                });
            });

            const colorPicker = document.getElementById('colorPicker');
            const colorHex = document.getElementById('colorHex');
            if (colorPicker) {
                colorPicker.addEventListener('input', () => {
                    if (colorHex) colorHex.value = colorPicker.value;
                    updateMeshMaterial('color', colorPicker.value);
                });
            }
            if (colorHex) {
                colorHex.addEventListener('change', () => {
                    let val = colorHex.value.trim();
                    if (!val) return;
                    if (!val.startsWith('#')) val = '#'+val;
                    if (colorPicker) colorPicker.value = val;
                    colorHex.value = val;
                    updateMeshMaterial('color', val);
                });
            }

            // Primers
            document.querySelectorAll('input[name="primer"]').forEach(r => {
                r.addEventListener('change', () => updateMeshMaterial('primer', r.value));
            });

            // Finishes
            document.querySelectorAll('input[name="finish"]').forEach(r => {
                r.addEventListener('change', () => updateMeshMaterial('finish', r.value));
            });

            // Effects (checkboxes)
            const effectCheckboxes = Array.from(document.querySelectorAll('input[name="effect"]'));
            effectCheckboxes.forEach(cb => cb.addEventListener('change', () => {
                const selected = effectCheckboxes.filter(c=>c.checked).map(c=>c.value);
                updateMeshMaterial('effects', selected);
            }));
        }

        const finishPresets = {
            'Mate': { roughness: 0.85, metalness: 0.05 },
            'Satinado': { roughness: 0.45, metalness: 0.08 },
            'Brillo': { roughness: 0.08, metalness: 0.12 },
            'MC00': { roughness: 0.18, metalness: 0.8 },
            'Hidrocromo': { roughness: 0.02, metalness: 0.95, envMapIntensity: 1.2 },
            'Tornasol': { roughness: 0.12, metalness: 0.6, iridescence: true },
            'Cromo Técnico': { roughness: 0.0, metalness: 1.0, envMapIntensity: 1.6 }
        };

        function updateMeshMaterial(type, value) {
            // Placeholder centralizada para conectar con Three.js
            console.log('updateMeshMaterial ->', type, value);

            const rexAvailable = typeof window.rexApplyMaterialProps === 'function' || typeof window.rexSetColor === 'function';
            const model = window.rexModel || null;

            if (type === 'finish') {
                const preset = finishPresets[value];
                if (rexAvailable && preset) {
                    // apply preset props to all meshes
                    const props = {};
                    if (typeof preset.roughness !== 'undefined') props.roughness = preset.roughness;
                    if (typeof preset.metalness !== 'undefined') props.metalness = preset.metalness;
                    if (typeof preset.envMapIntensity !== 'undefined') props.envMapIntensity = preset.envMapIntensity;
                    window.rexApplyMaterialProps(props);
                } else {
                    // fallback: try to target a single mesh
                    const mesh = window.rexMesh || window.sphereMesh || null;
                    if (preset && mesh && mesh.material) {
                        const mat = mesh.material;
                        if (typeof preset.roughness !== 'undefined') mat.roughness = preset.roughness;
                        if (typeof preset.metalness !== 'undefined') mat.metalness = preset.metalness;
                        if (typeof preset.envMapIntensity !== 'undefined') mat.envMapIntensity = preset.envMapIntensity;
                        if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                    }
                }
            }

            if (type === 'color') {
                if (rexAvailable && typeof window.rexSetColor === 'function') {
                    window.rexSetColor(value);
                } else {
                    const mesh = window.rexMesh || window.sphereMesh || null;
                    if (mesh && mesh.material && mesh.material.color) {
                        try { mesh.material.color.set(value); } catch (err) { console.warn('Could not set color', err); }
                        if (mesh.material.needsUpdate !== undefined) mesh.material.needsUpdate = true;
                    }
                }
            }

            if (type === 'primer') {
                // map primers to props or presets
                if (rexAvailable && model) {
                    if (value === 'Gris Base') window.rexApplyMaterialProps({ roughness: Math.max(0.6, 0.6), metalness: 0 });
                    if (value === 'Blanco Detalle') window.rexApplyMaterialProps({ roughness: 0.45 });
                    if (value === 'Negro Profundo') window.rexApplyMaterialProps({ roughness: 0.3, metalness: 0.12, color: 0x0a0a0a });
                    if (typeof window.rexSetColor === 'function') {
                        if (value === 'Gris Base') window.rexSetColor('#9e9e9e');
                        if (value === 'Blanco Detalle') window.rexSetColor('#ffffff');
                        if (value === 'Negro Profundo') window.rexSetColor('#0a0a0a');
                    }
                } else {
                    const mesh = window.rexMesh || window.sphereMesh || null;
                    if (mesh && mesh.material) {
                        const mat = mesh.material;
                        if (value === 'Gris Base') { if (mat.color) mat.color.set('#9e9e9e'); mat.roughness = Math.max(mat.roughness || 0, 0.6); }
                        if (value === 'Blanco Detalle') { if (mat.color) mat.color.set('#ffffff'); mat.roughness = 0.45; }
                        if (value === 'Negro Profundo') { if (mat.color) mat.color.set('#0a0a0a'); mat.roughness = 0.3; mat.metalness = 0.12; }
                        if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                    }
                }
            }

            if (type === 'effects') {
                const effects = Array.isArray(value) ? value : [];
                if (rexAvailable && model) {
                    // handle luminiscente
                    if (effects.includes('Luminiscente')) window.rexApplyMaterialProps({ emissive: new THREE.Color('#00ffcc'), emissiveIntensity: 0.8 });
                    else window.rexApplyMaterialProps({ emissive: new THREE.Color('#000000'), emissiveIntensity: 0 });
                    if (effects.includes('Metalizado')) window.rexApplyMaterialProps({ metalness: 0.9 });
                    if (effects.includes('Texturizado')) window.rexApplyMaterialProps({ roughness: 0.7 });
                } else {
                    const mesh = window.rexMesh || window.sphereMesh || null;
                    if (mesh && mesh.material) {
                        const mat = mesh.material;
                        if (effects.includes('Luminiscente')) {
                            if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);
                            mat.emissive.set('#00ffcc');
                            mat.emissiveIntensity = 0.8;
                        } else {
                            if (mat.emissive) mat.emissive.set('#000000');
                            mat.emissiveIntensity = 0;
                        }
                        if (effects.includes('Metalizado')) mat.metalness = Math.max(mat.metalness || 0, 0.9);
                        if (effects.includes('Texturizado')) mat.roughness = Math.max(mat.roughness || 0.2, 0.7);
                        if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                    }
                }
            }
        }

        // Inicializa los listeners del panel tras DOMContentLoaded
        try { setupControlPanel(); } catch (err) { console.warn('Control panel init failed', err); }

    let lastScrollY = window.scrollY || 0;
    const updateHeader = () => {
        if (!header) return;
        const currentY = window.scrollY || 0;
        // add compact/contrast state when scrolled a bit
        if (currentY > 20) {
            header.classList.add('scroll-active');
        } else {
            header.classList.remove('scroll-active');
        }
        // hide on scroll down, show on scroll up (smooth)
        if (currentY > lastScrollY && currentY > 50) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        lastScrollY = currentY;
    };

    const updateParallax = () => {
        if (heroTitle) {
            const offset = window.scrollY * 0.18;
            heroTitle.style.transform = `translateY(${offset * -1}px)`;
        }
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateHeader();
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeader();

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    revealElements.forEach((element) => revealObserver.observe(element));

    const getMaterialFactor = (material) => {
        const map = {
            'Filamento Directo': 0.005,
            'Acabado Plus': 0.012,
        };
        return map[material] || 0.005;
    };

    const formatCurrency = (value) => {
        return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
    };

    const buildMuestrarioMaterial = ({ color, metalness, roughness, emissive = 0x000000 }) => {
        return new THREE.MeshStandardMaterial({
            color,
            metalness,
            roughness,
            emissive,
            envMapIntensity: 1,
            clearcoat: metalness > 0.9 ? 0.18 : 0,
            clearcoatRoughness: metalness > 0.9 ? 0.12 : 1,
        });
    };

    let muestrarioScene = null;
    let muestrarioCamera = null;
    let muestrarioRenderer = null;
    let muestrarioModel = null;

    const resizeMuestrario = () => {
        // try to find the most specific wrapper present on the page
        const wrapper = document.querySelector('#muestrario-left .muestrario-canvas-wrapper') || document.querySelector('#muestrario-acabados .muestrario-canvas-wrapper') || document.querySelector('.muestrario-canvas-wrapper');
        if (!muestrarioCanvas || !muestrarioRenderer || !muestrarioCamera || !wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const width = Math.max(Math.floor(rect.width), 320);
        const height = Math.max(Math.floor(rect.height), 320);
        muestrarioRenderer.setSize(width, height, false);
        muestrarioCamera.aspect = width / height;
        muestrarioCamera.updateProjectionMatrix();
        muestrarioCanvas.style.width = width + 'px';
        muestrarioCanvas.style.height = height + 'px';
    };

    const applyMuestrarioMaterial = (materialKey) => {
        if (!muestrarioModel) return;
        const materialPresets = {
            'primer-gris': { color: 0x8f9398, metalness: 0.0, roughness: 0.85, emissive: 0x020202 },
            'primer-negro': { color: 0x121212, metalness: 0.0, roughness: 0.85, emissive: 0x040404 },
            'hidrocromo-verde': { color: 0x00ff99, metalness: 1.0, roughness: 0.03, emissive: 0x002222 },
            'hidrocromo-plata': { color: 0xd6d8de, metalness: 1.0, roughness: 0.03, emissive: 0x111111 },
        };
        const preset = materialPresets[materialKey] || materialPresets['primer-gris'];
        const material = buildMuestrarioMaterial(preset);
        muestrarioModel.traverse((node) => {
            if (node.isMesh) {
                node.material = material;
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
    };

    const initMuestrario = () => {
        const wrapper = document.querySelector('#muestrario-left .muestrario-canvas-wrapper') || document.querySelector('#muestrario-acabados .muestrario-canvas-wrapper') || document.querySelector('.muestrario-canvas-wrapper');
        if (!muestrarioCanvas || typeof THREE === 'undefined' || !wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const width = Math.max(Math.floor(rect.width), 320);
        const height = Math.max(Math.floor(rect.height), 320);
        muestrarioScene = new THREE.Scene();
        muestrarioScene.background = new THREE.Color(0x05070b);

        muestrarioCamera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        muestrarioCamera.position.set(0, 0, 1.8);

        muestrarioRenderer = new THREE.WebGLRenderer({ canvas: muestrarioCanvas, antialias: true, alpha: true });
        muestrarioRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        muestrarioRenderer.setSize(width, height, false);
        muestrarioCanvas.style.width = width + 'px';
        muestrarioCanvas.style.height = height + 'px';

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(2, 2, 2);
        const fillLight = new THREE.DirectionalLight(0x92f8ff, 0.45);
        fillLight.position.set(-2, 1.2, 1);
        const rimLight = new THREE.DirectionalLight(0x68f7ff, 0.35);
        rimLight.position.set(-1.5, 2, -1.5);

        muestrarioScene.add(ambientLight, keyLight, fillLight, rimLight);

        const loader = new THREE.GLTFLoader();
        loader.load(
            'shader_ball.glb',
            (gltf) => {
                muestrarioModel = gltf.scene;
                muestrarioModel.rotation.y = 0;
                muestrarioModel.scale.set(1.05, 1.05, 1.05);
                muestrarioScene.add(muestrarioModel);
                applyMuestrarioMaterial('primer-gris');
            },
            undefined,
            (error) => {
                console.error('Error cargando shader_ball.glb:', error);
            }
        );

        const animate = () => {
            if (muestrarioModel) {
                muestrarioModel.rotation.y += 0.003;
            }
            muestrarioRenderer.render(muestrarioScene, muestrarioCamera);
            requestAnimationFrame(animate);
        };

        animate();
        window.addEventListener('resize', resizeMuestrario, { passive: true });
    };

    const setStep = (step) => {
        [paso1, paso2, paso3, paso4].forEach((element, index) => {
            if (!element) return;
            element.style.display = index + 1 === step ? 'block' : 'none';
        });
        if (step === 4) {
            updateEstimateResult();
        }
    };

    const clearErrors = () => {
        [quoteErrorPaso1, quoteErrorPaso2, quoteErrorPaso3].forEach((el) => {
            if (el) el.textContent = '';
        });
    };

    const displayError = (step, message) => {
        const map = {
            1: quoteErrorPaso1,
            2: quoteErrorPaso2,
            3: quoteErrorPaso3,
        };
        if (map[step]) map[step].textContent = message;
    };

    const abrirCotizador = () => {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        setStep(1);
        clearErrors();
        if (estimateResult) {
            estimateResult.style.display = 'none';
            estimateResult.innerHTML = '';
        }
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        body.style.overflow = 'auto';
    };

    const validarPaso1 = () => {
        if (!selectBase || !selectEffect) return false;
        const tipoBase = selectBase.value;
        const efecto = selectEffect.value;
        if (!tipoBase || !efecto) {
            displayError(1, 'Selecciona una Base y un Efecto antes de continuar.');
            return false;
        }
        displayError(1, '');
        return true;
    };

    const validarPaso2 = () => {
        if (!inputLargo || !inputAncho || !inputAlto) return false;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        if (!largo || !ancho || !alto) {
            displayError(2, 'Ingresa Largo, Ancho y Alto válidos en mm.');
            return false;
        }
        displayError(2, '');
        return true;
    };

    const calcularPrecio = () => {
        if (!inputLargo || !inputAncho || !inputAlto || !selectBase) return 0;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        const material = selectBase.value;
        if (!largo || !ancho || !alto) {
            return 0;
        }
        const volumen = largo * ancho * alto;
        const factor = getMaterialFactor(material);
        return Math.round(volumen * factor);
    };

    const updateEstimateResult = () => {
        if (!estimateResult) return;
        const total = calcularPrecio();
        if (total <= 0) {
            estimateResult.innerHTML = '<p class="estimate-empty">Completa Largo, Ancho y Alto para obtener tu aproximación.</p>';
            estimateResult.style.display = 'block';
            return;
        }
        estimateResult.innerHTML = `
            <div class="estimate-result-card">
                <p class="estimate-label">Monto aproximado</p>
                <p class="estimate-value">${formatCurrency(total)}</p>
                <p class="estimate-note">Este valor es una aproximación técnica. El costo final se confirmará vía WhatsApp tras revisar tus archivos.</p>
            </div>
        `;
        estimateResult.style.display = 'flex';
    };

    const finalizarWhatsApp = () => {
        if (!selectBase || !selectEffect || !inputLargo || !inputAncho || !inputAlto) return;
        const tipoBase = selectBase.value;
        const efecto = selectEffect.value;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        const precio = calcularPrecio();
        if (!tipoBase || !efecto || !largo || !ancho || !alto || precio <= 0) {
            if (estimateResult) {
                estimateResult.innerHTML = '<p>Completa todos los datos antes de enviar a WhatsApp.</p>';
                estimateResult.style.display = 'block';
            }
            return;
        }
        const mensaje = `Hola REX 3D, me interesa una pieza ${tipoBase} con acabado ${efecto} de ${largo}x${ancho}x${alto} mm. El estimado es ${formatCurrency(precio)}. ¿Podemos agendarlo?`;
        window.open(`https://wa.me/tu_numero?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    if (stickyQuoteBtn) {
        stickyQuoteBtn.addEventListener('click', abrirCotizador);
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    if (btnNextPaso1) {
        btnNextPaso1.addEventListener('click', () => {
            clearErrors();
            if (!validarPaso1()) return;
            setStep(2);
        });
    }

    if (btnNextPaso2) {
        btnNextPaso2.addEventListener('click', () => {
            clearErrors();
            if (!validarPaso2()) return;
            setStep(3);
        });
    }

    if (btnNextPaso3) {
        btnNextPaso3.addEventListener('click', () => {
            clearErrors();
            setStep(4);
        });
    }

    if (btnPrevPaso2) {
        btnPrevPaso2.addEventListener('click', () => {
            clearErrors();
            setStep(1);
        });
    }

    if (btnPrevPaso3) {
        btnPrevPaso3.addEventListener('click', () => {
            clearErrors();
            setStep(2);
        });
    }

    if (btnPrevPaso4) {
        btnPrevPaso4.addEventListener('click', () => {
            clearErrors();
            setStep(3);
        });
    }

    if (btnUploadImages && inputImagenes) {
        btnUploadImages.addEventListener('click', () => {
            inputImagenes.click();
        });
        inputImagenes.addEventListener('change', () => {
            if (inputImagenes.files?.length) {
                btnUploadImages.textContent = `${inputImagenes.files.length} archivo(s) seleccionado(s)`;
            }
        });
    }

    materialButtons.forEach((button) => {
        button.addEventListener('click', () => {
            materialButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            applyMuestrarioMaterial(button.dataset.material);
        });
    });

    [selectBase, selectEffect, inputLargo, inputAncho, inputAlto].forEach((field) => {
        if (field) {
            field.addEventListener('input', () => {
                if (paso4 && paso4.style.display === 'block') {
                    updateEstimateResult();
                }
            });
        }
    });

    if (confirmButton) {
        confirmButton.addEventListener('click', finalizarWhatsApp);
    }

    detailButtons.forEach((button) => {
        button.addEventListener('click', () => openDetailPanel(button.dataset.panel));
    });

    if (detailClose) {
        detailClose.addEventListener('click', closeDetailOverlay);
    }

    if (detailOverlay) {
        detailOverlay.addEventListener('click', (event) => {
            if (event.target === detailOverlay) {
                closeDetailOverlay();
            }
        });
    }

    if (muestrarioCanvas) {
        initMuestrario();
    }

    const openDetailPanel = (panelName) => {
        if (!detailOverlay) return;
        detailOverlay.classList.add('active');
        detailOverlay.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        detailPanels.forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.panel === panelName);
        });
    };

    const closeDetailOverlay = () => {
        if (!detailOverlay) return;
        detailOverlay.classList.remove('active');
        detailOverlay.setAttribute('aria-hidden', 'true');
        body.style.overflow = 'auto';
    };
});
