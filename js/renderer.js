document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cajaForm');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const mensajeDiv = document.getElementById('mensaje');

    // Cargar tipos de caja desde la base de datos
    cargarTiposCaja();

    btnCancelar.addEventListener('click', () => {
        form.reset();
        mostrarMensaje('Formulario cancelado', 'success');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        
        try {
            const datos = obtenerDatosFormulario();
            const resultado = await window.api.guardarCaja(datos);
            
            if (resultado.success) {
                mostrarMensaje('Caja registrada correctamente', 'success');
                form.reset();
            } else {
                mostrarMensaje(`Error: ${resultado.message}`, 'error');
            }
        } catch (error) {
            mostrarMensaje(`Error: ${error.message}`, 'error');
            console.error('Error al guardar la caja:', error);
        } finally {
            btnGuardar.disabled = false;
        }
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
                fecha_entrega: document.getElementById('fechaEntrega').value
            }
        };
    }

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo;
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 5000);
    }

    async function cargarTiposCaja() {
        try {
            const tiposCaja = await window.api.obtenerTiposCaja();
            const select = document.getElementById('tipoCaja');
            
            // Limpiar opciones excepto la primera
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Agregar opciones desde la base de datos
            tiposCaja.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = `${tipo.nombre} (${tipo.precio}€)`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar tipos de caja:', error);
        }
    }
});