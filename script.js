// ========== VARIABLES GLOBALES ==========
let data = null;
let currentSection = null;
let carouselIntervals = [];
let currentCarouselIndexes = {};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// ========== CARGAR DATA.JSON ==========
function loadData() {
    fetch('data.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            initMenu();
            loadSection(data.sections[0]);
            initDarkMode();
        })
        .catch(error => {
            console.error('Error al cargar data.json:', error);
            document.getElementById('content').innerHTML = '<p style="color: red; text-align: center;">Error al cargar los datos. Por favor, verifica que data.json esté en la misma carpeta.</p>';
        });
}

// ========== MENÚ DE NAVEGACIÓN ==========
function initMenu() {
    const menu = document.getElementById('menu');
    data.sections.forEach((section, index) => {
        const btn = document.createElement('button');
        btn.textContent = section.title;
        btn.addEventListener('click', () => {
            loadSection(section);
            // Marcar botón activo
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        if (index === 0) btn.classList.add('active');
        menu.appendChild(btn);
    });
}

// ========== CARGAR SECCIÓN ==========
function loadSection(section) {
    currentSection = section;
    const content = document.getElementById('content');
    
    // Limpiar intervalos de carrusel anteriores
    carouselIntervals.forEach(interval => clearInterval(interval));
    carouselIntervals = [];
    currentCarouselIndexes = {};
    
    content.innerHTML = `<h2>${section.title}</h2>`;
    
    section.subsections.forEach((sub, subIndex) => {
        let article = `<article><h3>${sub.title}</h3>`;
        
        if (sub.content) {
            article += `<p>${sub.content}</p>`;
        }

        // CARRUSEL
        if (sub.type === 'carousel' && sub.images) {
            article += `<div class="carousel" id="carousel-${subIndex}">`;
            sub.images.forEach((img, i) => {
                article += `<img src="${img}" alt="Slide ${i + 1}" class="${i === 0 ? 'active' : ''}">`;
            });
            article += `
                <div class="carousel-controls">
                    <button class="carousel-btn" onclick="prevSlide(${subIndex}, ${sub.images.length})">‹</button>
                    <button class="carousel-btn" onclick="nextSlide(${subIndex}, ${sub.images.length})">›</button>
                </div>
                <div class="carousel-indicators" id="indicators-${subIndex}">
                    ${sub.images.map((_, i) => `<div class="indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${subIndex}, ${i})"></div>`).join('')}
                </div>
            </div>`;
            currentCarouselIndexes[subIndex] = 0;
        }

        // VIDEO
        if (sub.video) {
            article += `<iframe src="${sub.video}" allowfullscreen title="${sub.title}"></iframe>`;
        }

        // LINK IFRAME
        if (sub.link && !sub.button) {
            article += `<iframe src="${sub.link}" title="${sub.title}"></iframe>`;
        }

        // BOTÓN
        if (sub.button) {
            article += `<a href="${sub.button.link}" target="_blank" class="btn-link">${sub.button.text}</a>`;
        }

        // CURSOS
        if (sub.type === 'courses') {
            article += `
                <div class="courses-section">
                    <label for="programSelect">Selecciona un programa:</label>
                    <select id="programSelect" class="program-select">
                        <option value="">-- Seleccionar programa --</option>
                        ${Object.keys(data.programs).map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                    <div class="course-bubbles" id="courseBubbles"></div>
                </div>`;
        }

        // AGENDA
        if (sub.type === 'agenda') {
            article += `
                <div class="agenda-controls">
                    <input type="date" id="fecha" placeholder="Fecha">
                    <input type="text" id="actividad" placeholder="Escribe la actividad">
                    <button class="agenda-btn" id="agregarEventoBtn">Agregar Evento</button>
                </div>
                <ul class="lista-eventos" id="listaEventos"></ul>`;
        }

        // FAQ ACORDEÓN
        if (sub.type === 'accordion' && sub.items) {
            article += `<div class="faq-accordion">`;
            sub.items.forEach((item, idx) => {
                article += `
                    <div class="accordion-item">
                        <button class="accordion-btn" onclick="toggleAccordion(${subIndex}, ${idx})">
                            <span>${item.q}</span>
                            <span class="accordion-icon">▼</span>
                        </button>
                        <div class="accordion-panel" id="panel-${subIndex}-${idx}">
                            <div class="accordion-content">${item.a}</div>
                        </div>
                    </div>`;
            });
            article += `</div>`;
        }

        // SOPORTE
        if (sub.type === 'support' && sub.zones) {
            sub.zones.forEach((zone, zoneIdx) => {
                article += `
                    <div class="accordion-item">
                        <button class="accordion-btn" onclick="toggleAccordion('zone', ${zoneIdx})">
                            <span>${zone.name}</span>
                            <span class="accordion-icon">▼</span>
                        </button>
                        <div class="accordion-panel" id="panel-zone-${zoneIdx}">
                            <div class="accordion-content">`;
                zone.sedes.forEach((sede, sedeIdx) => {
                    article += `
                        <div class="sede-info">
                            <strong>${sede.nombre}</strong>
                            <p><strong>Dirección:</strong> ${sede.direccion}</p>
                            <p><strong>Teléfono:</strong> ${sede.telefono}</p>
                            <p><strong>Horario:</strong> ${sede.horario}</p>
                            ${sedeIdx < zone.sedes.length - 1 ? '<hr>' : ''}
                        </div>`;
                });
                article += `</div></div></div>`;
            });
        }

        article += `</article>`;
        content.innerHTML += article;
    });

    // Inicializar funcionalidades
    initCourses();
    initAgenda();
    initCarousels();
}

// ========== CARRUSEL ==========
function initCarousels() {
    currentSection.subsections.forEach((sub, subIndex) => {
        if (sub.type === 'carousel' && sub.images) {
            const interval = setInterval(() => {
                nextSlide(subIndex, sub.images.length);
            }, 5000);
            carouselIntervals.push(interval);
        }
    });
}

function goToSlide(subIndex, imageIndex) {
    const carousel = document.getElementById(`carousel-${subIndex}`);
    if (!carousel) return;
    
    const images = carousel.querySelectorAll('img');
    const indicators = document.getElementById(`indicators-${subIndex}`);
    if (!indicators) return;
    
    const indicatorElements = indicators.children;
    
    images[currentCarouselIndexes[subIndex]].classList.remove('active');
    indicatorElements[currentCarouselIndexes[subIndex]].classList.remove('active');
    
    currentCarouselIndexes[subIndex] = imageIndex;
    
    images[imageIndex].classList.add('active');
    indicatorElements[imageIndex].classList.add('active');
}

function nextSlide(subIndex, totalImages) {
    const nextIndex = (currentCarouselIndexes[subIndex] + 1) % totalImages;
    goToSlide(subIndex, nextIndex);
}

function prevSlide(subIndex, totalImages) {
    const prevIndex = (currentCarouselIndexes[subIndex] - 1 + totalImages) % totalImages;
    goToSlide(subIndex, prevIndex);
}

// ========== CURSOS ==========
function initCourses() {
    const programSelect = document.getElementById('programSelect');
    if (programSelect) {
        programSelect.addEventListener('change', function() {
            const bubbles = document.getElementById('courseBubbles');
            bubbles.innerHTML = '';
            const program = this.value;
            
            if (program && data.programs[program]) {
                data.programs[program].forEach(curso => {
                    const div = document.createElement('div');
                    div.className = 'curso-bubble';
                    div.innerHTML = `
                        <div class="course-name">${curso.name}</div>
                        <div class="course-code">(${curso.code})</div>`;
                    bubbles.appendChild(div);
                });
            }
        });
    }
}

// ========== AGENDA ==========
function initAgenda() {
    const btnAgregar = document.getElementById('agregarEventoBtn');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarEvento);
        cargarEventos();
    }
}

function agregarEvento() {
    const fecha = document.getElementById('fecha').value;
    const actividad = document.getElementById('actividad').value.trim();
    
    if (fecha && actividad) {
        const evento = { 
            id: Date.now(), 
            fecha, 
            actividad 
        };
        let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
        eventos.push(evento);
        localStorage.setItem('eventos', JSON.stringify(eventos));
        
        document.getElementById('fecha').value = '';
        document.getElementById('actividad').value = '';
        cargarEventos();
    } else {
        alert('Por favor completa la fecha y la actividad');
    }
}

function cargarEventos() {
    const lista = document.getElementById('listaEventos');
    if (!lista) return;
    
    lista.innerHTML = '';
    let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
    
    if (eventos.length === 0) {
        lista.innerHTML = '<li class="evento-item"><div class="evento-info"><span class="evento-actividad">No hay eventos registrados</span></div></li>';
        return;
    }
    
    eventos.forEach(ev => {
        const li = document.createElement('li');
        li.className = 'evento-item';
        li.innerHTML = `
            <div class="evento-info">
                <span class="evento-fecha">${ev.fecha}</span>
                <span class="evento-actividad">${ev.actividad}</span>
            </div>
            <button class="delete-btn" onclick="eliminarEvento(${ev.id})">Eliminar</button>`;
        lista.appendChild(li);
    });
}

function eliminarEvento(id) {
    let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
    eventos = eventos.filter(e => e.id !== id);
    localStorage.setItem('eventos', JSON.stringify(eventos));
    cargarEventos();
}

// ========== ACORDEÓN ==========
function toggleAccordion(subIndex, idx) {
    const panelId = `panel-${subIndex}-${idx}`;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    const btn = panel.previousElementSibling;
    
    btn.classList.toggle('active');
    panel.classList.toggle('active');
}

// ========== MODO OSCURO ==========
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleLabel = document.getElementById('toggleLabel');
    
    // Cargar preferencia guardada
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark');
        toggleSwitch.classList.add('active');
        toggleLabel.textContent = 'Modo Oscuro';
    }
    
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        toggleSwitch.classList.toggle('active');
        
        const isNowDark = document.body.classList.contains('dark');
        toggleLabel.textContent = isNowDark ? 'Modo Oscuro' : 'Modo Claro';
        localStorage.setItem('darkMode', isNowDark);
    });
}


