// Elementos DOM
const pestanaInicioSesion = document.getElementById('pestana-iniciosesion');
const pestanaRegistro = document.getElementById('pestana-registro');
const formularioInicioSesion = document.getElementById('formulario-iniciosesion');
const formularioRegistro = document.getElementById('formulario-registro');
const mensajeInicioSesion = document.getElementById('mensaje-iniciosesion');
const mensajeRegistro = document.getElementById('mensaje-registro');

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

// Limpiar mensajes
function limpiarMensajes() {
    mensajeInicioSesion.textContent = '';
    mensajeInicioSesion.className = 'mensaje-autenticacion';
    mensajeRegistro.textContent = '';
    mensajeRegistro.className = 'mensaje-autenticacion';
}

// Obtener usuarios de localStorage o inicializar array
function obtenerUsuarios() {
    const usuarios = localStorage.getItem('usuariosAppTareas');
    return usuarios ? JSON.parse(usuarios) : [];
}

// Guardar usuarios en localStorage
function guardarUsuarios(usuarios) {
    localStorage.setItem('usuariosAppTareas', JSON.stringify(usuarios));
}

// Guardar usuario actual
function establecerUsuarioActual(usuario) {
    const datosUsuario = { ...usuario };
    delete datosUsuario.contrasena; // No almacenar la contraseña en la sesión
    localStorage.setItem('usuarioActual', JSON.stringify(datosUsuario));
}

// Registro de usuario
formularioRegistro.addEventListener('submit', function(e) {
    e.preventDefault();
    limpiarMensajes();
    
    const nombre = document.getElementById('registro-nombre').value.trim();
    const correo = document.getElementById('registro-correo').value.trim();
    const contrasena = document.getElementById('registro-contrasena').value;
    const confirmarContrasena = document.getElementById('registro-confirmar-contrasena').value;
    
    // Validaciones básicas
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
    
    // Comprobar si el email ya está registrado
    const usuarios = obtenerUsuarios();
    if (usuarios.some(usuario => usuario.correo === correo)) {
        mensajeRegistro.textContent = 'Este correo ya está registrado';
        mensajeRegistro.className = 'mensaje-autenticacion error';
        return;
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = {
        id: Date.now().toString(),
        nombre,
        correo,
        contrasena, // En una aplicación real, habría que cifrar la contraseña
        tareas: [] // Inicializar tareas vacías para este usuario
    };
    
    // Guardar usuario
    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);
    
    // Mensaje de éxito y resetear formulario
    mensajeRegistro.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión';
    mensajeRegistro.className = 'mensaje-autenticacion exito';
    formularioRegistro.reset();
    
    // Cambiar a la pestaña de inicio de sesión después de un breve retraso
    setTimeout(() => {
        pestanaInicioSesion.click();
    }, 1500);
});

// Inicio de sesión
formularioInicioSesion.addEventListener('submit', function(e) {
    e.preventDefault();
    limpiarMensajes();
    
    const correo = document.getElementById('iniciosesion-correo').value.trim();
    const contrasena = document.getElementById('iniciosesion-contrasena').value;
    
    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
    
    if (!usuario) {
        mensajeInicioSesion.textContent = 'Correo o contraseña incorrectos';
        mensajeInicioSesion.className = 'mensaje-autenticacion error';
        return;
    }
    
    // Iniciar sesión exitosa
    establecerUsuarioActual(usuario);
    mensajeInicioSesion.textContent = 'Iniciando sesión...';
    mensajeInicioSesion.className = 'mensaje-autenticacion exito';
    
    // Redirigir a la aplicación principal
    setTimeout(() => {
        window.location.href = 'app.html';
    }, 1000);
});

// Verificar si ya hay un usuario en sesión al cargar la página
window.addEventListener('load', function() {
    const usuarioActual = localStorage.getItem('usuarioActual');
    if (usuarioActual) {
        // Si hay un usuario en sesión, redirigir directamente a la app
        window.location.href = 'app.html';
    }
});