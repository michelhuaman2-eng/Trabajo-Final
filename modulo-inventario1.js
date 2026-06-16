// ===============================
//  GESTIÓN DE INVENTARIO - CRUD
// ===============================

let productos = JSON.parse(localStorage.getItem('productos')) || [];

const tabla = document.querySelector('table tbody');
const btnNuevo = document.querySelector('.btn-dark');
const form = document.getElementById('productoForm');
const modal = new bootstrap.Modal(document.getElementById('productoModal'));
const inputBuscar = document.querySelector('input[placeholder="Buscar productos por nombre, código..."]');
const editIndexInput = document.getElementById('editIndex');

// Renderizar tabla
function renderTabla(data = productos) {
  tabla.innerHTML = '';
  data.forEach((prod, index) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${prod.codigo}</td>
      <td>${prod.nombre}</td>
      <td>${prod.categoria}</td>
      <td>${prod.stock}</td>
      <td><span class="badge ${getBadgeClass(prod.estado)}">${prod.estado}</span></td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editarProducto(${index})" title="Editar"><i class="fas fa-pencil-alt"></i></button>
        <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${index})" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tabla.appendChild(fila);
  });
}

function getBadgeClass(estado) {
  if (estado === 'Disponible') return 'bg-success';
  if (estado === 'Bajo Stock') return 'bg-warning';
  if (estado === 'En tránsito') return 'bg-info';
  return 'bg-secondary';
}

// Guardar producto
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nuevoProducto = {
    codigo: document.getElementById('codigo').value,
    nombre: document.getElementById('nombre').value,
    categoria: document.getElementById('categoria').value,
    stock: parseInt(document.getElementById('stock').value),
    estado: document.getElementById('estado').value
  };

  const index = editIndexInput.value;
  if (index !== '') {
    productos[index] = nuevoProducto;
  } else {
    productos.push(nuevoProducto);
  }

  localStorage.setItem('productos', JSON.stringify(productos));
  renderTabla();
  form.reset();
  editIndexInput.value = '';
  modal.hide();
});

// Botón nuevo producto
btnNuevo.addEventListener('click', () => {
  form.reset();
  editIndexInput.value = '';
  document.getElementById('productoModalLabel').textContent = 'Nuevo Producto';
  modal.show();
});

// Editar producto
window.editarProducto = (index) => {
  const prod = productos[index];
  document.getElementById('codigo').value = prod.codigo;
  document.getElementById('nombre').value = prod.nombre;
  document.getElementById('categoria').value = prod.categoria;
  document.getElementById('stock').value = prod.stock;
  document.getElementById('estado').value = prod.estado;
  editIndexInput.value = index;
  document.getElementById('productoModalLabel').textContent = 'Editar Producto';
  modal.show();
};

// Eliminar producto
window.eliminarProducto = (index) => {
  if (confirm('¿Estás seguro de eliminar este producto?')) {
    productos.splice(index, 1);
    localStorage.setItem('productos', JSON.stringify(productos));
    renderTabla();
  }
};

// Buscador dinámico
inputBuscar.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtrados = productos.filter(p => 
    p.codigo.toLowerCase().includes(term) ||
    p.nombre.toLowerCase().includes(term)
  );
  renderTabla(filtrados);
});

// Inicializar tabla al cargar
renderTabla();
