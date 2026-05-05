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
    const nextButton = document.getElementById('btn-siguiente');
    const prevButtons = document.querySelectorAll('.prev-step');
    const confirmButton = document.getElementById('btn-confirmar');
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');
    const selectBase = document.getElementById('acabadoSelect');
    const selectEffect = document.getElementById('efectoSelect');
    const inputLargo = document.getElementById('input-largo');
    const inputAncho = document.getElementById('input-ancho');
    const inputAlto = document.getElementById('input-alto');
    const estimateResult = document.getElementById('estimateResult');
    const quoteError = document.getElementById('quoteError');
    const especificaciones = document.getElementById('textarea-especificaciones');
    const imagenesInput = document.getElementById('input-imagenes');
    const detailOverlay = document.getElementById('detailOverlay');
    const detailButtons = document.querySelectorAll('.detail-card');
    const detailPanels = document.querySelectorAll('.detail-panel');
    const detailClose = document.querySelector('.detail-close');
    let ticking = false;
    let lastScrollY = window.scrollY;

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
        if (!modal || !paso1 || !paso2) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        paso1.style.display = 'block';
        paso2.style.display = 'none';
        if (quoteError) quoteError.textContent = '';
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
            if (quoteError) {
                quoteError.textContent = 'Selecciona una Base y un Efecto antes de continuar.';
            }
            return false;
        }
        if (quoteError) quoteError.textContent = '';
        return true;
    };

    const calcularPrecio = () => {
        if (!inputLargo || !inputAncho || !inputAlto || !selectBase) return 0;
        const largo = parseFloat(inputLargo.value) || 0;
        const ancho = parseFloat(inputAncho.value) || 0;
        const alto = parseFloat(inputAlto.value) || 0;
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
        const total = Math.round(volumen * factor);
        if (estimateResult) {
            estimateResult.innerHTML = `<p>El costo estimado de su proyecto sería de <strong>${formatCurrency(total)}</strong>. Este valor puede variar. Para más información, contáctanos por WhatsApp.</p>`;
            estimateResult.style.display = 'block';
        }
        return total;
    };

    const mostrarPaso2 = () => {
        if (!paso1 || !paso2) return;
        paso1.style.display = 'none';
        paso2.style.display = 'block';
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
        const detalles = especificaciones && especificaciones.value.trim() ? ` Especificaciones: ${especificaciones.value.trim()}.` : '';
        const mensaje = `Hola REX 3D, me interesa una pieza ${tipoBase} con acabado ${efecto} de ${largo}x${ancho}x${alto} mm. El estimado es ${formatCurrency(precio)}.${detalles} ¿Podemos agendarlo?`;
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

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (!validarPaso1()) return;
            mostrarPaso2();
            calcularPrecio();
        });
    }

    prevButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!paso1 || !paso2) return;
            paso1.style.display = 'block';
            paso2.style.display = 'none';
            if (estimateResult) estimateResult.style.display = 'none';
        });
    });

    const validateImageSelection = () => {
        if (!imagenesInput) return;
        if (imagenesInput.files.length > 2) {
            const trimmedFiles = Array.from(imagenesInput.files).slice(0, 2);
            const dataTransfer = new DataTransfer();
            trimmedFiles.forEach((file) => dataTransfer.items.add(file));
            imagenesInput.files = dataTransfer.files;
            if (quoteError) {
                quoteError.textContent = 'Solo puedes seleccionar hasta 2 imágenes.';
            }
        } else if (quoteError) {
            quoteError.textContent = '';
        }
    };

    [selectBase, selectEffect, inputLargo, inputAncho, inputAlto, especificaciones, imagenesInput].forEach((field) => {
        if (field) {
            const eventType = field === imagenesInput ? 'change' : 'input';
            field.addEventListener(eventType, calcularPrecio);
        }
    });

    if (imagenesInput) {
        imagenesInput.addEventListener('change', validateImageSelection);
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
