function initCarousel(carouselContainer) {
  if (!carouselContainer) return;
  const images = carouselContainer.querySelectorAll("img");
  let current = 0;

  if (!images.length) return;
  images[current].classList.add("active");

  setInterval(() => {
    images[current].classList.remove("active");
    current = (current + 1) % images.length;
    images[current].classList.add("active");
  }, 5000);
}

// Cargar data.json
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    const menu = document.getElementById("menu");
    const content = document.getElementById("content");

    data.sections.forEach((section, index) => {
      const btn = document.createElement("button");
      btn.textContent = section.title;
      btn.addEventListener("click", () => loadSection(section));
      menu.appendChild(btn);
      if (index === 0) loadSection(section);
    });

    function loadSection(section) {
      content.innerHTML = `<h2>${section.title}</h2>`;
      section.subsections.forEach(sub => {
        let article = `<article><h3>${sub.title}</h3><p>${sub.content || ""}</p>`;

        if (sub.image) {
          article += `<img src="${sub.image}" alt="${sub.title}" style="max-width:100%;">`;
        }
        if (sub.video) {
          article += `<iframe width="100%" height="315" src="${sub.video}" frameborder="0" allowfullscreen></iframe>`;
        }
        if (sub.link) {
          article += `<iframe src="${sub.link}" width="100%" height="400" style="border:none;"></iframe>`;
        }
        if (sub.button) {
          article += `<a href="${sub.button.link}" target="_blank" class="curso-bubble">${sub.button.text}</a>`;
        }
        if (sub.type === "courses") {
          article += `<label>Selecciona un programa:</label>
            <select id="programSelect">
              <option value="">-- Seleccionar --</option>
              ${Object.keys(data.programs).map(p => `<option value="${p}">${p}</option>`).join("")}
            </select>
            <div id="courseBubbles"></div>`;
        }
        if (sub.type === "agenda") {
          article += `<div class="agenda-controls">
              <input type="date" id="fecha">
              <input type="text" id="actividad" placeholder="Escribe la actividad">
              <button id="agregarEventoBtn">Agregar</button>
            </div>
            <ul id="listaEventos"></ul>`;
        }
        if (sub.type === "carousel" && Array.isArray(sub.images)) {
          article += `<div class="carousel">`;
          sub.images.forEach((img, i) => {
            article += `<img src="${img}" alt="slide-${i}">`;
          });
          article += `</div>`;
        }
        if (sub.type === "accordion" && Array.isArray(sub.items)) {
          article += `<ul class="faq-list">`;
          sub.items.forEach(item => {
            article += `<li><strong>${item.q}</strong><br>${item.a}</li>`;
          });
          article += `</ul>`;
        }
        if (sub.type === "support" && Array.isArray(sub.zones)) {
          sub.zones.forEach(zone => {
            article += `<button class="accordion-btn">${zone.name}</button>
                        <div class="accordion-panel">`;
            zone.sedes.forEach(s => {
              article += `<p><strong>${s.nombre}</strong><br>
                          Dirección: ${s.direccion}<br>
                          Teléfono: ${s.telefono}<br>
                          Horario: ${s.horario}</p><hr>`;
            });
            article += `</div>`;
          });
        }

        article += `</article>`;
        content.innerHTML += article;
      });

      // Cursos dinámicos
      const programSelect = document.getElementById("programSelect");
      if (programSelect) {
        programSelect.addEventListener("change", () => {
          const bubbles = document.getElementById("courseBubbles");
          bubbles.innerHTML = "";
          const program = programSelect.value;
          if (program && data.programs[program]) {
            data.programs[program].forEach(curso => {
              const div = document.createElement("div");
              div.className = "curso-bubble";
              div.textContent = `${curso.name} (${curso.code})`;
              bubbles.appendChild(div);
            });
          }
        });
      }

      // Agenda
      if (document.getElementById("agregarEventoBtn")) {
        document.getElementById("agregarEventoBtn").addEventListener("click", agregarEvento);
        cargarEventos();
      }

      // Carrusel
      document.querySelectorAll(".carousel").forEach(c => initCarousel(c));

      // Acordeones soporte
      document.querySelectorAll(".accordion-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          this.classList.toggle("active");
          const panel = this.nextElementSibling;
          panel.classList.toggle("active");
        });
      });
    }
  });

// Agenda con localStorage
function agregarEvento() {
  const fecha = document.getElementById("fecha").value;
  const actividad = document.getElementById("actividad").value.trim();
  if (fecha && actividad) {
    const evento = { fecha, actividad };
    let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    eventos.push(evento);
    localStorage.setItem("eventos", JSON.stringify(eventos));
    cargarEventos();
  }
}
function cargarEventos() {
  const lista = document.getElementById("listaEventos");
  if (!lista) return;
  lista.innerHTML = "";
  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  eventos.forEach(ev => {
    const li = document.createElement("li");
    li.textContent = `${ev.fecha} - ${ev.actividad}`;
    lista.appendChild(li);
  });
}

// Dark mode
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


