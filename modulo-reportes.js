document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const inputBuscar = document.querySelector('input[placeholder^="Buscar reportes"]');
  const btnNuevo = document.querySelector(".btn-dark");
  const btnExportar = document.querySelector(".btn-outline-secondary");
    const btnActualizarRendimiento = document.getElementById("btnActualizarRendimiento");
    const btnExportarRendimiento = document.getElementById("btnExportarRendimiento");
    const tablaInventario = document.querySelector("#tablaInventarioBody");
    const tablaVendedores = document.getElementById("tablaVendedoresBody");

    // Datos de reportes de inventario
  let reportes = JSON.parse(localStorage.getItem("reportes")) || [
    { nombre: "Reporte A", fecha: "2025-10-01", estado: "Activo" },
    { nombre: "Reporte B", fecha: "2025-09-15", estado: "Archivado" }
  ];

    // Array de vendedores
    let vendedores = [
        { id: 1, nombre: 'Ana López' },
        { id: 2, nombre: 'Carlos Ruiz' },
        { id: 3, nombre: 'Juan Pérez' }
    ];

    // Inicializar datos simulados si no existen
    inicializarDatosSimulados();

    // Cargar librerías necesarias
  cargarXLSXIfNeeded();

    // Renderizar tablas iniciales
    renderTablaInventario();
    renderTablaRendimiento();

    // Event listeners para pestañas
    document.getElementById('inventario-tab').addEventListener('click', () => {
        renderTablaInventario();
    });

    document.getElementById('rendimiento-tab').addEventListener('click', () => {
        renderTablaRendimiento();
    });

    // Búsqueda en reportes de inventario
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            const q = inputBuscar.value.trim().toLowerCase();
            const rows = Array.from(tablaInventario.querySelectorAll('tr'));
            rows.forEach(tr => {
                const text = tr.innerText.toLowerCase();
                tr.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    // Botón nuevo reporte
    if (btnNuevo) {
        btnNuevo.addEventListener("click", () => {
            mostrarModalNuevoReporte();
        });
    }

    // Botón exportar reportes de inventario
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            exportarReportesInventario();
        });
    }

    // Botón actualizar rendimiento
    if (btnActualizarRendimiento) {
        btnActualizarRendimiento.addEventListener("click", () => {
            renderTablaRendimiento();
        });
    }

    // Botón exportar rendimiento
    if (btnExportarRendimiento) {
        btnExportarRendimiento.addEventListener("click", () => {
            exportarRendimiento();
        });
    }

    // Funciones para reportes de inventario
    function renderTablaInventario() {
        if (!tablaInventario) return;
        
        tablaInventario.innerHTML = "";
        reportes.forEach((r, i) => {
      const color = r.estado === "Activo" ? "success" : "warning text-dark";
            tablaInventario.insertAdjacentHTML("beforeend", `
        <tr>
                    <td>${i + 1}</td>
                    <td>${r.nombre}</td>
                    <td>${r.fecha}</td>
                    <td><span class="badge bg-${color}">${r.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info ver" data-i="${i}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-warning editar" data-i="${i}"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn btn-sm btn-danger eliminar" data-i="${i}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`);
    });
        bindEventosInventario();
    }

    function bindEventosInventario() {
        document.querySelectorAll(".ver").forEach(b => b.onclick = e => verReporte(parseInt(e.currentTarget.dataset.i, 10)));
        document.querySelectorAll(".editar").forEach(b => b.onclick = e => editarReporte(parseInt(e.currentTarget.dataset.i, 10)));
        document.querySelectorAll(".eliminar").forEach(b => b.onclick = e => eliminarReporte(parseInt(e.currentTarget.dataset.i, 10)));
    }

    function verReporte(i) {
        const r = reportes[i];
        alert(`Reporte: ${r.nombre}\nFecha: ${r.fecha}\nEstado: ${r.estado}`);
    }

    function editarReporte(i) {
    const r = reportes[i];
    removeIfExists("modalEditarReporte");
    const html = `
      <div class="modal fade" id="modalEditarReporte" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5>Editar Reporte</h5>
                            <button class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
          <div class="modal-body">
            <form id="formEditarReporte" novalidate>
                                <div class="mb-2">
                                    <label>Nombre</label>
                                    <input class="form-control" id="edit_nombre" value="${escapeHtml(r.nombre)}" required>
                                </div>
                                <div class="mb-2">
                                    <label>Fecha</label>
                                    <input type="date" class="form-control" id="edit_fecha" value="${r.fecha}" required>
                                </div>
                                <div class="mb-3">
                                    <label>Estado</label>
                                    <select class="form-select" id="edit_estado">
                                        <option ${r.estado === "Activo" ? "selected" : ""}>Activo</option>
                                        <option ${r.estado === "Archivado" ? "selected" : ""}>Archivado</option>
                                    </select>
                                </div>
              <button class="btn btn-primary w-100" type="submit">Guardar Cambios</button>
            </form>
          </div>
                    </div>
                </div>
            </div>`;
        
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalEditarReporte");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formEditarReporte");
            form.addEventListener("submit", function onSubmit(e) {
        e.preventDefault();
        r.nombre = document.getElementById("edit_nombre").value.trim();
        r.fecha = document.getElementById("edit_fecha").value;
        r.estado = document.getElementById("edit_estado").value;
                guardarReportes();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  }

    function eliminarReporte(i) {
    if (!confirm(`¿Eliminar ${reportes[i].nombre}?`)) return;
        reportes.splice(i, 1);
        guardarReportes();
    }

    function mostrarModalNuevoReporte() {
        removeIfExists("modalNuevoReporte");
        const html = `
            <div class="modal fade" id="modalNuevoReporte" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5>Nuevo Reporte</h5>
                            <button class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formNuevoReporte" novalidate>
                                <div class="mb-2">
                                    <label>Nombre</label>
                                    <input class="form-control" id="nuevo_nombre" required>
                                </div>
                                <div class="mb-2">
                                    <label>Fecha</label>
                                    <input type="date" class="form-control" id="nuevo_fecha" required>
                                </div>
                                <div class="mb-3">
                                    <label>Estado</label>
                                    <select class="form-select" id="nuevo_estado">
                                        <option>Activo</option>
                                        <option>Archivado</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary w-100" type="submit">Guardar</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML("beforeend", html);
        const modalEl = document.getElementById("modalNuevoReporte");
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener("shown.bs.modal", () => {
            const form = document.getElementById("formNuevoReporte");
            form.addEventListener("submit", function onSubmit(e) {
                e.preventDefault();
                const nuevo = {
                    nombre: document.getElementById("nuevo_nombre").value.trim(),
                    fecha: document.getElementById("nuevo_fecha").value,
                    estado: document.getElementById("nuevo_estado").value
                };
                if (!nuevo.nombre || !nuevo.fecha) return alert("Completa todos los campos.");
                reportes.push(nuevo);
                guardarReportes();
                form.removeEventListener("submit", onSubmit);
                modal.hide();
            }, { once: true });
        });

        modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
    }

    // Funciones para rendimiento comercial
    function renderTablaRendimiento() {
        if (!tablaVendedores) return;

        // Obtener datos de facturas y cotizaciones
        const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
        const cotizaciones = JSON.parse(localStorage.getItem("cotizaciones")) || [];

        tablaVendedores.innerHTML = "";

        vendedores.forEach((vendedor, index) => {
            // Filtrar facturas del vendedor
            const facturasVendedor = facturas.filter(f => f.vendedorId === vendedor.id);
            
            // Filtrar cotizaciones del vendedor
            const cotizacionesVendedor = cotizaciones.filter(c => c.vendedorId === vendedor.id);

            // Calcular monto vendido
            const montoVendido = facturasVendedor.reduce((total, factura) => {
                return total + (parseFloat(factura.monto) || 0);
            }, 0);

            // Determinar nivel de rendimiento
            const nivelRendimiento = determinarNivelRendimiento(montoVendido, facturasVendedor.length, cotizacionesVendedor.length);

            tablaVendedores.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>
                        <div class="fw-bold">${vendedor.nombre}</div>
                        <small class="text-muted">ID: ${vendedor.id}</small>
                    </td>
                    <td>
                        <span class="fw-bold">S/ ${montoVendido.toFixed(2)}</span>
                    </td>
                    <td>
                        <span class="badge bg-primary">${facturasVendedor.length}</span>
                    </td>
                    <td>
                        <span class="badge bg-info">${cotizacionesVendedor.length}</span>
                    </td>
                    <td>
                        <span class="badge performance-badge ${nivelRendimiento.class}">${nivelRendimiento.texto}</span>
                        <button class="btn btn-sm btn-outline-primary ms-2" onclick="verDetalleVendedor(${vendedor.id})" title="Ver Detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>`);
        });
    }

    function determinarNivelRendimiento(montoVendido, facturas, cotizaciones) {
        const totalActividades = facturas + cotizaciones;
        
        if (montoVendido >= 10000 && totalActividades >= 10) {
            return { texto: "Alto", class: "performance-high" };
        } else if (montoVendido >= 5000 && totalActividades >= 5) {
            return { texto: "Medio", class: "performance-medium" };
        } else {
            return { texto: "Bajo", class: "performance-low" };
        }
    }

    function inicializarDatosSimulados() {
        // Inicializar facturas simuladas si no existen
        if (!localStorage.getItem("facturas")) {
            const facturasSimuladas = [
                { id: "FAC-001", vendedorId: 1, monto: 2500.00, fecha: "2024-02-20", cliente: "Empresa A" },
                { id: "FAC-002", vendedorId: 1, monto: 1800.50, fecha: "2024-02-18", cliente: "Empresa B" },
                { id: "FAC-003", vendedorId: 2, monto: 3200.00, fecha: "2024-02-19", cliente: "Empresa C" },
                { id: "FAC-004", vendedorId: 2, monto: 1500.75, fecha: "2024-02-17", cliente: "Empresa D" },
                { id: "FAC-005", vendedorId: 3, monto: 4200.00, fecha: "2024-02-16", cliente: "Empresa E" },
                { id: "FAC-006", vendedorId: 1, monto: 2800.25, fecha: "2024-02-15", cliente: "Empresa F" },
                { id: "FAC-007", vendedorId: 2, monto: 1950.00, fecha: "2024-02-14", cliente: "Empresa G" },
                { id: "FAC-008", vendedorId: 3, monto: 3500.50, fecha: "2024-02-13", cliente: "Empresa H" }
            ];
            localStorage.setItem("facturas", JSON.stringify(facturasSimuladas));
        }

        // Inicializar cotizaciones simuladas si no existen
        if (!localStorage.getItem("cotizaciones")) {
            const cotizacionesSimuladas = [
                { id: "COT-001", vendedorId: 1, cliente: "CLI-001 - Juan Carlos Pérez", fecha: "2024-02-20", total: 1500.00, estado: "Pendiente", descripcion: "Mantenimiento preventivo completo" },
                { id: "COT-002", vendedorId: 2, cliente: "CLI-003 - Carlos Mendoza", fecha: "2024-02-18", total: 850.50, estado: "Aprobada", descripcion: "Reparación de motor principal" },
                { id: "COT-003", vendedorId: 1, cliente: "CLI-004 - María González", fecha: "2024-02-19", total: 2200.00, estado: "Pendiente", descripcion: "Instalación de nuevo equipo" },
                { id: "COT-004", vendedorId: 3, cliente: "CLI-005 - Roberto Silva", fecha: "2024-02-17", total: 1800.75, estado: "Aprobada", descripcion: "Mantenimiento correctivo" },
                { id: "COT-005", vendedorId: 2, cliente: "CLI-006 - Ana Torres", fecha: "2024-02-16", total: 3200.00, estado: "Rechazada", descripcion: "Actualización de sistema" },
                { id: "COT-006", vendedorId: 1, cliente: "CLI-007 - Luis Morales", fecha: "2024-02-15", total: 950.25, estado: "Pendiente", descripcion: "Reparación menor" },
                { id: "COT-007", vendedorId: 3, cliente: "CLI-008 - Carmen Vega", fecha: "2024-02-14", total: 2800.00, estado: "Aprobada", descripcion: "Instalación completa" }
            ];
            localStorage.setItem("cotizaciones", JSON.stringify(cotizacionesSimuladas));
        }
    }

    function exportarReportesInventario() {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no cargó.");
    const hoja = XLSX.utils.json_to_sheet(reportes);
    const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Reportes Inventario");
        XLSX.writeFile(libro, "reportes_inventario.xlsx");
    }

    function exportarRendimiento() {
        if (typeof XLSX === "undefined") return alert("La librería XLSX aún no cargó.");
        
        const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
        const cotizaciones = JSON.parse(localStorage.getItem("cotizaciones")) || [];
        
        const datosRendimiento = vendedores.map(vendedor => {
            const facturasVendedor = facturas.filter(f => f.vendedorId === vendedor.id);
            const cotizacionesVendedor = cotizaciones.filter(c => c.vendedorId === vendedor.id);
            const montoVendido = facturasVendedor.reduce((total, factura) => total + (parseFloat(factura.monto) || 0), 0);
            
            return {
                Vendedor: vendedor.nombre,
                "Monto Vendido (S/)": montoVendido.toFixed(2),
                "Facturas Emitidas": facturasVendedor.length,
                "Cotizaciones Enviadas": cotizacionesVendedor.length
            };
        });
        
        const hoja = XLSX.utils.json_to_sheet(datosRendimiento);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Rendimiento Comercial");
        XLSX.writeFile(libro, "rendimiento_comercial.xlsx");
    }

    function guardarReportes() {
        localStorage.setItem("reportes", JSON.stringify(reportes));
        renderTablaInventario();
    }

    // Función global para ver detalle del vendedor
    window.verDetalleVendedor = function(vendedorId) {
        const vendedor = vendedores.find(v => v.id === vendedorId);
        const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
        const cotizaciones = JSON.parse(localStorage.getItem("cotizaciones")) || [];
        
        const facturasVendedor = facturas.filter(f => f.vendedorId === vendedorId);
        const cotizacionesVendedor = cotizaciones.filter(c => c.vendedorId === vendedorId);
        const montoVendido = facturasVendedor.reduce((total, factura) => total + (parseFloat(factura.monto) || 0), 0);
        
        removeIfExists("modalDetalleVendedor");
        const html = `
            <div class="modal fade" id="modalDetalleVendedor" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle de Rendimiento - ${vendedor.nombre}</h5>
                            <button class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h5 class="card-title text-success">S/ ${montoVendido.toFixed(2)}</h5>
                                            <p class="card-text">Monto Vendido</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h5 class="card-title text-primary">${facturasVendedor.length}</h5>
                                            <p class="card-text">Facturas Emitidas</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h5 class="card-title text-info">${cotizacionesVendedor.length}</h5>
                                            <p class="card-text">Cotizaciones Enviadas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h6>Facturas Recientes</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Monto</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${facturasVendedor.slice(0, 5).map(f => `
                                            <tr>
                                                <td>${f.id}</td>
                                                <td>${f.cliente}</td>
                                                <td>S/ ${parseFloat(f.monto).toFixed(2)}</td>
                                                <td>${f.fecha}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <h6>Cotizaciones Recientes</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cotizacionesVendedor.slice(0, 5).map(c => `
                                            <tr>
                                                <td>${c.id}</td>
                                                <td>${c.cliente}</td>
                                                <td>S/ ${parseFloat(c.total).toFixed(2)}</td>
                                                <td><span class="badge bg-${c.estado === 'Aprobada' ? 'success' : c.estado === 'Pendiente' ? 'warning' : 'danger'}">${c.estado}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML("beforeend", html);
        new bootstrap.Modal(document.getElementById("modalDetalleVendedor")).show();
        document.getElementById("modalDetalleVendedor").addEventListener("hidden.bs.modal", e => e.target.remove(), { once: true });
    };

    // Funciones helper
    function removeIfExists(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function cargarXLSXIfNeeded() {
        if (typeof XLSX === "undefined") {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            document.head.appendChild(s);
        }
    }
});