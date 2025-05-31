// Elementos DOM
const pestanaInicioSesion = document.getElementById('pestana-iniciosesion');
const pestanaRegistro = document.getElementById('pestana-registro');
const formularioInicioSesion = document.getElementById('formulario-iniciosesion');
const formularioRegistro = document.getElementById('formulario-registro');
const mensajeInicioSesion = document.getElementById('mensaje-iniciosesion');
const mensajeRegistro = document.getElementById('mensaje-registro');

// URL base del backend - cambia según tu configuración
const API_BASE_URL = 'http://127.0.0.1:5000';

// Función para limpiar mensajes
function limpiarMensajes() {
    if (mensajeInicioSesion) {
        mensajeInicioSesion.textContent = '';
        mensajeInicioSesion.className = '';
    }
    if (mensajeRegistro) {
        mensajeRegistro.textContent = '';
        mensajeRegistro.className = '';
    }
}

// Cambio entre pestañas
pestanaInicioSesion.addEventListener('click', () => {
    pestanaInicioSesion.classList.add('activa');
    pestanaRegistro.classList.remove('activa');
    formularioInicioSesion.style.display = 'block';
    formularioRegistro.style.display = 'none';
    limpiarMensajes();
});

pestanaRegistro.addEventListener('click', () => {
    pestanaRegistro.classList.add('activa');
    pestanaInicioSesion.classList.remove('activa');
    formularioRegistro.style.display = 'block';
    formularioInicioSesion.style.display = 'none';
    limpiarMensajes();
});

// Registro de usuario
formularioRegistro.addEventListener('submit', async function(e) {
    e.preventDefault();
    limpiarMensajes();

    const nombre = document.getElementById('registro-nombre').value.trim();
    const correo = document.getElementById('registro-correo').value.trim();
    const contrasena = document.getElementById('registro-contrasena').value;
    const confirmarContrasena = document.getElementById('registro-confirmar-contrasena').value;

    // Validaciones del cliente
    if (!nombre) {
        mensajeRegistro.textContent = 'El nombre es requerido';
        mensajeRegistro.className = 'mensaje-autenticacion error';
        return;
    }

    if (!correo) {
        mensajeRegistro.textContent = 'El correo es requerido';
        mensajeRegistro.className = 'mensaje-autenticacion error';
        return;
    }

    if (contrasena !== confirmarContrasena) {
        mensajeRegistro.textContent = 'Las contraseñas no coinciden';
        mensajeRegistro.className = 'mensaje-autenticacion error';
        return;
    }

    if (contrasena.length < 6) {
        mensajeRegistro.textContent = 'La contraseña debe tener al menos 6 caracteres';
        mensajeRegistro.className = 'mensaje-autenticacion error';
        return;
    }

    try {
        // Mostrar mensaje de carga
        mensajeRegistro.textContent = 'Registrando usuario...';
        mensajeRegistro.className = 'mensaje-autenticacion';

        const response = await fetch(`${API_BASE_URL}/api/registro`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ nombre, correo, contrasena })
        });

        const data = await response.json();

        if (!response.ok) {
            mensajeRegistro.textContent = data.error || 'Error en el registro';
            mensajeRegistro.className = 'mensaje-autenticacion error';
            return;
        }

        mensajeRegistro.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión';
        mensajeRegistro.className = 'mensaje-autenticacion exito';
        formularioRegistro.reset();
        
        // Cambiar a la pestaña de inicio de sesión después de 2 segundos
        setTimeout(() => { 
            pestanaInicioSesion.click(); 
        }, 2000);

    } catch (error) {
        console.error('Error en registro:', error);
        mensajeRegistro.textContent = 'Error de conexión. Verifica que el servidor esté funcionando.';
        mensajeRegistro.className = 'mensaje-autenticacion error';
    }
});

// Inicio de sesión
formularioInicioSesion.addEventListener('submit', async function(e) {
    e.preventDefault();
    limpiarMensajes();

    const correo = document.getElementById('iniciosesion-correo').value.trim();
    const contrasena = document.getElementById('iniciosesion-contrasena').value;

    // Validaciones del cliente
    if (!correo) {
        mensajeInicioSesion.textContent = 'El correo es requerido';
        mensajeInicioSesion.className = 'mensaje-autenticacion error';
        return;
    }

    if (!contrasena) {
        mensajeInicioSesion.textContent = 'La contraseña es requerida';
        mensajeInicioSesion.className = 'mensaje-autenticacion error';
        return;
    }

    try {
        // Mostrar mensaje de carga
        mensajeInicioSesion.textContent = 'Verificando credenciales...';
        mensajeInicioSesion.className = 'mensaje-autenticacion';

        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await response.json();

        if (!response.ok) {
            mensajeInicioSesion.textContent = data.error || 'Error en el inicio de sesión';
            mensajeInicioSesion.className = 'mensaje-autenticacion error';
            return;
        }

        // Guardar sesión en localStorage
        localStorage.setItem("usuarioActual", JSON.stringify(data.usuario));

        mensajeInicioSesion.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
        mensajeInicioSesion.className = 'mensaje-autenticacion exito';

        // Redirigir a la aplicación principal
        setTimeout(() => {
            window.location.href = '/static/app.html'; // Ajusta la ruta según tu estructura
        }, 1500);

    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        mensajeInicioSesion.textContent = 'Error de conexión. Verifica que el servidor esté funcionando.';
        mensajeInicioSesion.className = 'mensaje-autenticacion error';
    }
});

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const usuarioActual = localStorage.getItem("usuarioActual");
    if (usuarioActual) {
        try {
            const usuario = JSON.parse(usuarioActual);
            console.log('Usuario ya logueado:', usuario.nombre);
            // Opcional: redirigir automáticamente a la app
            // window.location.href = '/static/app.html';
        } catch (error) {
            // Si hay error al parsear, limpiar localStorage
            localStorage.removeItem("usuarioActual");
        }
    }
});