// ========== VARIABLES GLOBALES ==========
let data = null;
let currentSection = null;
let carouselIntervals = [];
let currentCarouselIndexes = {};
let searchIndex = [];

// Estado de accesibilidad
const accessibilityState = {
    features: new Set(),
    activeProfile: null
};

// Perfiles de accesibilidad predefinidos
const accessibilityProfiles = {
    motor: ['large-cursor', 'large-text'],
    blind: ['no-animations'],
    colorblind: ['high-contrast'],
    dyslexia: ['dyslexia-font', 'increased-spacing', 'large-text'],
    lowvision: ['large-text', 'high-contrast', 'increased-spacing'],
    cognitive: ['dyslexia-font', 'increased-spacing', 'no-animations']
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initLoadingScreen();
    loadData();
    initAccessibility();
});

// ========== PANTALLA DE CARGA ==========
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.getElementById('loadingProgress');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        loadingProgress.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                checkTutorial();
            }, 500);
        }
    }, 200);
}

// ========== TUTORIAL INICIAL ==========
function checkTutorial() {
    const dontShow = localStorage.getItem('hideTutorial');
    if (!dontShow) {
        showTutorial();
    }
}

function showTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    overlay.classList.add('active');
    
    let currentStep = 1;
    const totalSteps = 4;
    
    const updateStep = (step) => {
        document.querySelectorAll('.tutorial-step').forEach((el, idx) => {
            el.style.display = idx + 1 === step ? 'block' : 'none';
        });
        
        document.querySelectorAll('.dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx + 1 === step);
        });
        
        document.getElementById('tutorialPrev').style.display = step > 1 ? 'inline-block' : 'none';
        document.getElementById('tutorialNext').textContent = step === totalSteps ? 'Comenzar' : 'Siguiente';
    };
    
    document.getElementById('tutorialNext').addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStep(currentStep);
        } else {
            closeTutorial();
        }
    });
    
    document.getElementById('tutorialPrev').addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStep(currentStep);
        }
    });
    
    document.getElementById('tutorialClose').addEventListener('click', closeTutorial);
    
    function closeTutorial() {
        overlay.classList.remove('active');
        if (document.getElementById('dontShowAgain').checked) {
            localStorage.setItem('hideTutorial', 'true');
        }
    }
}

// ========== CARGAR DATA.JSON ==========
function loadData() {
    fetch('data.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            buildSearchIndex();
            initMenu();
            loadSection(data.sections[0]);
            initDarkMode();
            initSearch();
        })
        .catch(error => {
            console.error('Error al cargar data.json:', error);
            document.getElementById('content').innerHTML = 
                '<article><h3 style="color: red;">Error al cargar los datos</h3>' +
                '<p>Por favor, verifica que data.json esté en la misma carpeta que index.html</p></article>';
        });
}

// ========== ÍNDICE DE BÚSQUEDA ==========
function buildSearchIndex() {
    searchIndex = [];
    data.sections.forEach(section => {
        section.subsections.forEach(sub => {
            searchIndex.push({
                title: sub.title,
                content: sub.content || '',
                section: section.title,
                type: sub.type
            });
            
            // Indexar preguntas FAQ
            if (sub.items) {
                sub.items.forEach(item => {
                    searchIndex.push({
                        title: item.q,
                        content: item.a,
                        section: section.title,
                        subsection: sub.title
                    });
                });
            }
        });
    });
}

// ========== BUSCADOR ==========
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length >= 2) {
            performSearch(query);
        }
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const results = searchIndex.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.content.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
    } else {
        searchResults.innerHTML = results.slice(0, 5).map(result => `
            <div class="search-result-item" onclick="navigateToResult('${result.section}', '${result.title}')">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-section">${result.section}${result.subsection ? ' > ' + result.subsection : ''}</div>
            </div>
        `).join('');
    }
    
    searchResults.classList.add('active');
}

function navigateToResult(sectionName, subsectionTitle) {
    const section = data.sections.find(s => s.title === sectionName);
    if (section) {
        loadSection(section);
        document.querySelectorAll('nav button').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === sectionName);
        });
        
        // Scroll al subsección
        setTimeout(() => {
            const articles = document.querySelectorAll('article h3');
            articles.forEach(h3 => {
                if (h3.textContent === subsectionTitle) {
                    h3.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 300);
    }
    
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('searchInput').value = '';
}

// ========== MENÚ DE NAVEGACIÓN ==========
function initMenu() {
    const menu = document.getElementById('menu');
    data.sections.forEach((section, index) => {
        const btn = document.createElement('button');
        btn.textContent = section.title;
        btn.addEventListener('click', () => {
            loadSection(section);
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
        
        if (sub.content && sub.type !== 'calculadora' && sub.type !== 'horario') {
            article += `<p>${sub.content}</p>`;
        }

        // CARRUSEL
        if (sub.type === 'carousel' && sub.images) {
            article += createCarousel(sub, subIndex);
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
            article += `<a href="${sub.button.link}" target="_blank" rel="noopener noreferrer" class="btn-link">${sub.button.text}</a>`;
        }

        // BIENESTAR
        if (sub.type === 'bienestar') {
            article += createBienestarSection();
        }

        // CALCULADORA DE CRÉDITOS
        if (sub.type === 'calculadora') {
            article += createCalculadora();
        }

        // CURSOS
        if (sub.type === 'courses') {
            article += createCoursesSection();
        }

        // GENERADOR DE HORARIOS
        if (sub.type === 'horario') {
            article += createHorarioSection();
        }

        // AGENDA
        if (sub.type === 'agenda') {
            article += createAgendaSection();
        }

        // FAQ ACORDEÓN
        if (sub.type === 'accordion' && sub.items) {
            article += createAccordion(sub, subIndex);
        }

        // SOPORTE
        if (sub.type === 'support' && sub.zones) {
            article += createSupportSection(sub, subIndex);
        }

        article += `</article>`;
        content.innerHTML += article;
    });

    // Inicializar funcionalidades
    initCourses();
    initAgenda();
    initCarousels();
    initCalculadora();
    initHorario();
}

// ========== CREAR CARRUSEL ==========
function createCarousel(sub, subIndex) {
    let html = `<div class="carousel" id="carousel-${subIndex}">`;
    sub.images.forEach((img, i) => {
        html += `<img src="${img}" alt="Slide ${i + 1}" class="${i === 0 ? 'active' : ''}" onerror="this.src='https://via.placeholder.com/1200x450/005baa/FFFFFF?text=Imagen+${i+1}'">`;
    });
    html += `
        <div class="carousel-controls">
            <button class="carousel-btn" onclick="prevSlide(${subIndex}, ${sub.images.length})" aria-label="Anterior">‹</button>
            <button class="carousel-btn" onclick="nextSlide(${subIndex}, ${sub.images.length})" aria-label="Siguiente">›</button>
        </div>
        <div class="carousel-indicators" id="indicators-${subIndex}">
            ${sub.images.map((_, i) => `<div class="indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${subIndex}, ${i})"></div>`).join('')}
        </div>
    </div>`;
    return html;
}

// ========== FUNCIONES DE CARRUSEL ==========
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

// ========== CREAR SECCIÓN BIENESTAR ==========
function createBienestarSection() {
    if (!data.bienestar) return '';
    
    let html = `
        <div class="bienestar-container">
            <div class="bienestar-intro">
                <p>${data.bienestar.descripcion}</p>
            </div>
            <div class="bienestar-grid">`;
    
    data.bienestar.servicios.forEach(servicio => {
        html += `
            <div class="bienestar-card" onclick="window.open('${servicio.enlace}', '_blank')">
                <div class="bienestar-card-header">
                    <div class="bienestar-icon">${servicio.icono}</div>
                    <h4>${servicio.nombre}</h4>
                </div>
                <p>${servicio.descripcion}</p>
                <a href="${servicio.enlace}" target="_blank" rel="noopener noreferrer" class="bienestar-link">
                    Acceder al servicio →
                </a>
            </div>`;
    });
    
    html += `</div></div>`;
    return html;
}

// ========== CREAR CALCULADORA DE CRÉDITOS ==========
function createCalculadora() {
    return `
        <div class="calculadora-container">
            <p>Calcula el costo de tu matrícula según los créditos que deseas inscribir. Recuerda que puedes matricular entre 9 y 21 créditos por periodo regular.</p>
            <div class="calculadora-form">
                <div class="form-group">
                    <label for="tipoPrograma">Tipo de Programa:</label>
                    <select id="tipoPrograma">
                        <option value="regular">Tecnología Regular</option>
                        <option value="salud">Ciencias de la Salud / ECBTI / ECAPMA (+10%)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Selecciona el número de créditos (9-21):</label>
                    <div class="creditos-grid" id="creditosGrid"></div>
                </div>
                
                <div class="form-group">
                    <label for="descuentoElectoral">Descuento Electoral:</label>
                    <select id="descuentoElectoral">
                        <option value="0">Sin descuento</option>
                        <option value="10">10% - Certificado electoral</option>
                        <option value="25">25% - Certificado electoral especial</option>
                    </select>
                </div>
                
                <button class="calcular-btn" onclick="calcularMatricula()">Calcular Matrícula</button>
            </div>
            
            <div class="resultado-calculadora" id="resultadoCalculadora">
                <h4>Resumen de tu Matrícula</h4>
                <div class="resultado-item">
                    <span class="resultado-label">Número de créditos:</span>
                    <span class="resultado-value" id="resCreditos">0</span>
                </div>
                <div class="resultado-item">
                    <span class="resultado-label">Valor por crédito:</span>
                    <span class="resultado-value" id="resValorCredito">$0</span>
                </div>
                <div class="resultado-item">
                    <span class="resultado-label">Subtotal:</span>
                    <span class="resultado-value" id="resSubtotal">$0</span>
                </div>
                <div class="resultado-item">
                    <span class="resultado-label">Descuento aplicado:</span>
                    <span class="resultado-value" id="resDescuento">$0</span>
                </div>
                <div class="resultado-item">
                    <span class="resultado-label">Seguro estudiantil:</span>
                    <span class="resultado-value">$9,000</span>
                </div>
                <div class="resultado-total">
                    <div class="resultado-item">
                        <span class="resultado-label">VALOR TOTAL A PAGAR:</span>
                        <span class="resultado-value" id="resTotal">$0</span>
                    </div>
                </div>
                <div class="resultado-item">
                    <span class="resultado-label">Tiempo estimado de estudio semanal:</span>
                    <span class="resultado-value" id="resHoras">0 horas</span>
                </div>
            </div>
        </div>`;
}

function initCalculadora() {
    const creditosGrid = document.getElementById('creditosGrid');
    if (!creditosGrid) return;
    
    // Crear botones de créditos (9-21)
    for (let i = 9; i <= 21; i++) {
        const btn = document.createElement('button');
        btn.className = 'credito-btn';
        btn.textContent = i;
        btn.onclick = () => {
            document.querySelectorAll('.credito-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        creditosGrid.appendChild(btn);
    }
}

function calcularMatricula() {
    const selectedBtn = document.querySelector('.credito-btn.active');
    if (!selectedBtn) {
        alert('Por favor selecciona el número de créditos');
        return;
    }
    
    const creditos = parseInt(selectedBtn.textContent);
    const tipoPrograma = document.getElementById('tipoPrograma').value;
    const descuentoPorcentaje = parseInt(document.getElementById('descuentoElectoral').value);
    
    // Valores 2025
    const valorCreditoBase = tipoPrograma === 'regular' ? 142000 : 157000;
    const seguro = 9000;
    
    // Cálculos
    const subtotal = creditos * valorCreditoBase;
    const descuento = (subtotal * descuentoPorcentaje) / 100;
    const total = subtotal - descuento + seguro;
    const horasSemanales = creditos * 3; // 3 horas por crédito por semana aprox
    
    // Mostrar resultados
    document.getElementById('resCreditos').textContent = creditos;
    document.getElementById('resValorCredito').textContent = `${valorCreditoBase.toLocaleString('es-CO')}`;
    document.getElementById('resSubtotal').textContent = `${subtotal.toLocaleString('es-CO')}`;
    document.getElementById('resDescuento').textContent = `-${descuento.toLocaleString('es-CO')}`;
    document.getElementById('resTotal').textContent = `${total.toLocaleString('es-CO')}`;
    document.getElementById('resHoras').textContent = `${horasSemanales} horas`;
    
    document.getElementById('resultadoCalculadora').classList.add('active');
    document.getElementById('resultadoCalculadora').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== CREAR GENERADOR DE HORARIOS ==========
function createHorarioSection() {
    return `
        <div class="horario-container">
            <p>Organiza tu horario de estudio semanal. Puedes importar un PDF con tu calendario académico o crear tu horario personalizado.</p>
            
            <div class="horario-header">
                <h4>Mi Horario Semanal</h4>
                <div class="horario-actions">
                    <button class="horario-btn" onclick="exportarHorario()">📥 Exportar (.ics)</button>
                    <button class="horario-btn horario-btn-secondary" onclick="limpiarHorario()">🗑️ Limpiar</button>
                </div>
            </div>
            
            <div class="upload-section">
                <h4>Importar Calendario PDF</h4>
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon">📄</div>
                    <p>Haz clic para seleccionar tu PDF de horarios</p>
                    <small>Arrastra tu archivo aquí o haz clic para seleccionar</small>
                </div>
                <input type="file" id="fileInput" accept=".pdf" onchange="handleFileUpload(event)">
                <div class="file-info" id="fileInfo">
                    <strong>Archivo cargado:</strong> <span id="fileName"></span>
                </div>
            </div>
            
            <div class="horario-table">
                <table>
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Lunes</th>
                            <th>Martes</th>
                            <th>Miércoles</th>
                            <th>Jueves</th>
                            <th>Viernes</th>
                            <th>Sábado</th>
                        </tr>
                    </thead>
                    <tbody id="horarioTableBody">
                    </tbody>
                </table>
            </div>
            
            <div class="mapa-container" style="margin-top: 30px;">
                <h4 style="margin-bottom: 15px;">Ubicación de Sedes UNAD</h4>
                <iframe src="https://www.google.com/maps/d/embed?mid=16yptAq_Y1YBrRAdpjRJcSJthQGXXUpAr&ehbc=2E312F" width="100%" height="480"></iframe>
            </div>
        </div>`;
}

function initHorario() {
    const tableBody = document.getElementById('horarioTableBody');
    if (!tableBody) return;
    
    const horas = [
        '6:00-7:00', '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', 
        '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', 
        '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', 
        '19:00-20:00', '20:00-21:00'
    ];
    
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    horas.forEach((hora, horaIdx) => {
        let row = `<tr><td>${hora}</td>`;
        dias.forEach((dia, diaIdx) => {
            row += `<td id="slot-${horaIdx}-${diaIdx}" onclick="editarSlot(${horaIdx}, ${diaIdx})"></td>`;
        });
        row += '</tr>';
        tableBody.innerHTML += row;
    });
    
    cargarHorarioGuardado();
}

function editarSlot(horaIdx, diaIdx) {
    const slotId = `slot-${horaIdx}-${diaIdx}`;
    const slot = document.getElementById(slotId);
    
    if (slot.innerHTML) {
        if (confirm('¿Deseas eliminar esta actividad?')) {
            slot.innerHTML = '';
            guardarHorario();
        }
    } else {
        const actividad = prompt('Ingresa la actividad (ej: "Estudio - Matemáticas"):');
        if (actividad) {
            slot.innerHTML = `<div class="horario-slot">${actividad}</div>`;
            guardarHorario();
        }
    }
}

function guardarHorario() {
    const horario = {};
    document.querySelectorAll('[id^="slot-"]').forEach(cell => {
        if (cell.innerHTML) {
            horario[cell.id] = cell.innerHTML;
        }
    });
    localStorage.setItem('horarioSemanal', JSON.stringify(horario));
}

function cargarHorarioGuardado() {
    const horario = JSON.parse(localStorage.getItem('horarioSemanal') || '{}');
    Object.keys(horario).forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) cell.innerHTML = horario[slotId];
    });
}

function limpiarHorario() {
    if (confirm('¿Estás seguro de limpiar todo el horario?')) {
        document.querySelectorAll('[id^="slot-"]').forEach(cell => {
            cell.innerHTML = '';
        });
        localStorage.removeItem('horarioSemanal');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').classList.add('active');
        alert('PDF cargado: ' + file.name + '\n\nNota: Esta es una función de demostración. En una implementación completa, el PDF se procesaría para extraer el horario automáticamente.');
    }
}

function exportarHorario() {
    const horario = JSON.parse(localStorage.getItem('horarioSemanal') || '{}');
    
    if (Object.keys(horario).length === 0) {
        alert('No hay actividades en el horario para exportar');
        return;
    }
    
    // Crear archivo ICS básico
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UNAD//Horario Academico//ES\n';
    
    Object.keys(horario).forEach(slotId => {
        const content = horario[slotId].replace(/<[^>]*>/g, '').trim();
        icsContent += `BEGIN:VEVENT\nSUMMARY:${content}\nEND:VEVENT\n`;
    });
    
    icsContent += 'END:VCALENDAR';
    
    // Descargar archivo
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horario_unad.ics';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('¡Horario exportado! Puedes importarlo en Google Calendar, Outlook, etc.');
}

// ========== CREAR SECCIÓN DE CURSOS ==========
function createCoursesSection() {
    return `
        <div class="courses-section">
            <label for="programSelect">Selecciona un programa:</label>
            <select id="programSelect" class="program-select">
                <option value="">-- Seleccionar programa --</option>
                ${Object.keys(data.programs).map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
            <div class="course-bubbles" id="courseBubbles"></div>
        </div>`;
}

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
                        <div class="course-code">Código: ${curso.code}</div>
                        <div class="course-credits">⭐ ${curso.creditos} créditos</div>`;
                    bubbles.appendChild(div);
                });
            }
        });
    }
}

// ========== CREAR AGENDA ==========
function createAgendaSection() {
    return `
        <div class="agenda-controls">
            <input type="date" id="fecha" placeholder="Fecha">
            <input type="text" id="actividad" placeholder="Escribe la actividad">
            <button class="agenda-btn" id="agregarEventoBtn">Agregar Evento</button>
        </div>
        <ul class="lista-eventos" id="listaEventos"></ul>`;
}

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
    
    // Ordenar por fecha
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    if (eventos.length === 0) {
        lista.innerHTML = '<li class="evento-item"><div class="evento-info"><span class="evento-actividad">No hay eventos registrados</span></div></li>';
        return;
    }
    
    eventos.forEach(ev => {
        const li = document.createElement('li');
        li.className = 'evento-item';
        const fechaFormateada = new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-CO', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        li.innerHTML = `
            <div class="evento-info">
                <span class="evento-fecha">${fechaFormateada}</span>
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

// ========== CREAR ACORDEÓN ==========
function createAccordion(sub, subIndex) {
    let html = '<div class="faq-accordion">';
    sub.items.forEach((item, idx) => {
        html += `
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
    html += '</div>';
    return html;
}

function toggleAccordion(subIndex, idx) {
    const panelId = `panel-${subIndex}-${idx}`;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    const btn = panel.previousElementSibling;
    
    btn.classList.toggle('active');
    panel.classList.toggle('active');
}

// ========== CREAR SOPORTE ==========
function createSupportSection(sub, subIndex) {
    let html = '';
    sub.zones.forEach((zone, zoneIdx) => {
        html += `
            <div class="accordion-item">
                <button class="accordion-btn" onclick="toggleAccordion('zone-${subIndex}', ${zoneIdx})">
                    <span>${zone.name}</span>
                    <span class="accordion-icon">▼</span>
                </button>
                <div class="accordion-panel" id="panel-zone-${subIndex}-${zoneIdx}">
                    <div class="accordion-content">`;
        zone.sedes.forEach((sede, sedeIdx) => {
            html += `
                <div class="sede-info">
                    <strong>${sede.nombre}</strong>
                    <p><strong>Dirección:</strong> ${sede.direccion}</p>
                    <p><strong>Teléfono:</strong> ${sede.telefono}</p>
                    <p><strong>Horario:</strong> ${sede.horario}</p>
                    ${sedeIdx < zone.sedes.length - 1 ? '<hr>' : ''}
                </div>`;
        });
        html += `</div></div></div>`;
    });
    return html;
}

// ========== MODO OSCURO ==========
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleLabel = document.getElementById('toggleLabel');
    
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

// ========== ACCESIBILIDAD ==========
function initAccessibility() {
    const accessibilityBtn = document.getElementById('accessibilityBtn');
    const accessibilityPanel = document.getElementById('accessibilityPanel');
    const closeBtn = document.getElementById('closeAccessibilityBtn');
    const resetBtn = document.getElementById('resetAccessibilityBtn');
    
    // Abrir/cerrar panel
    accessibilityBtn.addEventListener('click', () => {
        accessibilityPanel.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => {
        accessibilityPanel.classList.remove('active');
    });
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!accessibilityPanel.contains(e.target) && !accessibilityBtn.contains(e.target)) {
            accessibilityPanel.classList.remove('active');
        }
    });
    
    // Atajo de teclado CTRL+U
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            accessibilityPanel.classList.toggle('active');
        }
    });
    
    // Características individuales
    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleAccessibilityFeature(btn.dataset.feature);
        });
    });
    
    // Perfiles
    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activateAccessibilityProfile(btn.dataset.profile);
        });
    });
    
    // Restablecer
    resetBtn.addEventListener('click', () => {
        accessibilityState.features.clear();
        accessibilityState.activeProfile = null;
        document.body.className = document.body.classList.contains('dark') ? 'dark' : '';
        document.querySelectorAll('.feature-btn, .profile-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        localStorage.removeItem('accessibilityState');
    });
    
    // Cargar estado guardado
    loadAccessibilityState();
}

function toggleAccessibilityFeature(feature) {
    if (accessibilityState.features.has(feature)) {
        accessibilityState.features.delete(feature);
        document.body.classList.remove(feature);
    } else {
        accessibilityState.features.add(feature);
        document.body.classList.add(feature);
    }
    updateAccessibilityUI();
    saveAccessibilityState();
}

function activateAccessibilityProfile(profile) {
    if (accessibilityState.activeProfile) {
        document.querySelector(`[data-profile="${accessibilityState.activeProfile}"]`).classList.remove('active');
    }
    
    if (accessibilityState.activeProfile === profile) {
        accessibilityState.activeProfile = null;
        accessibilityProfiles[profile].forEach(feature => {
            accessibilityState.features.delete(feature);
            document.body.classList.remove(feature);
        });
    } else {
        accessibilityState.activeProfile = profile;
        accessibilityProfiles[profile].forEach(feature => {
            accessibilityState.features.add(feature);
            document.body.classList.add(feature);
        });
        document.querySelector(`[data-profile="${profile}"]`).classList.add('active');
    }
    
    updateAccessibilityUI();
    saveAccessibilityState();
}

function updateAccessibilityUI() {
    document.querySelectorAll('.feature-btn').forEach(btn => {
        const feature = btn.dataset.feature;
        if (accessibilityState.features.has(feature)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function saveAccessibilityState() {
    localStorage.setItem('accessibilityState', JSON.stringify({
        features: Array.from(accessibilityState.features),
        activeProfile: accessibilityState.activeProfile
    }));
}

function loadAccessibilityState() {
    const saved = localStorage.getItem('accessibilityState');
    if (saved) {
        const data = JSON.parse(saved);
        data.features.forEach(feature => {
            accessibilityState.features.add(feature);
            document.body.classList.add(feature);
        });
        if (data.activeProfile) {
            accessibilityState.activeProfile = data.activeProfile;
            document.querySelector(`[data-profile="${data.activeProfile}"]`)?.classList.add('active');
        }
        updateAccessibilityUI();
    }
}
