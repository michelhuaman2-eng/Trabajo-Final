document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[placeholder^="Buscar clientes"]');
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

  let clientes = JSON.parse(localStorage.getItem("clientes")) || [
    { codigo: "CLI-001", nombre: "Juan Pérez", email: "juan.perez@email.com", telefono: "987654321", estado: "Activo" },
    { codigo: "CLI-002", nombre: "María Gómez", email: "maria.gomez@email.com", telefono: "912345678", estado: "Inactivo" }
  ];

  cargarXLSXIfNeeded();
  renderTabla();

  btnNuevo.addEventListener("click", () => {
    removeIfExists("modalNuevoCliente");
    const html = `
      <div class="modal fade" id="modalNuevoCliente" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Nuevo Cliente</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formNuevoCliente" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="nuevo_codigo" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="nuevo_nombre" required></div>
              <div class="mb-2"><label>Email</label><input type="email" class="form-control" id="nuevo_email" required></div>
              <div class="mb-2"><label>Teléfono</label><input class="form-control" id="nuevo_telefono" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="nuevo_estado"><option>Activo</option><option>Inactivo</option></select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalNuevoCliente");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formNuevoCliente");
      form.addEventListener("submit", function onSubmit(e) {
        e.preventDefault();
        const nuevo = {
          codigo: document.getElementById("nuevo_codigo").value.trim(),
          nombre: document.getElementById("nuevo_nombre").value.trim(),
          email: document.getElementById("nuevo_email").value.trim(),
          telefono: document.getElementById("nuevo_telefono").value.trim(),
          estado: document.getElementById("nuevo_estado").value
        };
        if (!nuevo.codigo || !nuevo.nombre || !nuevo.email || !nuevo.telefono) return alert("Completa todos los campos.");
        clientes.push(nuevo);
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  });

  function renderTabla(){
    tabla.innerHTML = "";
    clientes.forEach((c,i) => {
      const color = c.estado === "Activo" ? "success" : "danger";
      tabla.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${i+1}</td><td>${c.codigo}</td><td>${c.nombre}</td><td>${c.email}</td><td>${c.telefono}</td>
          <td><span class="badge bg-${color}">${c.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info ver" data-i="${i}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-warning editar" data-i="${i}"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn btn-sm btn-danger eliminar" data-i="${i}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`);
    });
    bindActions();
  }

  function bindActions(){
    document.querySelectorAll(".ver").forEach(b => b.onclick = e => verCliente(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".editar").forEach(b => b.onclick = e => editarCliente(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".eliminar").forEach(b => b.onclick = e => eliminarCliente(parseInt(e.currentTarget.dataset.i,10)));
  }

  function verCliente(i){
    const c = clientes[i];
    alert(`Cliente: ${c.nombre}\nCódigo: ${c.codigo}\nEmail: ${c.email}\nTel: ${c.telefono}\nEstado: ${c.estado}`);
  }

  function editarCliente(i){
    const c = clientes[i];
    removeIfExists("modalEditarCliente");
    const html = `
      <div class="modal fade" id="modalEditarCliente" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Editar Cliente</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formEditarCliente" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="edit_codigo" value="${escapeHtml(c.codigo)}" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="edit_nombre" value="${escapeHtml(c.nombre)}" required></div>
              <div class="mb-2"><label>Email</label><input type="email" class="form-control" id="edit_email" value="${escapeHtml(c.email)}" required></div>
              <div class="mb-2"><label>Teléfono</label><input class="form-control" id="edit_telefono" value="${escapeHtml(c.telefono)}" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="edit_estado"><option ${c.estado==="Activo"?"selected":""}>Activo</option><option ${c.estado==="Inactivo"?"selected":""}>Inactivo</option></select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar Cambios</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalEditarCliente");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formEditarCliente");
      form.addEventListener("submit", function onSubmit(e){
        e.preventDefault();
        c.codigo = document.getElementById("edit_codigo").value.trim();
        c.nombre = document.getElementById("edit_nombre").value.trim();
        c.email = document.getElementById("edit_email").value.trim();
        c.telefono = document.getElementById("edit_telefono").value.trim();
        c.estado = document.getElementById("edit_estado").value;
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  }

  function eliminarCliente(i){
    if (!confirm(`¿Eliminar a ${clientes[i].nombre}?`)) return;
    clientes.splice(i,1);
    guardarYActualizar();
  }

  function guardarYActualizar(){
    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderTabla();
  }

  btnExportar.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no cargó.");
    const hoja = XLSX.utils.json_to_sheet(clientes);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Clientes");
    XLSX.writeFile(libro, "clientes.xlsx");
  });

  // helpers
  function removeIfExists(id){ const el=document.getElementById(id); if(el) el.remove(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cargarXLSXIfNeeded(){ if(typeof XLSX==="undefined"){ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(s);} }
});
