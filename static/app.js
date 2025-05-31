// URL base del backend
const API_BASE_URL = 'http://127.0.0.1:5000';

// Comprobar si hay un usuario logueado
function checkAuth() {
    const currentUser = localStorage.getItem('usuarioActual');
    if (!currentUser) {
        window.location.href = '/';
        return null;
    }
    return JSON.parse(currentUser);
}

// Obtener usuario actual o redirigir
const currentUser = checkAuth();
if (!currentUser) {
    throw new Error('No hay usuario autenticado');
}

// Mostrar nombre de usuario
document.getElementById('userName').textContent = currentUser.nombre;

// Manejar cierre de sesión
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('usuarioActual');
    window.location.href = '/';
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

// Variable para almacenar tareas
let tareas = [];

// ===== FUNCIONES DE API =====

async function cargarTareas() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tareas?usuario_id=${currentUser.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar tareas');
        }

        const data = await response.json();
        tareas = data.tareas || [];
        renderizarTareas();
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        mostrarError('Error al cargar las tareas');
    }
}

async function crearTarea(titulo, fecha, hora) {
    try {
        // Combinar fecha y hora en una descripción
        const descripcion = `Programada para ${formatearFecha(fecha, hora)}`;
        
        const response = await fetch(`${API_BASE_URL}/api/tareas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                titulo: titulo,
                descripcion: descripcion,
                prioridad: 'media',
                fecha: fecha,
                hora: hora
            })
        });

        if (!response.ok) {
            throw new Error('Error al crear tarea');
        }

        const data = await response.json();
        // Agregar campos adicionales para compatibilidad con el frontend
        data.tarea.text = data.tarea.titulo;
        data.tarea.date = fecha;
        data.tarea.time = hora;
        data.tarea.completed = data.tarea.completada;
        
        tareas.push(data.tarea);
        renderizarTareas();
        return data.tarea;
    } catch (error) {
        console.error('Error al crear tarea:', error);
        mostrarError('Error al crear la tarea');
    }
}

async function actualizarTarea(tareaId, cambios) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tareas/${tareaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                ...cambios
            })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar tarea');
        }

        const data = await response.json();
        // Actualizar la tarea local
        const index = tareas.findIndex(t => t.id === tareaId);
        if (index !== -1) {
            // Mantener compatibilidad con el frontend
            tareas[index] = {
                ...data.tarea,
                text: data.tarea.titulo,
                completed: data.tarea.completada
            };
        }
        renderizarTareas();
        return data.tarea;
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        mostrarError('Error al actualizar la tarea');
    }
}

async function eliminarTarea(tareaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tareas/${tareaId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: currentUser.id
            })
        });

        if (!response.ok) {
            throw new Error('Error al eliminar tarea');
        }

        // Eliminar de la lista local
        tareas = tareas.filter(t => t.id !== tareaId);
        renderizarTareas();
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        mostrarError('Error al eliminar la tarea');
    }
}

// ===== FUNCIONES DE UTILIDAD =====

function mostrarError(mensaje) {
    // Crear un elemento de error temporal
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 3000);
}

function formatearFecha(fechaStr, horaStr) {
    if (!fechaStr) return '';

    const [year, month, day] = fechaStr.split('-').map(Number);
    let fecha = new Date();
    fecha.setFullYear(year, month - 1, day);

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
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
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
    let tareasFiltradas = tareas.filter(t => 
        pestañaActual === 'pendientes' ? !t.completed : t.completed
    );

    // Ordenar las tareas por fecha y hora
    tareasFiltradas.sort((a, b) => {
        const fechaA = new Date(`${a.date}T${a.time || '00:00'}`);
        const fechaB = new Date(`${b.date}T${b.time || '00:00'}`);
        return fechaA - fechaB;
    });

    tareasFiltradas.forEach((tarea) => {
        const li = document.createElement('li');
        li.className = 'item-tarea' + (tarea.completed ? ' completada' : '');
        li.innerHTML = `
            <input type="checkbox" ${tarea.completed ? 'checked' : ''} data-id="${tarea.id}">
            <div class="info-tarea">
                <span>${tarea.text || tarea.titulo}</span>
                <small class="fecha-tarea">${formatearFecha(tarea.date, tarea.time)}</small>
            </div>
            <button class="boton-eliminar" data-id="${tarea.id}" title="Eliminar tarea">Eliminar</button>
        `;

        // Evento para cambiar estado de completado
        li.querySelector('input[type="checkbox"]').addEventListener('change', async function() {
            const completed = this.checked;
            await actualizarTarea(tarea.id, { 
                completada: completed,
                titulo: tarea.text || tarea.titulo 
            });
        });

        // Evento para eliminar
        li.querySelector('.boton-eliminar').addEventListener('click', async function() {
            if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                await eliminarTarea(tarea.id);
            }
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

// ===== EVENTOS =====

// Evento para añadir tarea
formularioTarea.addEventListener('submit', async function(e) {
    e.preventDefault();
    const text = entradaTarea.value.trim();
    const date = entradaFecha.value;
    const time = entradaHora.value;
    
    if (!text || !date || !time) {
        mostrarError('Por favor completa todos los campos');
        return;
    }

    await crearTarea(text, date, time);
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

// ===== INICIALIZACIÓN =====

// Establecer la fecha y hora actual en los inputs
entradaFecha.value = formatearHoy();
entradaHora.value = formatearHoraAhora();

// Cargar tareas al iniciar
cargarTareas();