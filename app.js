// Comprobar si hay un usuario logueado
function checkAuth() {
    const currentUser = localStorage.getItem('usuarioActual'); // Cambiar a 'usuarioActual'
    if (!currentUser) {
        // Si no hay usuario logueado, redirigir al inicio de sesión
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Obtener usuario actual o redirigir
const currentUser = checkAuth();
if (!currentUser) {
    // Si no hay usuario, el redirect ya se habrá ejecutado
    throw new Error('No hay usuario autenticado');
}

// Mostrar nombre de usuario
document.getElementById('userName').textContent = currentUser.nombre; // Cambiar a currentUser.nombre (según guardaste en index.js)

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('usuarioActual'); // Cambiar a 'usuarioActual'
    window.location.href = 'index.html';
});

// Estado: pestaña activa
let pestañaActual = 'pendientes';

// Elementos
const formularioTarea = document.getElementById('formularioTarea');
const entradaTarea = document.getElementById('entradaTarea');
const entradaFecha = document.getElementById('entradaFecha');
const entradaHora = document.getElementById('entradaHora');
const listaTareas = document.getElementById('listaTareas');
const totalTareas = document.getElementById('totalTareas');
const tareasCompletadas = document.getElementById('tareasCompletadas');
const tareasPendientes = document.getElementById('tareasPendientes');
const tabPendientes = document.getElementById('tab-pendientes');
const tabCompletadas = document.getElementById('tab-completadas');

// Cargar tareas del usuario actual
let tareas = cargarTareas();

function cargarTareas() {
    const currentUser = checkAuth(); // Asegúrate de que checkAuth() ahora devuelve el usuario correcto
    if (!currentUser) {
        return [];
    }
    // Obtener todos los usuarios
    const users = JSON.parse(localStorage.getItem('usuariosAppTareas') || '[]'); // Cambiar a 'usuariosAppTareas'
    // Encontrar el usuario actual
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) {
        return []; // Usuario no encontrado, devolver array vacío
    }

    // Devolver las tareas del usuario (o inicializar si no tiene)
    return users[userIndex].tareas || []; // Cambiar a users[userIndex].tareas
}

function guardarTareas() {
    const currentUser = checkAuth(); // Asegúrate de que checkAuth() devuelve el usuario correcto
    if (!currentUser) {
        return;
    }
    // Obtener todos los usuarios
    const users = JSON.parse(localStorage.getItem('usuariosAppTareas') || '[]'); // Cambiar a 'usuariosAppTareas'
    // Encontrar el usuario actual
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        // Actualizar las tareas del usuario
        users[userIndex].tareas = tareas; // Cambiar a users[userIndex].tareas
        // Guardar de vuelta en localStorage
        localStorage.setItem('usuariosAppTareas', JSON.stringify(users)); // Cambiar a 'usuariosAppTareas'
    }
}

function formatearFecha(fechaStr, horaStr) {
    if (!fechaStr) return '';

    // Crear un objeto Date correctamente desde la cadena YYYY-MM-DD
    const [year, month, day] = fechaStr.split('-').map(Number);
    let fecha = new Date();
    fecha.setFullYear(year, month - 1, day); // Los meses en JavaScript van de 0-11

    // Agregar la hora si está disponible
    if (horaStr) {
        const [hours, minutes] = horaStr.split(':').map(Number);
        fecha.setHours(hours, minutes);
    }

    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + (horaStr ? ` ${horaStr}` : '');
}

function formatearHoy() {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0'); // Los meses van de 0-11
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearHoraAhora() {
    const ahora = new Date();
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function renderizarTareas() {
    listaTareas.innerHTML = '';
    // Filtrar: pendientes o completadas según pestaña activa
    let tareasFiltradas = tareas.filter(t => pestañaActual === 'pendientes' ? !t.completed : t.completed);

    // Ordenar las tareas por fecha y hora
    tareasFiltradas.sort((a, b) => {
        const fechaA = new Date(`${a.date}T${a.time || '00:00'}`);
        const fechaB = new Date(`${b.date}T${b.time || '00:00'}`);
        return fechaA - fechaB;
    });

    tareasFiltradas.forEach((tarea, i) => {
        // Conseguir el "índice real" considerando el filtro
        const indiceReal = tareas.indexOf(tarea);

        const li = document.createElement('li');
        li.className = 'item-tarea' + (tarea.completed ? ' completada' : '');
        li.innerHTML = `
            <input type="checkbox" ${tarea.completed ? 'checked' : ''} data-index="${indiceReal}">
            <div class="info-tarea">
                <span>${tarea.text}</span>
                <small class="fecha-tarea">${formatearFecha(tarea.date, tarea.time)}</small>
            </div>
            <button class="boton-eliminar" data-index="${indiceReal}" title="Eliminar tarea">Eliminar</button>
        `;

        // Evento para cambiar estado de completado
        li.querySelector('input[type="checkbox"]').addEventListener('change', function() {
            tareas[indiceReal].completed = this.checked;
            guardarTareas(); // Guardar en localStorage
            renderizarTareas();
        });
        // Evento para eliminar
        li.querySelector('.boton-eliminar').addEventListener('click', function() {
            tareas.splice(indiceReal, 1);
            guardarTareas(); // Guardar en localStorage
            renderizarTareas();
        });
        listaTareas.appendChild(li);
    });

    // Actualizar contadores
    actualizarContadores();

    // Mostrar u ocultar el formulario según la pestaña
    formularioTarea.style.display = pestañaActual === 'pendientes' ? 'flex' : 'none';
}

function actualizarContadores() {
    totalTareas.innerText = tareas.length;
    const cantidadCompletadas = tareas.filter(t => t.completed).length;
    tareasCompletadas.innerText = cantidadCompletadas;
    tareasPendientes.innerText = tareas.length - cantidadCompletadas;
}

// Evento para añadir tarea
formularioTarea.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = entradaTarea.value.trim();
    const date = entradaFecha.value;
    const time = entradaHora.value;
    if (!text || !date || !time) return;

    tareas.push({
        id: Date.now().toString(), // Agregar ID único a cada tarea
        text,
        date,
        time,
        completed: false
    });

    guardarTareas(); // Guardar en localStorage
    renderizarTareas();
    entradaTarea.value = '';
    // No reseteamos la fecha y hora para facilitar la entrada de múltiples tareas
});

// Eventos para las pestañas
tabPendientes.addEventListener('click', () => {
    pestañaActual = 'pendientes';
    tabPendientes.classList.add('activa');
    tabCompletadas.classList.remove('activa');
    renderizarTareas();
});

tabCompletadas.addEventListener('click', () => {
    pestañaActual = 'completadas';
    tabCompletadas.classList.add('activa');
    tabPendientes.classList.remove('activa');
    renderizarTareas();
});

// Establecer la fecha y hora actual en los inputs
entradaFecha.value = formatearHoy();
entradaHora.value = formatearHoraAhora();

// Render inicial
renderizarTareas();