document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[placeholder^="Buscar productos"]');
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
  const btnNuevo = document.querySelector(".btn-dark");
  const btnExportar = document.querySelector(".btn-outline-secondary");
  const tabla = document.querySelector("table tbody");

  let productos = JSON.parse(localStorage.getItem("productos")) || [
    { codigo: "PROD-001", nombre: "Producto A", ubicacion: "B1", stock: 50, precio: 25.50, estado: "Disponible" },
    { codigo: "PROD-002", nombre: "Producto B", ubicacion: "C2", stock: 30, precio: 18.75, estado: "Bajo Stock" }
  ];

  let historialPrecios = JSON.parse(localStorage.getItem("historialPrecios")) || [
    { codigo: "PROD-001", historial: [
      { fecha: "2024-01-15", precio: 20.00, motivo: "Precio inicial" },
      { fecha: "2024-02-01", precio: 22.50, motivo: "Ajuste por inflación" },
      { fecha: "2024-02-20", precio: 25.50, motivo: "Actualización de costos" }
    ]},
    { codigo: "PROD-002", historial: [
      { fecha: "2024-01-10", precio: 15.00, motivo: "Precio inicial" },
      { fecha: "2024-02-05", precio: 16.25, motivo: "Aumento de demanda" },
      { fecha: "2024-02-18", precio: 18.75, motivo: "Actualización de proveedor" }
    ]}
  ];

  cargarXLSXIfNeeded();
  renderTabla();

  // Nuevo
  btnNuevo.addEventListener("click", () => {
    removeIfExists("modalNuevoProducto");
    const html = `
      <div class="modal fade" id="modalNuevoProducto" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Agregar Nuevo Producto</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formNuevoProducto" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="nuevo_codigo" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="nuevo_nombre" required></div>
              <div class="mb-2"><label>Ubicación</label><input class="form-control" id="nuevo_ubicacion" placeholder="Ej: B1, C2, D3..." required></div>
              <div class="mb-2"><label>Stock</label><input type="number" class="form-control" id="nuevo_stock" min="0" required></div>
              <div class="mb-2"><label>Precio (S/)</label><input type="number" class="form-control" id="nuevo_precio" step="0.01" min="0" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="nuevo_estado">
                <option>Disponible</option><option>Bajo Stock</option><option>En Tránsito</option>
              </select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalNuevoProducto");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formNuevoProducto");
      form.addEventListener("submit", function onSubmit(e) {
        e.preventDefault();
        const codigo = document.getElementById("nuevo_codigo").value.trim();
        const nombre = document.getElementById("nuevo_nombre").value.trim();
        const ubicacion = document.getElementById("nuevo_ubicacion").value.trim();
        const stock = parseInt(document.getElementById("nuevo_stock").value, 10);
        const precio = parseFloat(document.getElementById("nuevo_precio").value);
        const estado = document.getElementById("nuevo_estado").value;
        if (!codigo || !nombre || !ubicacion || isNaN(stock) || isNaN(precio)) return alert("Completa todos los campos correctamente.");
        productos.push({ codigo, nombre, ubicacion, stock, precio, estado });
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  });

  // Render + listeners
  function renderTabla() {
    tabla.innerHTML = "";
    productos.forEach((p, i) => {
      const color = p.estado === "Disponible" ? "success" : p.estado === "Bajo Stock" ? "warning" : "secondary";
      tabla.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${i + 1}</td>
          <td>${p.codigo}</td>
          <td>${p.nombre}</td>
          <td>${p.ubicacion || p.categoria || 'N/A'}</td>
          <td>${p.stock}</td>
          <td><span class="precio-clickeable" style="cursor: pointer; color: #007bff; text-decoration: underline;" data-codigo="${p.codigo}" title="Click para ver historial de precios">S/ ${p.precio ? p.precio.toFixed(2) : '0.00'}</span></td>
          <td><span class="badge bg-${color}">${p.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info ver" data-i="${i}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-warning editar" data-i="${i}"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn btn-sm btn-danger eliminar" data-i="${i}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`);
    });

    // Delegación: bind después de render
    document.querySelectorAll(".ver").forEach(b => b.onclick = e => verProducto(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".editar").forEach(b => b.onclick = e => editarProducto(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".eliminar").forEach(b => b.onclick = e => eliminarProducto(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".precio-clickeable").forEach(b => b.onclick = e => mostrarHistorialPrecios(e.currentTarget.dataset.codigo));
  }

  function verProducto(i) {
    const p = productos[i];
    removeIfExists("modalVerProducto");
    const html = `
      <div class="modal fade" id="modalVerProducto" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Detalles</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p><strong>Código:</strong> ${p.codigo}</p>
            <p><strong>Nombre:</strong> ${p.nombre}</p>
            <p><strong>Ubicación:</strong> ${p.ubicacion || p.categoria || 'N/A'}</p>
            <p><strong>Stock:</strong> ${p.stock}</p>
            <p><strong>Precio:</strong> S/ ${p.precio ? p.precio.toFixed(2) : '0.00'}</p>
            <p><strong>Estado:</strong> ${p.estado}</p>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    new bootstrap.Modal(document.getElementById("modalVerProducto")).show();
    document.getElementById("modalVerProducto").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function editarProducto(i) {
    const p = productos[i];
    removeIfExists("modalEditarProducto");
    const html = `
      <div class="modal fade" id="modalEditarProducto" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Editar Producto</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formEditarProducto" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="edit_codigo" value="${escapeHtml(p.codigo)}" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="edit_nombre" value="${escapeHtml(p.nombre)}" required></div>
              <div class="mb-2"><label>Ubicación</label><input class="form-control" id="edit_ubicacion" value="${escapeHtml(p.ubicacion || p.categoria || '')}" placeholder="Ej: B1, C2, D3..." required></div>
              <div class="mb-2"><label>Stock</label><input type="number" class="form-control" id="edit_stock" value="${p.stock}" min="0" required></div>
              <div class="mb-2"><label>Precio (S/)</label><input type="number" class="form-control" id="edit_precio" value="${p.precio || 0}" step="0.01" min="0" required></div>
              <div class="mb-3"><label>Estado</label>
                <select class="form-select" id="edit_estado">
                  <option ${p.estado === "Disponible" ? "selected" : ""}>Disponible</option>
                  <option ${p.estado === "Bajo Stock" ? "selected" : ""}>Bajo Stock</option>
                  <option ${p.estado === "En Tránsito" ? "selected" : ""}>En Tránsito</option>
                </select>
              </div>
              <button class="btn btn-primary w-100" type="submit">Guardar Cambios</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);

    const modalEl = document.getElementById("modalEditarProducto");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formEditarProducto");
      form.addEventListener("submit", function onSubmit(e) {
        e.preventDefault();
        const codigo = document.getElementById("edit_codigo").value.trim();
        const nombre = document.getElementById("edit_nombre").value.trim();
        const ubicacion = document.getElementById("edit_ubicacion").value.trim();
        const stock = parseInt(document.getElementById("edit_stock").value,10);
        const precio = parseFloat(document.getElementById("edit_precio").value);
        const estado = document.getElementById("edit_estado").value;
        if (!codigo || !nombre || !ubicacion || isNaN(stock) || isNaN(precio)) return alert("Completa todos los campos correctamente.");
        productos[i] = { codigo, nombre, ubicacion, stock, precio, estado };
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  }

  function eliminarProducto(i) {
    if (!confirm(`¿Eliminar ${productos[i].nombre}?`)) return;
    productos.splice(i, 1);
    guardarYActualizar();
  }

  function guardarYActualizar() {
    // Verificar y actualizar estados automáticamente
    productos.forEach(producto => {
      if (producto.stock <= 10 && producto.estado !== 'Bajo Stock') {
        producto.estado = 'Bajo Stock';
      } else if (producto.stock > 10 && producto.estado === 'Bajo Stock') {
        producto.estado = 'Disponible';
      }
    });
    
    localStorage.setItem("productos", JSON.stringify(productos));
    localStorage.setItem("historialPrecios", JSON.stringify(historialPrecios));
    
    // Notificar cambios para el sistema de notificaciones
    window.dispatchEvent(new CustomEvent('inventoryUpdated', { 
      detail: { productos: productos } 
    }));
    
    renderTabla();
  }

  function guardarHistorialPrecios() {
    localStorage.setItem("historialPrecios", JSON.stringify(historialPrecios));
  }

  btnExportar.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no se ha cargado.");
    const hoja = XLSX.utils.json_to_sheet(productos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
    XLSX.writeFile(libro, "inventario.xlsx");
  });

  // Funciones para historial de precios
  function mostrarHistorialPrecios(codigo) {
    const producto = productos.find(p => p.codigo === codigo);
    const historial = historialPrecios.find(h => h.codigo === codigo);
    
    if (!producto) return;
    
    removeIfExists("modalHistorialPrecios");
    const html = `
      <div class="modal fade" id="modalHistorialPrecios" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Historial de Precios - ${producto.nombre}</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Código: ${codigo}</h6>
                <button class="btn btn-success btn-sm" id="btnCambiarPrecio">
                  <i class="fas fa-edit me-1"></i> Cambiar Precio
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Precio Anterior</th>
                      <th>Precio Nuevo</th>
                      <th>Motivo del Cambio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderHistorialPrecios(historial ? historial.historial : [])}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalHistorialPrecios"));
    modal.show();

    // Event listener para cambiar precio
    document.getElementById("btnCambiarPrecio").addEventListener("click", () => {
      modal.hide();
      mostrarFormularioCambioPrecio(codigo);
    });

    document.getElementById("modalHistorialPrecios").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function renderHistorialPrecios(historial) {
    if (!historial || historial.length === 0) {
      return '<tr><td colspan="5" class="text-center text-muted">No hay historial de precios disponible</td></tr>';
    }
    
    return historial.map((h, i) => {
      const precioAnterior = i > 0 ? historial[i - 1].precio : null;
      const cambio = precioAnterior ? (h.precio - precioAnterior).toFixed(2) : null;
      const colorCambio = cambio > 0 ? 'text-success' : cambio < 0 ? 'text-danger' : '';
      
      return `
        <tr>
          <td>${h.fecha}</td>
          <td>${precioAnterior ? `S/ ${precioAnterior.toFixed(2)}` : '-'}</td>
          <td class="${colorCambio}">S/ ${h.precio.toFixed(2)}</td>
          <td>${h.motivo}</td>
          <td>
            ${cambio ? `<small class="${colorCambio}">${cambio > 0 ? '+' : ''}S/ ${cambio}</small>` : '<small class="text-muted">Precio inicial</small>'}
          </td>
        </tr>`;
    }).join("");
  }

  function mostrarFormularioCambioPrecio(codigo) {
    const producto = productos.find(p => p.codigo === codigo);
    if (!producto) return;
    
    removeIfExists("modalCambiarPrecio");
    const html = `
      <div class="modal fade" id="modalCambiarPrecio" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Cambiar Precio - ${producto.nombre}</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formCambiarPrecio" novalidate>
                <div class="mb-3">
                  <label class="form-label">Precio Actual</label>
                  <input type="text" class="form-control" value="S/ ${producto.precio.toFixed(2)}" readonly>
                </div>
                <div class="mb-3">
                  <label class="form-label">Nuevo Precio (S/)</label>
                  <input type="number" class="form-control" id="nuevo_precio" step="0.01" min="0" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Motivo del Cambio</label>
                  <textarea class="form-control" id="motivo_cambio" rows="3" placeholder="Ej: Ajuste por inflación, cambio de proveedor, etc." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-100">Actualizar Precio</button>
              </form>
            </div>
          </div>
        </div>
      </div>`;
    
    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById("modalCambiarPrecio"));
    modal.show();

    document.getElementById("formCambiarPrecio").addEventListener("submit", (e) => {
      e.preventDefault();
      const nuevoPrecio = parseFloat(document.getElementById("nuevo_precio").value);
      const motivo = document.getElementById("motivo_cambio").value.trim();
      
      if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
        alert("Por favor ingresa un precio válido.");
        return;
      }
      
      if (!motivo) {
        alert("Por favor ingresa el motivo del cambio.");
        return;
      }
      
      // Actualizar precio del producto
      producto.precio = nuevoPrecio;
      
      // Agregar al historial
      agregarAlHistorialPrecios(codigo, nuevoPrecio, motivo);
      
      // Guardar cambios
      guardarYActualizar();
      
      modal.hide();
      mostrarHistorialPrecios(codigo);
    });

    document.getElementById("modalCambiarPrecio").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
  }

  function agregarAlHistorialPrecios(codigo, nuevoPrecio, motivo) {
    let historialProducto = historialPrecios.find(h => h.codigo === codigo);
    
    if (!historialProducto) {
      historialProducto = { codigo: codigo, historial: [] };
      historialPrecios.push(historialProducto);
    }
    
    const fechaActual = new Date().toISOString().split('T')[0];
    historialProducto.historial.push({
      fecha: fechaActual,
      precio: nuevoPrecio,
      motivo: motivo
    });
    
    // Ordenar por fecha (más reciente primero)
    historialProducto.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  // helpers
  function removeIfExists(id) { const el = document.getElementById(id); if (el) el.remove(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cargarXLSXIfNeeded(){
    if (typeof XLSX === "undefined") {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(s);
    }
  }
});

