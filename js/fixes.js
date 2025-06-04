/**
 * Funciones auxiliares para mejorar manejo de errores y validación en la aplicación
 * Este archivo contiene utilidades que pueden ser importadas en los diferentes archivos HTML
 */

/**
 * Valida un rango de fechas
 * @param {string} fechaInicio - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} fechaFin - Fecha de fin en formato YYYY-MM-DD
 * @param {string} mensajeError - Mensaje de error personalizado
 * @returns {boolean} - true si las fechas son válidas, false en caso contrario
 */
function validarRangoFechas(fechaInicio, fechaFin, mensajeError) {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
        mostrarMensaje(mensajeError || 'La fecha de inicio debe ser anterior a la fecha de fin', 'error');
        return false;
    }
    return true;
}

/**
 * Valida un rango de precios
 * @param {string|number} precioMinimo - Precio mínimo
 * @param {string|number} precioMaximo - Precio máximo
 * @param {string} mensajeError - Mensaje de error personalizado
 * @returns {boolean} - true si los precios son válidos, false en caso contrario
 */
function validarRangoPrecios(precioMinimo, precioMaximo, mensajeError) {
    if (precioMinimo && precioMaximo && parseFloat(precioMinimo) > parseFloat(precioMaximo)) {
        mostrarMensaje(mensajeError || 'El precio mínimo no puede ser mayor que el precio máximo', 'error');
        return false;
    }
    return true;
}

/**
 * Sanitiza un objeto de cajas
 * @param {Object} caja - Objeto caja
 * @returns {Object} - Objeto caja sanitizado
 */
function sanitizarCaja(caja) {
    return {
        id: caja.id || '',
        numero_caja: caja.numero_caja || 'Sin número',
        tipo_caja: caja.tipo_caja || 'Sin especificar',
        nombre_bebe: caja.nombre_bebe || '',
        apellidos_bebe: caja.apellidos_bebe || '',
        nombre_cliente: caja.nombre_cliente || 'Sin cliente',
        fecha_entrega: caja.fecha_entrega || null,
        estado: caja.estado || 'pendiente',
        precio_final: isNaN(parseFloat(caja.precio_final)) ? 0 : parseFloat(caja.precio_final)
    };
}

/**
 * Sanitiza un objeto de eventos
 * @param {Object} evento - Objeto evento
 * @returns {Object} - Objeto evento sanitizado
 */
function sanitizarEvento(evento) {
    return {
        id: evento.id || '',
        nombre_cliente: evento.nombre_cliente || 'Sin nombre',
        tipo_servicio: evento.tipo_servicio || 'Sin especificar',
        fecha_contratacion: evento.fecha_contratacion || null,
        fecha_evento: evento.fecha_evento || null,
        estado: evento.estado || 'pendiente',
        precio_total: isNaN(parseFloat(evento.precio_total)) ? 0 : parseFloat(evento.precio_total)
    };
}

/**
 * Formatea una fecha con manejo de errores
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    
    try {
        return new Date(fecha).toLocaleDateString();
    } catch (e) {
        console.error('Error al formatear fecha:', e);
        return 'Fecha inválida';
    }
}

/**
 * Escapar texto para CSV
 * @param {any} texto - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escaparCSV(texto) {
    if (texto === null || texto === undefined) return '';
    return `"${String(texto).replace(/"/g, '""')}"`;
}

// Exportar funciones para su uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validarRangoFechas,
        validarRangoPrecios,
        sanitizarCaja,
        sanitizarEvento,
        formatearFecha,
        escaparCSV
    };
}
