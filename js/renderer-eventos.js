// Archivo de manejo de formulario de eventos
const { ipcRenderer } = require('electron');

// Variable para controlar si estamos editando
let modoEdicion = false;
let idEventoEdicion = null;

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('eventoForm');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const mensajeDiv = document.getElementById('mensaje');

    // Cargar tipos de evento desde la base de datos
    cargarTiposEvento();

    // Cargar los datos del cliente si está editando
    ipcRenderer.on('cargar-datos-evento', (event, datos) => {
        if (datos) {
            modoEdicion = true;
            idEventoEdicion = datos.servicio.id;
            
            // Cliente
            document.getElementById('nombreCliente').value = datos.cliente.nombre_apellidos || '';
            document.getElementById('nombreCliente').dataset.idCliente = datos.cliente.id;
            document.getElementById('emailCliente').value = datos.cliente.email || '';
            document.getElementById('telefonoCliente').value = datos.cliente.telefono || '';
            document.getElementById('direccionCliente').value = datos.cliente.direccion || '';
            document.getElementById('codigoPostalCliente').value = datos.cliente.codigo_postal || '';
            document.getElementById('ciudadCliente').value = datos.cliente.ciudad || '';
            document.getElementById('fechaNacimientoCliente').value = datos.cliente.fecha_nacimiento ? formatDate(datos.cliente.fecha_nacimiento) : '';
            
            // Evento
            document.getElementById('tipoEvento').value = datos.servicio.id_tipo_servicio || '';
            document.getElementById('fechaEvento').value = datos.servicio.fecha_evento ? formatDate(datos.servicio.fecha_evento) : '';
            document.getElementById('estadoEvento').value = datos.servicio.estado || 'pendiente';
            document.getElementById('notasCliente').value = datos.servicio.notas_cliente || '';
            document.getElementById('observacionesInternas').value = datos.servicio.observaciones_internas || '';
            document.getElementById('precioTotal').value = datos.servicio.precio_total || '0.00';
            
            // Cambiar texto del botón
            btnGuardar.textContent = 'Actualizar Evento';
        }
    });

    // Manejar envío del formulario
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Verificar que al menos se ha proporcionado email o teléfono
        const email = document.getElementById('emailCliente').value.trim();
        const telefono = document.getElementById('telefonoCliente').value.trim();
        
        if (!email && !telefono) {
            mostrarMensaje('Debe proporcionar al menos un email o teléfono de contacto', 'error');
            return;
        }
        
        const datosEvento = {
            cliente: {
                nombre_apellidos: document.getElementById('nombreCliente').value,
                email: email,
                telefono: telefono,
                direccion: document.getElementById('direccionCliente').value,
                codigo_postal: document.getElementById('codigoPostalCliente').value,
                ciudad: document.getElementById('ciudadCliente').value,
                fecha_nacimiento: document.getElementById('fechaNacimientoCliente').value
            },
            servicio: {
                id_tipo_servicio: document.getElementById('tipoEvento').value,
                fecha_evento: document.getElementById('fechaEvento').value,
                estado: document.getElementById('estadoEvento').value,
                notas_cliente: document.getElementById('notasCliente').value,
                observaciones_internas: document.getElementById('observacionesInternas').value,
                precio_total: document.getElementById('precioTotal').value
            }
        };
        
        if (modoEdicion) {
            // Añadir IDs para actualización
            datosEvento.cliente.id = document.getElementById('nombreCliente').dataset.idCliente;
            datosEvento.servicio.id = idEventoEdicion;
            
            ipcRenderer.send('actualizar-evento', datosEvento);
        } else {
            ipcRenderer.send('guardar-evento', datosEvento);
        }
    });
    
    // Manejar cancelación
    btnCancelar.addEventListener('click', () => {
        ipcRenderer.send('cerrar-ventana-evento');
    });
    
    // Recibir respuesta después de guardar
    ipcRenderer.on('evento-guardado', (event, resultado) => {
        if (resultado.exito) {
            mostrarMensaje(resultado.mensaje, 'exito');
            setTimeout(() => {
                ipcRenderer.send('cerrar-ventana-evento');
            }, 2000);
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
    });
    
    // Recibir respuesta después de actualizar
    ipcRenderer.on('evento-actualizado', (event, resultado) => {
        if (resultado.exito) {
            mostrarMensaje(resultado.mensaje, 'exito');
            setTimeout(() => {
                ipcRenderer.send('cerrar-ventana-evento');
            }, 2000);
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
    });

    // Función auxiliar para formatear fechas
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }
    
    // Función para mostrar mensajes
    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo;
        mensajeDiv.style.display = 'block';
        
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 5000);
    }
    
    // Función para cargar los tipos de evento desde la base de datos
    function cargarTiposEvento() {
        try {
            ipcRenderer.send('obtener-tipos-evento');
        } catch (error) {
            console.error('Error al cargar tipos de evento:', error);
        }
    }
    
    ipcRenderer.on('tipos-evento-obtenidos', (event, tiposEvento) => {
        const select = document.getElementById('tipoEvento');
        
        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar opciones desde la base de datos
        tiposEvento.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
    });
});
