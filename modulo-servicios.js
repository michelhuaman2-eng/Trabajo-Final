document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[placeholder^="Buscar por cliente"]');
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    if (!input || rows.length === 0) return;
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        rows.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(q) ? '' : 'none';
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const inputBuscar = document.querySelector(".input-group input");
  const btnTodos = document.querySelector(".btn-outline-secondary.me-2");
  const btnExportar = document.querySelector(".btn-outline-dark");
  const btnCotizaciones = document.getElementById("btnCotizaciones");
  const tabla = document.querySelector("table tbody");

  let servicios = JSON.parse(localStorage.getItem("servicios")) || [
    { fecha:"2024-02-15 14:30", tipo:"garantía", cliente:"CLI-001 - Juan Carlos Pérez", maquina:"MAC-001 - Fresadora CNC", productos:"PRD-001 (1)", motivo:"Reparación", ref:"GA-21" },
    { fecha:"2024-02-14 09:15", tipo:"plan A", cliente:"CLI-002 - María Elena García", maquina:"MAC-002 - Torno CNC", productos:"PRD-002 (2), PRD-005 (1)", motivo:"Mantenimiento", ref:"PA-25" }
  ];

  let cotizaciones = JSON.parse(localStorage.getItem("cotizaciones")) || [
    { id: "COT-001", cliente: "CLI-001 - Juan Carlos Pérez", fecha: "2024-02-20", total: 1500.00, estado: "Pendiente", descripcion: "Mantenimiento preventivo completo" },
    { id: "COT-002", cliente: "CLI-003 - Carlos Mendoza", fecha: "2024-02-18", total: 850.50, estado: "Aprobada", descripcion: "Reparación de motor principal" }
  ];

  cargarXLSXIfNeeded();
  renderTabla();

  // buscar (dinámico)
  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.toLowerCase().trim();
    document.querySelectorAll("table tbody tr").forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(texto) ? "" : "none";
    });
  });

  // todos: limpia búsqueda y muestra todo
  btnTodos.addEventListener("click", () => {
    inputBuscar.value = "";
    document.querySelectorAll("table tbody tr").forEach(tr => tr.style.display = "");
  });

  // exportar (visibles)
  btnExportar.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no cargó.");
    const visibles = Array.from(document.querySelectorAll("table tbody tr")).filter(tr => tr.style.display !== "none");
    if (visibles.length === 0) return alert("No hay servicios visibles para exportar.");
    const datos = visibles.map(tr => {
      const tds = tr.querySelectorAll("td");
      return { Fecha:tds[0].innerText, Tipo:tds[1].innerText, Cliente:tds[2].innerText.replace(/\n/g," "), Máquina:tds[3].innerText.replace(/\n/g," "), Productos:tds[4].innerText, Motivo:tds[5].innerText, Ref:tds[6].innerText };
    });
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro, hoja, "Servicios"); XLSX.writeFile(libro, "servicios.xlsx");
  });

  // cotizaciones
  btnCotizaciones.addEventListener("click", () => {
    mostrarModalCotizaciones();
  });

  // render + bind (incluye ver/editar/eliminar)
  function renderTabla(){
    tabla.innerHTML = "";
    servicios.forEach((s,i) => {
      tabla.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${s.fecha}</td>
          <td><span class="badge bg-primary">${s.tipo}</span></td>
          <td><div class="fw-bold">${s.cliente.split(" - ")[0]}</div><div class="text-muted">${s.cliente.split(" - ")[1]||""}</div></td>
          <td><div class="fw-bold">${s.maquina.split(" - ")[0]}</div><div class="text-muted">${s.maquina.split(" - ")[1]||""}</div></td>
          <td>${s.productos}</td><td>${s.motivo}</td><td>${s.ref}</td>
        </tr>`);
    });
    // bind rows for ver/editar/eliminar via click — here we provide ver by click and no dedicated edit/delete buttons in HTML given,
    // so for minimal intrusion we add double-click to edit and context menu to delete
    document.querySelectorAll("table tbody tr").forEach((tr,index) => {
      tr.onclick = () => verServicio(index);
      tr.ondblclick = () => editarServicio(index);
      tr.oncontextmenu = (e) => { e.preventDefault(); if(confirm("¿Eliminar este servicio?")){ servicios.splice(index,1); guardarYActualizar(); } };
    });
  }

  function verServicio(i){
    const s = servicios[i];
    removeIfExists("modalVerServicio");
    const html = `<div class="modal fade" id="modalVerServicio" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><h5>Detalle Servicio</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <p><strong>Fecha:</strong> ${s.fecha}</p>
        <p><strong>Tipo:</strong> ${s.tipo}</p>
        <p><strong>Cliente:</strong> ${s.cliente}</p>
        <p><strong>Máquina:</strong> ${s.maquina}</p>
        <p><strong>Productos:</strong> ${s.productos}</p>
        <p><strong>Motivo:</strong> ${s.motivo}</p>
        <p><strong>Ref:</strong> ${s.ref}</p>
      </div>
    </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalVerServicio"));
    modal.show();
    document.getElementById("modalVerServicio").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function editarServicio(i){
    const s = servicios[i];
    removeIfExists("modalEditarServicio");
    const html = `<div class="modal fade" id="modalEditarServicio" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><h5>Editar Servicio</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <form id="formEditarServicio" novalidate>
          <div class="mb-2"><label>Fecha</label><input class="form-control" id="edit_fecha" value="${escapeHtml(s.fecha)}" required></div>
          <div class="mb-2"><label>Tipo</label><input class="form-control" id="edit_tipo" value="${escapeHtml(s.tipo)}" required></div>
          <div class="mb-2"><label>Cliente (Código - Nombre)</label><input class="form-control" id="edit_cliente" value="${escapeHtml(s.cliente)}" required></div>
          <div class="mb-2"><label>Máquina (Código - Nombre)</label><input class="form-control" id="edit_maquina" value="${escapeHtml(s.maquina)}" required></div>
          <div class="mb-2"><label>Productos</label><input class="form-control" id="edit_productos" value="${escapeHtml(s.productos)}"></div>
          <div class="mb-2"><label>Motivo</label><input class="form-control" id="edit_motivo" value="${escapeHtml(s.motivo)}"></div>
          <div class="mb-2"><label>Ref</label><input class="form-control" id="edit_ref" value="${escapeHtml(s.ref)}"></div>
          <button class="btn btn-primary w-100" type="submit">Guardar</button>
        </form>
      </div>
    </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalEditarServicio");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formEditarServicio");
      form.addEventListener("submit", function onSubmit(e){
        e.preventDefault();
        s.fecha = document.getElementById("edit_fecha").value.trim();
        s.tipo = document.getElementById("edit_tipo").value.trim();
        s.cliente = document.getElementById("edit_cliente").value.trim();
        s.maquina = document.getElementById("edit_maquina").value.trim();
        s.productos = document.getElementById("edit_productos").value.trim();
        s.motivo = document.getElementById("edit_motivo").value.trim();
        s.ref = document.getElementById("edit_ref").value.trim();
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  }

  function guardarYActualizar(){ localStorage.setItem("servicios", JSON.stringify(servicios)); renderTabla(); }
  function guardarCotizaciones(){ localStorage.setItem("cotizaciones", JSON.stringify(cotizaciones)); }
  function removeIfExists(id){ const el=document.getElementById(id); if(el) el.remove(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cargarXLSXIfNeeded(){ if(typeof XLSX==="undefined"){ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(s);} }

  // Funciones para cotizaciones
  function mostrarModalCotizaciones() {
    removeIfExists("modalCotizaciones");
    const html = `
      <div class="modal fade" id="modalCotizaciones" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Gestión de Cotizaciones</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Lista de Cotizaciones</h6>
                <button class="btn btn-success btn-sm" id="btnCrearCotizacion">
                  <i class="fas fa-plus me-1"></i> Crear
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="tablaCotizaciones">
                    ${renderTablaCotizaciones()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalCotizaciones"));
    modal.show();

    // Event listeners
    document.getElementById("btnCrearCotizacion").addEventListener("click", () => {
      modal.hide();
      mostrarFormularioCrearCotizacion();
    });

    // Bind eventos de acciones
    document.querySelectorAll(".btn-ver-cotizacion").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        verCotizacion(index);
      });
    });

    document.querySelectorAll(".btn-editar-cotizacion").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        editarCotizacion(index);
      });
    });

    document.querySelectorAll(".btn-eliminar-cotizacion").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        eliminarCotizacion(index);
      });
    });

    document.getElementById("modalCotizaciones").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function renderTablaCotizaciones() {
    return cotizaciones.map((c, i) => {
      const estadoColor = c.estado === "Aprobada" ? "success" : c.estado === "Pendiente" ? "warning" : "secondary";
      return `
        <tr>
          <td>${c.id}</td>
          <td>${c.cliente}</td>
          <td>${c.fecha}</td>
          <td>S/ ${c.total.toFixed(2)}</td>
          <td><span class="badge bg-${estadoColor}">${c.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info btn-ver-cotizacion" data-index="${i}" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning btn-editar-cotizacion" data-index="${i}" title="Editar">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-eliminar-cotizacion" data-index="${i}" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join("");
  }

  function mostrarFormularioCrearCotizacion() {
    removeIfExists("modalCrearCotizacion");
    const html = `
      <div class="modal fade" id="modalCrearCotizacion" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Crear Nueva Cotización</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formCrearCotizacion" novalidate>
                <div class="mb-3">
                  <label class="form-label">Cliente</label>
                  <input type="text" class="form-control" id="nuevo_cliente" placeholder="Código - Nombre del cliente" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Fecha</label>
                  <input type="date" class="form-control" id="nuevo_fecha" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" id="nuevo_descripcion" rows="3" placeholder="Descripción del servicio a cotizar" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total (S/)</label>
                  <input type="number" class="form-control" id="nuevo_total" step="0.01" min="0" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="nuevo_estado" required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100">Crear Cotización</button>
              </form>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalCrearCotizacion"));
    modal.show();

    // Set fecha actual
    document.getElementById("nuevo_fecha").value = new Date().toISOString().split('T')[0];

    // Event listener para el formulario
    document.getElementById("formCrearCotizacion").addEventListener("submit", (e) => {
      e.preventDefault();
      const nuevoId = "COT-" + String(cotizaciones.length + 1).padStart(3, '0');
      const nuevaCotizacion = {
        id: nuevoId,
        cliente: document.getElementById("nuevo_cliente").value.trim(),
        fecha: document.getElementById("nuevo_fecha").value,
        descripcion: document.getElementById("nuevo_descripcion").value.trim(),
        total: parseFloat(document.getElementById("nuevo_total").value),
        estado: document.getElementById("nuevo_estado").value
      };
      
      cotizaciones.push(nuevaCotizacion);
      guardarCotizaciones();
      modal.hide();
      mostrarModalCotizaciones();
    });

    document.getElementById("modalCrearCotizacion").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function verCotizacion(index) {
    const c = cotizaciones[index];
    removeIfExists("modalVerCotizacion");
    const html = `
      <div class="modal fade" id="modalVerCotizacion" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalles de Cotización</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p><strong>ID:</strong> ${c.id}</p>
              <p><strong>Cliente:</strong> ${c.cliente}</p>
              <p><strong>Fecha:</strong> ${c.fecha}</p>
              <p><strong>Descripción:</strong> ${c.descripcion}</p>
              <p><strong>Total:</strong> S/ ${c.total.toFixed(2)}</p>
              <p><strong>Estado:</strong> ${c.estado}</p>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    new bootstrap.Modal(document.getElementById("modalVerCotizacion")).show();
    document.getElementById("modalVerCotizacion").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function editarCotizacion(index) {
    const c = cotizaciones[index];
    removeIfExists("modalEditarCotizacion");
    const html = `
      <div class="modal fade" id="modalEditarCotizacion" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Cotización</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formEditarCotizacion" novalidate>
                <div class="mb-3">
                  <label class="form-label">Cliente</label>
                  <input type="text" class="form-control" id="edit_cliente" value="${escapeHtml(c.cliente)}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Fecha</label>
                  <input type="date" class="form-control" id="edit_fecha" value="${c.fecha}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" id="edit_descripcion" rows="3" required>${escapeHtml(c.descripcion)}</textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total (S/)</label>
                  <input type="number" class="form-control" id="edit_total" value="${c.total}" step="0.01" min="0" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="edit_estado" required>
                    <option value="Pendiente" ${c.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
                    <option value="Aprobada" ${c.estado === "Aprobada" ? "selected" : ""}>Aprobada</option>
                    <option value="Rechazada" ${c.estado === "Rechazada" ? "selected" : ""}>Rechazada</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100">Guardar Cambios</button>
              </form>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalEditarCotizacion"));
    modal.show();

    document.getElementById("formEditarCotizacion").addEventListener("submit", (e) => {
      e.preventDefault();
      cotizaciones[index] = {
        id: c.id,
        cliente: document.getElementById("edit_cliente").value.trim(),
        fecha: document.getElementById("edit_fecha").value,
        descripcion: document.getElementById("edit_descripcion").value.trim(),
        total: parseFloat(document.getElementById("edit_total").value),
        estado: document.getElementById("edit_estado").value
      };
      
      guardarCotizaciones();
      modal.hide();
      mostrarModalCotizaciones();
    });

    document.getElementById("modalEditarCotizacion").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function eliminarCotizacion(index) {
    if (confirm(`¿Estás seguro de eliminar la cotización ${cotizaciones[index].id}?`)) {
      cotizaciones.splice(index, 1);
      guardarCotizaciones();
      mostrarModalCotizaciones();
    }
  }
});
