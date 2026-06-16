document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[placeholder^="Buscar máquinas"]');
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

  let maquinas = JSON.parse(localStorage.getItem("maquinas")) || [
    { codigo: "MAQ-001", nombre: "Máquina A", estado: "Operativa" },
    { codigo: "MAQ-002", nombre: "Máquina B", estado: "En Mantenimiento" }
  ];

  cargarXLSXIfNeeded();
  renderTabla();

  btnNuevo.addEventListener("click", () => {
    removeIfExists("modalNuevaMaquina");
    const html = `
      <div class="modal fade" id="modalNuevaMaquina" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5>Nueva Máquina</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formNuevaMaquina" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="nuevo_codigo" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="nuevo_nombre" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="nuevo_estado"><option>Operativa</option><option>En Mantenimiento</option><option>Fuera de Servicio</option></select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalNuevaMaquina");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formNuevaMaquina");
      form.addEventListener("submit", function onSubmit(e){
        e.preventDefault();
        const nueva = { codigo: document.getElementById("nuevo_codigo").value.trim(), nombre: document.getElementById("nuevo_nombre").value.trim(), estado: document.getElementById("nuevo_estado").value };
        if(!nueva.codigo || !nueva.nombre) return alert("Completa todos los campos.");
        maquinas.push(nueva);
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  });

  function renderTabla(){
    tabla.innerHTML = "";
    maquinas.forEach((m,i) => {
      const color = m.estado === "Operativa" ? "success" : m.estado === "En Mantenimiento" ? "warning" : "danger";
      tabla.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${i+1}</td><td>${m.codigo}</td><td>${m.nombre}</td><td><span class="badge bg-${color}">${m.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-info ver" data-i="${i}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-warning editar" data-i="${i}"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn btn-sm btn-danger eliminar" data-i="${i}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`);
    });
    bind();
  }

  function bind(){
    document.querySelectorAll(".ver").forEach(b=>b.onclick=e=>verMaquina(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".editar").forEach(b=>b.onclick=e=>editarMaquina(parseInt(e.currentTarget.dataset.i,10)));
    document.querySelectorAll(".eliminar").forEach(b=>b.onclick=e=>eliminarMaquina(parseInt(e.currentTarget.dataset.i,10)));
  }

  function verMaquina(i){ const m=maquinas[i]; alert(`Máquina: ${m.nombre}\nCódigo: ${m.codigo}\nEstado: ${m.estado}`); }

  function editarMaquina(i){
    const m = maquinas[i];
    removeIfExists("modalEditarMaquina");
    const html = `
      <div class="modal fade" id="modalEditarMaquina" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5>Editar Máquina</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="formEditarMaquina" novalidate>
              <div class="mb-2"><label>Código</label><input class="form-control" id="edit_codigo" value="${escapeHtml(m.codigo)}" required></div>
              <div class="mb-2"><label>Nombre</label><input class="form-control" id="edit_nombre" value="${escapeHtml(m.nombre)}" required></div>
              <div class="mb-3"><label>Estado</label><select class="form-select" id="edit_estado"><option ${m.estado==="Operativa"?"selected":""}>Operativa</option><option ${m.estado==="En Mantenimiento"?"selected":""}>En Mantenimiento</option><option ${m.estado==="Fuera de Servicio"?"selected":""}>Fuera de Servicio</option></select></div>
              <button class="btn btn-primary w-100" type="submit">Guardar Cambios</button>
            </form>
          </div>
        </div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("modalEditarMaquina");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("shown.bs.modal", () => {
      const form = document.getElementById("formEditarMaquina");
      form.addEventListener("submit", function onSubmit(e){
        e.preventDefault();
        m.codigo = document.getElementById("edit_codigo").value.trim();
        m.nombre = document.getElementById("edit_nombre").value.trim();
        m.estado = document.getElementById("edit_estado").value;
        guardarYActualizar();
        form.removeEventListener("submit", onSubmit);
        modal.hide();
      }, { once: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove(), { once: true });
  }

  function eliminarMaquina(i){
    if (!confirm(`¿Eliminar ${maquinas[i].nombre}?`)) return;
    maquinas.splice(i,1);
    guardarYActualizar();
  }

  function guardarYActualizar(){ localStorage.setItem("maquinas", JSON.stringify(maquinas)); renderTabla(); }

  btnExportar.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("La librería XLSX aún no cargó.");
    const hoja = XLSX.utils.json_to_sheet(maquinas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Máquinas");
    XLSX.writeFile(libro, "maquinas.xlsx");
  });

  // helpers
  function removeIfExists(id){ const el=document.getElementById(id); if(el) el.remove(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cargarXLSXIfNeeded(){ if(typeof XLSX==="undefined"){ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(s);} }
});
