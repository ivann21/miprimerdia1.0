// Archivo de manejo de formulario de eventos
const { ipcRenderer } = require('electron');

// Variable para controlar si estamos editando
let modoEdicion = false;
let idEventoEdicion = null;
let datosEventoParaCargar = null; // Nueva variable para almacenar datos pendientes
let tiposEventoCargados = false; // Nueva variable para saber si los tipos ya están cargados

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('eventoForm');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const mensajeDiv = document.getElementById('mensaje');

    console.log('DOM cargado, elementos:', {
        formulario: !!formulario,
        btnGuardar: !!btnGuardar,
        btnCancelar: !!btnCancelar,
        mensajeDiv: !!mensajeDiv
    });

    // Cargar tipos de evento desde la base de datos
    cargarTiposEvento();

    // Configurar botón cancelar PRIMERO Y SIMPLE
    btnCancelar.onclick = function() {
        console.log('Botón cancelar clickeado - enviando cerrar-ventana-evento');
        ipcRenderer.send('cerrar-ventana-evento');
    };

    // Cargar los datos del cliente si está editando
    ipcRenderer.on('cargar-datos-evento', (event, datos) => {
        if (datos) {
            console.log('Recibidos datos para edición:', datos);
            datosEventoParaCargar = datos; // Guardar datos para cargar después
            
            modoEdicion = true;
            idEventoEdicion = datos.servicio.id;
            
            // Cliente - cargar inmediatamente
            document.getElementById('nombreCliente').value = datos.cliente.nombre_apellidos || '';
            document.getElementById('nombreCliente').dataset.idCliente = datos.cliente.id;
            document.getElementById('emailCliente').value = datos.cliente.email || '';
            document.getElementById('telefonoCliente').value = datos.cliente.telefono || '';
            document.getElementById('direccionCliente').value = datos.cliente.direccion || '';
            document.getElementById('codigoPostalCliente').value = datos.cliente.codigo_postal || '';
            document.getElementById('ciudadCliente').value = datos.cliente.ciudad || '';
            
            // Otros campos del evento (no el tipo)
            document.getElementById('fechaEvento').value = datos.servicio.fecha_evento ? formatDate(datos.servicio.fecha_evento) : '';
            document.getElementById('estadoEvento').value = datos.servicio.estado || 'pendiente';
            document.getElementById('notasCliente').value = datos.servicio.notas_cliente || '';
            document.getElementById('observacionesInternas').value = datos.servicio.observaciones_internas || '';
            document.getElementById('precioTotal').value = datos.servicio.precio_total || '0.00';
            
            // Cambiar texto del botón
            btnGuardar.textContent = 'Actualizar Evento';
            
            // Intentar cargar el tipo de evento si las opciones ya están disponibles
            if (tiposEventoCargados) {
                cargarTipoEventoSiDisponible();
            }
        }
    });

    // Manejar envío del formulario
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        
        console.log('Enviando formulario de evento...');
        btnGuardar.disabled = true;
        
        // Verificar que se ha proporcionado al menos nombre del cliente
        const nombreCliente = document.getElementById('nombreCliente').value.trim();
        if (!nombreCliente) {
            mostrarMensaje('El nombre del cliente es obligatorio', 'error');
            btnGuardar.disabled = false;
            return;
        }
        
        // Verificar tipo de evento
        const tipoEvento = document.getElementById('tipoEvento').value;
        if (!tipoEvento) {
            mostrarMensaje('Debe seleccionar un tipo de evento', 'error');
            btnGuardar.disabled = false;
            return;
        }
        
        // Solo validar email/teléfono si no estamos editando (nuevo cliente)
        if (!modoEdicion) {
            const email = document.getElementById('emailCliente').value.trim();
            const telefono = document.getElementById('telefonoCliente').value.trim();
            
            if (!email && !telefono) {
                mostrarMensaje('Debe proporcionar al menos un email o teléfono de contacto para nuevos clientes', 'error');
                btnGuardar.disabled = false;
                return;
            }
        }
        
        const datosEvento = {
            cliente: {
                nombre_apellidos: nombreCliente,
                email: document.getElementById('emailCliente').value.trim(),
                telefono: document.getElementById('telefonoCliente').value.trim(),
                direccion: document.getElementById('direccionCliente').value,
                codigo_postal: document.getElementById('codigoPostalCliente').value,
                ciudad: document.getElementById('ciudadCliente').value
            },
            servicio: {
                id_tipo_servicio: tipoEvento,
                fecha_evento: document.getElementById('fechaEvento').value,
                estado: document.getElementById('estadoEvento').value,
                notas_cliente: document.getElementById('notasCliente').value,
                observaciones_internas: document.getElementById('observacionesInternas').value,
                precio_total: document.getElementById('precioTotal').value
            }
        };
        
        console.log('Datos del evento:', datosEvento);
        
        if (modoEdicion) {
            // Añadir IDs para actualización
            datosEvento.cliente.id = document.getElementById('nombreCliente').dataset.idCliente;
            datosEvento.servicio.id = idEventoEdicion;
            
            console.log('Enviando actualización de evento...');
            ipcRenderer.send('actualizar-evento', datosEvento);
        } else {
            console.log('Enviando nuevo evento...');
            ipcRenderer.send('guardar-evento', datosEvento);
        }
    });    // Manejar cancelación
    btnCancelar.addEventListener('click', () => {
        try {
            console.log('Botón cancelar presionado, enviando evento cerrar-ventana-evento');
            
            // Verificar que ipcRenderer está disponible antes de usarlo
            if (ipcRenderer) {
                ipcRenderer.send('cerrar-ventana-evento');
                
                // Como alternativa, podemos intentar cerrar directamente la ventana
                // en caso de que el IPC no funcione correctamente
                setTimeout(() => {
                    console.log('Intentando cerrar ventana con window.close() como fallback');
                    window.close();
                }, 100);
            } else {
                console.warn('ipcRenderer no disponible, usando window.close() directamente');
                window.close();
            }
        } catch (error) {
            console.error('Error al cancelar:', error);
            // Intenta cerrar la ventana directamente como alternativa
            window.close();
        }
    });
    
    // Recibir respuesta después de guardar
    ipcRenderer.on('evento-guardado', (event, resultado) => {
        console.log('Respuesta evento guardado:', resultado);
        btnGuardar.disabled = false;
        
        if (resultado.exito) {
            mostrarMensaje(resultado.mensaje, 'exito');
            if (!modoEdicion) {
                formulario.reset();
            }
            setTimeout(() => {
                ipcRenderer.send('cerrar-ventana-evento');
            }, 2000);
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
    });
    
    // Recibir respuesta después de actualizar
    ipcRenderer.on('evento-actualizado', (event, resultado) => {
        console.log('Respuesta evento actualizado:', resultado);
        btnGuardar.disabled = false;
        
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
        if (!dateString) return '';
        
        try {
            // Si la fecha viene como string en formato YYYY-MM-DD, devolverla tal como está
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateString;
            }
            
            // Si viene como timestamp o string de fecha completa, procesarla
            const date = new Date(dateString);
            
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // Formatear manualmente para evitar problemas de zona horaria
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return '';
        }
    }
      // Función para mostrar mensajes
    function mostrarMensaje(texto, tipo) {
        console.log(`Mostrando mensaje: ${texto} (${tipo})`);
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
        
        console.log('Tipos de evento recibidos:', tiposEvento);
        
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
        
        // Marcar que los tipos ya están cargados
        tiposEventoCargados = true;
        
        // Si tenemos datos pendientes de cargar, cargar el tipo de evento ahora
        if (datosEventoParaCargar) {
            cargarTipoEventoSiDisponible();
        }
    });
    
    function cargarTipoEventoSiDisponible() {
        const select = document.getElementById('tipoEvento');
        
        // Verificar si tenemos datos pendientes y si las opciones están cargadas
        if (datosEventoParaCargar && tiposEventoCargados && select.options.length > 1) {
            console.log('Estableciendo tipo de evento:', datosEventoParaCargar.servicio.id_tipo_servicio);
            
            // Usar un pequeño delay para asegurar que el DOM está listo
            setTimeout(() => {
                select.value = String(datosEventoParaCargar.servicio.id_tipo_servicio) || '';
                
                // Verificar si se estableció correctamente
                if (select.value !== String(datosEventoParaCargar.servicio.id_tipo_servicio)) {
                    console.warn('No se pudo establecer el tipo de evento. Valor esperado:', datosEventoParaCargar.servicio.id_tipo_servicio, 'Opciones disponibles:', Array.from(select.options).map(o => ({value: o.value, text: o.textContent})));
                    
                    // Intentar encontrar la opción correcta manualmente
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value === String(datosEventoParaCargar.servicio.id_tipo_servicio)) {
                            select.selectedIndex = i;
                            console.log('Tipo de evento establecido manualmente');
                            break;
                        }
                    }
                } else {
                    console.log('Tipo de evento establecido correctamente');
                }
                
                // Limpiar datos pendientes
                datosEventoParaCargar = null;
            }, 100);
        }
    }
});
