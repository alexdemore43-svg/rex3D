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
    const confirmButton = document.getElementById('btn-confirmar');
    const selectBase = document.getElementById('acabadoSelect');
    const selectEffect = document.getElementById('efectoSelect');
    const inputLargo = document.getElementById('input-largo');
    const inputAncho = document.getElementById('input-ancho');
    const inputAlto = document.getElementById('input-alto');
    const inputCantidad = document.getElementById('input-cantidad');
    const estimateResult = document.getElementById('estimateResult');
    const quoteErrorPaso1 = document.getElementById('quoteError-paso-1');
    const quoteErrorPaso2 = document.getElementById('quoteError-paso-2');
    const quoteErrorPaso3 = document.getElementById('quoteError-paso-3');
    const especificaciones = document.getElementById('textarea-especificaciones');
    const imagenesInput = document.getElementById('input-imagenes');
    const detailOverlay = document.getElementById('detailOverlay');
    const detailButtons = document.querySelectorAll('.detail-card');
    const detailPanels = document.querySelectorAll('.detail-panel');
    const detailClose = document.querySelector('.detail-close');
    let ticking = false;
    let lastScrollY = window.scrollY;
    let currentStep = 1;

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

    const updateHeader = () => {
        const currentScrollY = window.scrollY;
        const isAtTop = currentScrollY <= 20;
        const isScrollingDown = currentScrollY > lastScrollY;

        if (isAtTop) {
            header.classList.remove('scroll-active', 'hide');
        } else if (isScrollingDown) {
            header.classList.add('hide');
            header.classList.remove('scroll-active');
        } else {
            header.classList.remove('hide');
            header.classList.add('scroll-active');
        }

        lastScrollY = currentScrollY;
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

    const abrirCotizador = () => {
        if (!modal) return;
        currentStep = 1;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        setStep(1);
        if (quoteErrorPaso1) quoteErrorPaso1.textContent = '';
    };

    const setStep = (step) => {
        currentStep = step;
        const pasos = document.querySelectorAll('.quote-step');
        pasos.forEach((paso, index) => {
            paso.style.display = index + 1 === step ? 'block' : 'none';
        });
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
            if (quoteErrorPaso1) {
                quoteErrorPaso1.textContent = 'Selecciona una Base y un Efecto antes de continuar.';
            }
            return false;
        }
        if (quoteErrorPaso1) quoteErrorPaso1.textContent = '';
        return true;
    };

    const validarPaso2 = () => {
        if (!inputLargo || !inputAncho || !inputAlto || !inputCantidad) return false;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        const cantidad = parseFloat(inputCantidad.value) || 0;
        if (!largo || !ancho || !alto || !cantidad) {
            if (quoteErrorPaso2) {
                quoteErrorPaso2.textContent = 'Ingresa valores válidos para Largo, Ancho, Alto y Cantidad.';
            }
            return false;
        }
        if (quoteErrorPaso2) quoteErrorPaso2.textContent = '';
        return true;
    };

    const validarPaso3 = () => {
        if (quoteErrorPaso3) quoteErrorPaso3.textContent = '';
        return true;
    };

    const calcularPrecio = () => {
        if (!inputLargo || !inputAncho || !inputAlto || !selectBase || !inputCantidad) return 0;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        const cantidad = parseFloat(inputCantidad.value) || 1;
        const material = selectBase.value;
        if (!largo || !ancho || !alto) {
            if (estimateResult) {
                estimateResult.innerHTML = '<p>Ingresa Largo, Ancho y Alto en mm para calcular el costo de producción.</p>';
                estimateResult.style.display = 'block';
            }
            return 0;
        }
        const volumen = largo * ancho * alto;
        const factor = getMaterialFactor(material);
        const precioUnitario = Math.round(volumen * factor);
        const total = precioUnitario * cantidad;
        if (estimateResult) {
            estimateResult.innerHTML = `<p>El costo estimado de su proyecto sería de <strong>${formatCurrency(total)}</strong>. Este valor es una aproximación técnica. El costo final se confirmará vía WhatsApp tras revisar tus archivos.</p>`;
            estimateResult.style.display = 'block';
        }
        return total;
    };

    const finalizarWhatsApp = () => {
        if (!selectBase || !selectEffect || !inputLargo || !inputAncho || !inputAlto || !inputCantidad) return;
        const tipoBase = selectBase.value;
        const efecto = selectEffect.value;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
        const cantidad = parseFloat(inputCantidad.value) || 1;
        const precio = calcularPrecio();
        if (!tipoBase || !efecto || !largo || !ancho || !alto || !cantidad || precio <= 0) {
            if (estimateResult) {
                estimateResult.innerHTML = '<p>Completa todos los datos antes de enviar a WhatsApp.</p>';
                estimateResult.style.display = 'block';
            }
            return;
        }
        const detalles = especificaciones && especificaciones.value.trim() ? ` Especificaciones: ${especificaciones.value.trim()}.` : '';
        const cantidadText = cantidad > 1 ? ` (${Math.floor(cantidad)} piezas)` : '';
        const mensaje = `Hola REX 3D, me interesa una pieza ${tipoBase} con acabado ${efecto} de ${largo}x${ancho}x${alto} mm${cantidadText}. El estimado es ${formatCurrency(precio)}.${detalles} ¿Podemos agendarlo?`;
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

    // Listeners para Siguiente (pasos 1-3)
    const btnSiguientePaso1 = document.getElementById('btn-siguiente-paso-1');
    const btnSiguientePaso2 = document.getElementById('btn-siguiente-paso-2');
    const btnSiguientePaso3 = document.getElementById('btn-siguiente-paso-3');

    // Event delegation en el formulario para mayor compatibilidad
    const quoteForm = document.querySelector('.quote-form');
    
    if (quoteForm) {
        quoteForm.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'btn-siguiente-paso-1') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Click en siguiente paso 1 (delegado)');
                if (!validarPaso1()) {
                    console.log('Validación paso 1 falló');
                    return;
                }
                console.log('Avanzando a paso 2');
                setStep(2);
            } else if (target.id === 'btn-siguiente-paso-2') {
                e.preventDefault();
                e.stopPropagation();
                if (!validarPaso2()) return;
                setStep(3);
            } else if (target.id === 'btn-siguiente-paso-3') {
                e.preventDefault();
                e.stopPropagation();
                if (!validarPaso3()) return;
                calcularPrecio();
                setStep(4);
            } else if (target.id === 'btn-anterior-paso-2') {
                e.preventDefault();
                e.stopPropagation();
                setStep(1);
            } else if (target.id === 'btn-anterior-paso-3') {
                e.preventDefault();
                e.stopPropagation();
                setStep(2);
            } else if (target.id === 'btn-anterior-paso-4') {
                e.preventDefault();
                e.stopPropagation();
                setStep(3);
            }
        });
    }

    // Fallback: listeners directos si event delegation no funciona
    if (btnSiguientePaso1) {
        btnSiguientePaso1.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Click en siguiente paso 1 (directo)');
            if (!validarPaso1()) {
                console.log('Validación paso 1 falló');
                return;
            }
            console.log('Avanzando a paso 2');
            setStep(2);
        });
    }

    if (btnSiguientePaso2) {
        btnSiguientePaso2.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!validarPaso2()) return;
            setStep(3);
        });
    }

    if (btnSiguientePaso3) {
        btnSiguientePaso3.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!validarPaso3()) return;
            calcularPrecio();
            setStep(4);
        });
    }

    const validateImageSelection = () => {
        if (!imagenesInput) return;
        if (imagenesInput.files.length > 2) {
            const trimmedFiles = Array.from(imagenesInput.files).slice(0, 2);
            const dataTransfer = new DataTransfer();
            trimmedFiles.forEach((file) => dataTransfer.items.add(file));
            imagenesInput.files = dataTransfer.files;
            if (quoteErrorPaso3) {
                quoteErrorPaso3.textContent = 'Solo puedes seleccionar hasta 2 imágenes.';
            }
        } else if (quoteErrorPaso3) {
            quoteErrorPaso3.textContent = '';
        }

        // Actualizar texto del botón
        if (btnSubirImagenes) {
            const fileCount = imagenesInput.files.length;
            if (fileCount > 0) {
                btnSubirImagenes.textContent = `${fileCount} imagen(es) seleccionada(s)`;
            } else {
                btnSubirImagenes.textContent = 'Seleccionar Imágenes';
            }
        }
    };

    [selectBase, selectEffect, inputLargo, inputAncho, inputAlto, inputCantidad, especificaciones, imagenesInput].forEach((field) => {
        if (field) {
            const eventType = field === imagenesInput ? 'change' : 'input';
            field.addEventListener(eventType, calcularPrecio);
        }
    });

    // Update model material on effect change
    if (selectEffect) {
        selectEffect.addEventListener('change', updateModelMaterial);
    }

    if (imagenesInput) {
        imagenesInput.addEventListener('change', validateImageSelection);
    }

    // Botón personalizado para subir imágenes
    const btnSubirImagenes = document.getElementById('btn-subir-imagenes');
    if (btnSubirImagenes && imagenesInput) {
        btnSubirImagenes.addEventListener('click', () => {
            imagenesInput.click();
        });
    }

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

// Three.js Scene Setup
let scene, camera, renderer, model, material;

const initThreeJS = () => {
    const canvas = document.getElementById('threejs-canvas');
    if (!canvas) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f3ff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Load GLTF Model
    loadModel();

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);
        if (model) {
            model.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

const loadModel = () => {
    const loader = new THREE.GLTFLoader();
    loader.load(
        'shader_ball.glb',
        (gltf) => {
            model = gltf.scene;
            model.scale.set(1, 1, 1);
            model.position.set(0, 0, 0);
            scene.add(model);

            // Traverse to find materials
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    material = child.material;
                    updateMaterial('Filamento Directo'); // Default
                }
            });
        },
        (progress) => {
            console.log('Loading progress:', progress);
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );
};

const updateMaterial = (effect) => {
    if (!material) return;

    let color = 0xffffff;
    let metalness = 0;
    let roughness = 0.5;

    switch (effect) {
        case 'Filamento Directo':
            color = 0xcccccc;
            metalness = 0;
            roughness = 0.8;
            break;
        case 'Acabado Plus':
            color = 0xdddddd;
            metalness = 0.2;
            roughness = 0.6;
            break;
        case 'Mate':
            color = 0x888888;
            metalness = 0;
            roughness = 1;
            break;
        case 'Satinado':
            color = 0xaaaaaa;
            metalness = 0.1;
            roughness = 0.7;
            break;
        case 'Brillante':
            color = 0xffffff;
            metalness = 0.3;
            roughness = 0.2;
            break;
        case 'Tornasol':
            color = 0xffa500;
            metalness = 0.5;
            roughness = 0.3;
            break;
        case 'MC00':
            color = 0x000000;
            metalness = 0;
            roughness = 1;
            break;
        case 'Hidrocromo':
            color = 0x00ffff;
            metalness = 0.8;
            roughness = 0.1;
            break;
        case 'Metalizado Oro':
            color = 0xffd700;
            metalness = 1;
            roughness = 0.2;
            break;
        case 'Metalizado Plata':
            color = 0xc0c0c0;
            metalness = 1;
            roughness = 0.1;
            break;
        case 'Metalizado Bronce':
            color = 0xcd7f32;
            metalness = 0.9;
            roughness = 0.3;
            break;
        default:
            break;
    }

    material.color.setHex(color);
    material.metalness = metalness;
    material.roughness = roughness;
    material.needsUpdate = true;
};

// Function to update material from quote selection
const updateModelMaterial = () => {
    const selectEffect = document.getElementById('efectoSelect');
    if (selectEffect && selectEffect.value) {
        updateMaterial(selectEffect.value);
    }
};

// Initialize Three.js after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Existing code...
    initThreeJS();
});
