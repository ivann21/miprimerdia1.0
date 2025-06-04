// Variable para controlar si estamos editando
let modoEdicion = false;
let idCajaEdicion = null;
let datosCajaParaCargar = null; // Nueva variable para almacenar datos pendientes

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cajaForm');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const mensajeDiv = document.getElementById('mensaje');

    // Cargar tipos de caja desde la base de datos
    cargarTiposCaja();

    // Recibir datos para edición
    ipcRenderer.on('cargar-datos-caja', (event, datos) => {
        if (datos) {
            console.log('Recibidos datos para edición de caja:', datos);
            datosCajaParaCargar = datos; // Guardar datos para cargar después
            
            modoEdicion = true;
            idCajaEdicion = datos.id;
            
            // Cliente - cargar inmediatamente
            document.getElementById('nombreCliente').value = datos.cliente.nombre_apellidos || '';
            document.getElementById('emailCliente').value = datos.cliente.email || '';
            document.getElementById('telefonoCliente').value = datos.cliente.telefono || '';
            document.getElementById('direccionCliente').value = datos.cliente.direccion || '';
            document.getElementById('codigoPostalCliente').value = datos.cliente.codigo_postal || '';
            document.getElementById('ciudadCliente').value = datos.cliente.ciudad || '';
            
            // Almacenar IDs necesarios para la edición
            document.getElementById('nombreCliente').dataset.idCliente = datos.cliente.id;
            document.getElementById('nombreBebe').dataset.idBebe = datos.bebe.id;
            
            // Bebé - cargar inmediatamente
            document.getElementById('nombreBebe').value = datos.bebe.nombre || '';
            document.getElementById('apellidosBebe').value = datos.bebe.apellidos || '';
            document.getElementById('fechaNacimientoBebe').value = datos.bebe.fecha_nacimiento ? formatDate(datos.bebe.fecha_nacimiento) : '';
            document.getElementById('generoBebe').value = datos.bebe.genero || '';
            document.getElementById('direccionFamiliar').value = datos.bebe.direccion_familiar || '';
            document.getElementById('codigoPostalFamiliar').value = datos.bebe.codigo_postal_familiar || '';
            document.getElementById('ciudadFamiliar').value = datos.bebe.ciudad_familiar || '';
            
            // Caja (excepto tipo de caja)
            document.getElementById('numeroCaja').value = datos.caja.numero_caja || '';
            document.getElementById('cantidadCajas').value = datos.caja.total_cajas_contratadas || 1;
            document.getElementById('personalizacion').value = datos.caja.personalizacion || '';
            document.getElementById('fechaEntrega').value = datos.caja.fecha_entrega ? formatDate(datos.caja.fecha_entrega) : '';
            document.getElementById('estadoCaja').value = datos.caja.estado || 'pendiente';
            document.getElementById('precioFinal').value = datos.caja.precio_final || '0.00';
            
            // Cambiar texto del botón
            btnGuardar.textContent = 'Actualizar Caja';
            
            // Intentar cargar el tipo de caja si las opciones ya están disponibles
            cargarTipoCajaSiDisponible();
        }
    });

    btnCancelar.addEventListener('click', () => {
        ipcRenderer.send('cerrar-ventana-caja');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        
        try {
            const datos = obtenerDatosFormulario();
              if (modoEdicion) {
                // Añadir IDs para actualización
                datos.id = idCajaEdicion;
                datos.cliente.id = document.getElementById('nombreCliente').dataset.idCliente;
                datos.bebe.id = document.getElementById('nombreBebe').dataset.idBebe;
                datos.caja.id = idCajaEdicion;
                datos.caja.id_servicio = document.getElementById('tipoCaja').dataset.idServicio;
                
                ipcRenderer.send('actualizar-caja', datos);
            } else {
                ipcRenderer.send('guardar-caja', datos);
            }
        } catch (error) {
            mostrarMensaje(`Error: ${error.message}`, 'error');
            console.error('Error al guardar la caja:', error);
            btnGuardar.disabled = false;
        }
    });

    // Recibir respuesta después de guardar
    ipcRenderer.on('caja-guardada', (event, resultado) => {
        if (resultado.success) {
            mostrarMensaje('Caja registrada correctamente', 'success');
            form.reset();
            modoEdicion = false;
            idCajaEdicion = null;
            btnGuardar.textContent = 'Guardar';
        } else {
            mostrarMensaje(`Error: ${resultado.message}`, 'error');
        }
        btnGuardar.disabled = false;
    });
    
    // Recibir respuesta después de actualizar
    ipcRenderer.on('caja-actualizada', (event, resultado) => {
        if (resultado.success) {
            mostrarMensaje('Caja actualizada correctamente', 'success');
            setTimeout(() => {
                ipcRenderer.send('cerrar-ventana-caja');
            }, 2000);
        } else {
            mostrarMensaje(`Error: ${resultado.message}`, 'error');
        }
        btnGuardar.disabled = false;
    });

    function obtenerDatosFormulario() {
        return {
            cliente: {
                nombre_apellidos: document.getElementById('nombreCliente').value,
                email: document.getElementById('emailCliente').value,
                telefono: document.getElementById('telefonoCliente').value,
                direccion: document.getElementById('direccionCliente').value,
                codigo_postal: document.getElementById('codigoPostalCliente').value,
                ciudad: document.getElementById('ciudadCliente').value
            },
            bebe: {
                nombre: document.getElementById('nombreBebe').value,
                apellidos: document.getElementById('apellidosBebe').value,
                fecha_nacimiento: document.getElementById('fechaNacimientoBebe').value,
                genero: document.getElementById('generoBebe').value,
                direccion_familiar: document.getElementById('direccionFamiliar').value,
                codigo_postal_familiar: document.getElementById('codigoPostalFamiliar').value,
                ciudad_familiar: document.getElementById('ciudadFamiliar').value
            },
            caja: {
                id_tipo_caja: parseInt(document.getElementById('tipoCaja').value),
                numero_caja: document.getElementById('numeroCaja').value,
                total_cajas_contratadas: parseInt(document.getElementById('cantidadCajas').value),
                personalizacion: document.getElementById('personalizacion').value,
                fecha_entrega: document.getElementById('fechaEntrega').value,
                estado: document.getElementById('estadoCaja').value,
                precio_final: parseFloat(document.getElementById('precioFinal').value) || 0
            }
        };
    }

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo;
        mensajeDiv.style.display = 'block';
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 5000);
    }

    // Función auxiliar para formatear fechas
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }

    async function cargarTiposCaja() {
        try {
            ipcRenderer.send('obtener-tipos-caja');
        } catch (error) {
            console.error('Error al cargar tipos de caja:', error);
        }
    }

    ipcRenderer.on('tipos-caja-obtenidos', (event, tiposCaja) => {
        const select = document.getElementById('tipoCaja');
        
        console.log('Tipos de caja recibidos:', tiposCaja);
        
        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar opciones desde la base de datos (solo nombre, sin precio)
        tiposCaja.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
        
        // Si tenemos datos pendientes de cargar, cargar el tipo de caja ahora
        cargarTipoCajaSiDisponible();
    });
    
    function cargarTipoCajaSiDisponible() {
        const select = document.getElementById('tipoCaja');
        
        // Verificar si tenemos datos pendientes y si las opciones están cargadas
        if (datosCajaParaCargar && select.options.length > 1) {
            console.log('Estableciendo tipo de caja:', datosCajaParaCargar.caja.id_tipo_caja);
            select.value = datosCajaParaCargar.caja.id_tipo_caja || '';
            
            // Almacenar ID de servicio para la edición
            document.getElementById('tipoCaja').dataset.idServicio = datosCajaParaCargar.caja.id_servicio;
            
            // Verificar si se estableció correctamente
            if (select.value !== String(datosCajaParaCargar.caja.id_tipo_caja)) {
                console.warn('No se pudo establecer el tipo de caja. Valor esperado:', datosCajaParaCargar.caja.id_tipo_caja, 'Opciones disponibles:', Array.from(select.options).map(o => o.value));
            } else {
                console.log('Tipo de caja establecido correctamente');
            }
            
            // Limpiar datos pendientes
            datosCajaParaCargar = null;
        }
    }
});