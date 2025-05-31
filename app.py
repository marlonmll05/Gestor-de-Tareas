from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__, 
            static_folder='static',
            template_folder='static')
CORS(app)

usuarios = []

# Ruta para servir el archivo HTML principal
@app.route('/')
def index():
    return send_from_directory(app.template_folder, 'index.html')

# Ruta para servir archivos estáticos
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

# ===== ENDPOINTS DE AUTENTICACIÓN =====

@app.route('/api/registro', methods=['POST'])
def registro():
    data = request.get_json()
    nombre = data.get('nombre')
    correo = data.get('correo')
    contrasena = data.get('contrasena')

    if not nombre or not correo or not contrasena:
        return jsonify({'error': 'Faltan campos requeridos'}), 400

    if any(u['correo'] == correo for u in usuarios):
        return jsonify({'error': 'Correo ya registrado'}), 400

    usuario = {
        'id': len(usuarios) + 1,
        'nombre': nombre,
        'correo': correo,
        'contrasena': contrasena,
        'tareas': []
    }

    usuarios.append(usuario)
    return jsonify({'mensaje': 'Usuario registrado correctamente', 'usuario_id': usuario['id']}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    correo = data.get('correo')
    contrasena = data.get('contrasena')

    usuario = next((u for u in usuarios if u['correo'] == correo and u['contrasena'] == contrasena), None)
    if usuario:
        usuario_sin_contrasena = {k: v for k, v in usuario.items() if k != 'contrasena'}
        return jsonify({'usuario': usuario_sin_contrasena}), 200
    else:
        return jsonify({'error': 'Credenciales inválidas'}), 401

# ===== ENDPOINTS DE GESTIÓN DE TAREAS =====

def obtener_usuario_por_id(usuario_id):
    return next((u for u in usuarios if u['id'] == usuario_id), None)

@app.route('/api/tareas', methods=['GET'])
def obtener_tareas():
    usuario_id = request.args.get('usuario_id', type=int)
    
    if not usuario_id:
        return jsonify({'error': 'ID de usuario requerido'}), 400
    
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    return jsonify({'tareas': usuario['tareas']}), 200

@app.route('/api/tareas', methods=['POST'])
def crear_tarea():
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    titulo = data.get('titulo')
    descripcion = data.get('descripcion', '')
    prioridad = data.get('prioridad', 'media')
    fecha = data.get('fecha', '')
    hora = data.get('hora', '')  

    if not usuario_id or not titulo:
        return jsonify({'error': 'usuario_id y titulo son requeridos'}), 400
    
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    nuevo_id = int(datetime.now().timestamp() * 1000)
    
    nueva_tarea = {
        'id': nuevo_id,
        'titulo': titulo,
        'descripcion': descripcion,
        'prioridad': prioridad,
        'completada': False,
        'fecha_creacion': datetime.now().isoformat(),
        'fecha_completada': None,
        'fecha': fecha, 
        'hora': hora,  
        'text': titulo,  
        'date': fecha, 
        'time': hora,    
        'completed': False  
    }
    
    usuario['tareas'].append(nueva_tarea)
    return jsonify({'mensaje': 'Tarea creada correctamente', 'tarea': nueva_tarea}), 201

@app.route('/api/tareas/<int:tarea_id>', methods=['PUT'])
def actualizar_tarea(tarea_id):
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    
    if not usuario_id:
        return jsonify({'error': 'usuario_id es requerido'}), 400
    
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    tarea = next((t for t in usuario['tareas'] if t['id'] == tarea_id), None)
    if not tarea:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    # Actualizar campos
    if 'titulo' in data:
        tarea['titulo'] = data['titulo']
        tarea['text'] = data['titulo']  
    if 'descripcion' in data:
        tarea['descripcion'] = data['descripcion']
    if 'prioridad' in data:
        tarea['prioridad'] = data['prioridad']
    if 'completada' in data:
        tarea['completada'] = data['completada']
        tarea['completed'] = data['completada']  
        if data['completada'] and not tarea.get('fecha_completada'):
            tarea['fecha_completada'] = datetime.now().isoformat()
        elif not data['completada']:
            tarea['fecha_completada'] = None
    if 'fecha' in data:
        tarea['fecha'] = data['fecha']
        tarea['date'] = data['fecha']  
    if 'hora' in data:
        tarea['hora'] = data['hora']
        tarea['time'] = data['hora']  
    
    return jsonify({'mensaje': 'Tarea actualizada correctamente', 'tarea': tarea}), 200

@app.route('/api/tareas/<int:tarea_id>', methods=['DELETE'])
def eliminar_tarea(tarea_id):
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    
    if not usuario_id:
        return jsonify({'error': 'usuario_id es requerido'}), 400
    
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    tarea_index = next((i for i, t in enumerate(usuario['tareas']) if t['id'] == tarea_id), None)
    if tarea_index is None:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    tarea_eliminada = usuario['tareas'].pop(tarea_index)
    return jsonify({'mensaje': 'Tarea eliminada correctamente', 'tarea': tarea_eliminada}), 200

# ===== ENDPOINTS DE ESTADÍSTICAS =====

@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    usuario_id = request.args.get('usuario_id', type=int)
    
    if not usuario_id:
        return jsonify({'error': 'ID de usuario requerido'}), 400
    
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    tareas = usuario['tareas']
    total_tareas = len(tareas)
    tareas_completadas = len([t for t in tareas if t['completada']])
    tareas_pendientes = total_tareas - tareas_completadas
    
    prioridades = {}
    for tarea in tareas:
        prioridad = tarea['prioridad']
        if prioridad not in prioridades:
            prioridades[prioridad] = {'total': 0, 'completadas': 0}
        prioridades[prioridad]['total'] += 1
        if tarea['completada']:
            prioridades[prioridad]['completadas'] += 1
    
    estadisticas = {
        'total_tareas': total_tareas,
        'tareas_completadas': tareas_completadas,
        'tareas_pendientes': tareas_pendientes,
        'porcentaje_completado': round((tareas_completadas / total_tareas * 100) if total_tareas > 0 else 0, 2),
        'por_prioridad': prioridades
    }
    
    return jsonify({'estadisticas': estadisticas}), 200

if __name__ == '__main__':
    app.run(debug=True)