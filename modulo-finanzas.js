document.addEventListener("DOMContentLoaded", () => {
  
   const btnNuevo = document.getElementById("btnNuevaFactura");
  const tablaBody = document.getElementById("tablaFacturasBody");
  const btnExportarFacturas = document.getElementById("btnExportarFacturas");

  let facturas = JSON.parse(localStorage.getItem("facturas")) || [
    { 
      id: 1, 
      numero: "F001-001", 
      cliente: "Juan Pérez (CLI-001)", 
      fecha: "2024-02-15", 
      monto: 1850.00, 
      estado: "Pagada" 
    },
    { 
      id: 2, 
      numero: "F001-002", 
      cliente: "María Elena García (CLI-002)", 
      fecha: "2024-02-14", 
      monto: 850.50, 
      estado: "Pendiente" 
    }
  ];

  renderTablaFacturas();
  cargarReporteInventario();
  cargarXLSXIfNeeded();

 

   function renderTablaFacturas() {
    tablaBody.innerHTML = "";
    if (facturas.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay facturas registradas.</td></tr>';
        return;
    }
    facturas.forEach((f) => {
      const color = f.estado === "Pagada" ? "success" : f.estado === "Pendiente" ? "warning" : "danger";
      tablaBody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${f.numero}</td>
          <td>${f.cliente}</td>
          <td>${f.fecha}</td>
          <td>S/ ${f.monto.toFixed(2)}</td>
          <td><span class="badge bg-${color} status-badge">${f.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info" title="Ver Detalles" data-id="${f.id}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-secondary" title="Descargar PDF" data-id="${f.id}"><i class="fas fa-file-pdf"></i></button>
            <button class="btn btn-sm btn-danger eliminar" title="Anular" data-id="${f.id}"><i class="fas fa-times-circle"></i></button>
          </td>
        </tr>`);
    });
    
   
    document.querySelectorAll(".eliminar").forEach(b => b.onclick = e => anularFactura(parseInt(e.currentTarget.dataset.id, 10)));
  }


  btnNuevo.addEventListener("click", () => {
    removeIfExists("modalNuevaFactura");
    
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const opcionesCliente = clientes.map(c => `<option value="${c.nombre} (${c.codigo})">${c.nombre} (${c.codigo})</option>`).join('');

    const html = `
      <div class="modal fade" id="modalNuevaFactura" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Generar Nueva Factura</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formNuevaFactura" novalidate>
              <div class="mb-2"><label>N° Factura</label><input class="form-control" id="nuevo_numero" placeholder="Ej: F001-003" required></div>
              <div class="mb-2"><label>Cliente</label><select class="form-select" id="nuevo_cliente" required>${opcionesCliente}</select></div>
              <div class="mb-2"><label>Fecha Emisión</label><input type="date" class="form-control" id="nuevo_fecha" required></div>
              <div class="mb-2"><label>Monto Total (S/)</label><input type="number" step="0.01" class="form-control" id="nuevo_monto" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="nuevo_estado">
                <option>Pendiente</option><option>Pagada</option>
              </select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar Factura</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    
    const modalEl = document.getElementById("modalNuevaFactura");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      document.getElementById("formNuevaFactura").addEventListener("submit", function onSubmit(e) {
        e.preventDefault();
        const nueva = {
          id: Date.now(),
          numero: document.getElementById("nuevo_numero").value.trim(),
          cliente: document.getElementById("nuevo_cliente").value,
          fecha: document.getElementById("nuevo_fecha").value,
          monto: parseFloat(document.getElementById("nuevo_monto").value),
          estado: document.getElementById("nuevo_estado").value
        };
        if (!nueva.numero || !nueva.cliente || !nueva.fecha || isNaN(nueva.monto)) return alert("Complete todos los campos.");
        
        facturas.push(nueva);
        guardarYActualizarFacturas();
        modal.hide();
      }, { once: true });
    });
    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  });

  function anularFactura(id) {
    const factura = facturas.find(f => f.id === id);
    if (confirm(`¿Está seguro que desea ANULAR la factura ${factura.numero}?`)) {
        
        factura.estado = "Anulada";
        factura.monto = 0.00; 
        guardarYActualizarFacturas();
    }
  }

  function guardarYActualizarFacturas() {
    localStorage.setItem("facturas", JSON.stringify(facturas));
    renderTablaFacturas();
  }


  btnExportarFacturas.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no se ha cargado.");
    const hoja = XLSX.utils.json_to_sheet(facturas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Facturas");
    XLSX.writeFile(libro, "reporte_facturas.xlsx");
  });


 

  function cargarReporteInventario() {
   
    const productos = JSON.parse(localStorage.getItem("productos")) || [
        { codigo: "PROD-001", nombre: "Producto A", categoria: "Categoría 1", stock: 50 },
        { codigo: "PROD-002", nombre: "Producto B", categoria: "Categoría 2", stock: 30 }
    ];
    
    
    const costos = {
        "PROD-001": 150.00,
        "PROD-002": 50.00,
        "Default": 20.00
    };

    const tablaReporte = document.getElementById("tablaReporteBody");
    const kpiValorTotalEl = document.getElementById("kpiValorTotal");
    const totalReporteEl = document.getElementById("totalReporte");
    
    tablaReporte.innerHTML = "";
    let valorTotalInventario = 0;

    productos.forEach(p => {
        const costoUnit = costos[p.codigo] || costos["Default"];
        const valorTotalProd = p.stock * costoUnit;
        valorTotalInventario += valorTotalProd;

        tablaReporte.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.stock}</td>
                <td>S/ ${costoUnit.toFixed(2)}</td>
                <td>S/ ${valorTotalProd.toFixed(2)}</td>
            </tr>
        `);
    });

    kpiValorTotalEl.innerText = `S/ ${valorTotalInventario.toFixed(2)}`;
    totalReporteEl.innerText = `S/ ${valorTotalInventario.toFixed(2)}`;
  }


  
  function removeIfExists(id) { 
    const el = document.getElementById(id); 
    if (el) el.remove(); 
  }
  
  function cargarXLSXIfNeeded(){
    if (typeof XLSX === "undefined") {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(s);
    }
  }
});