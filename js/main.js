const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const database = require('./database');

// Utilidades para manejo de fechas
function formatearFechaParaInput(fecha) {
    if (!fecha) return '';
    
    try {
        // Si la fecha viene como string, crear objeto Date
        const fechaObj = new Date(fecha);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) {
            return '';
        }
        
        // Formatear como YYYY-MM-DD para inputs de tipo date
        const year = fechaObj.getFullYear();
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const day = String(fechaObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error al formatear fecha para input:', error);
        return '';
    }
}

function procesarFechasParaBaseDatos(datos) {
    const datosProcesados = { ...datos };
    
    // Procesar fechas que pueden venir de inputs
    if (datosProcesados.fecha_nacimiento_bebe) {
        datosProcesados.fecha_nacimiento_bebe = datosProcesados.fecha_nacimiento_bebe || null;
    }
    
    if (datosProcesados.fecha_entrega) {
        datosProcesados.fecha_entrega = datosProcesados.fecha_entrega || null;
    }
    
    if (datosProcesados.fecha_evento) {
        datosProcesados.fecha_evento = datosProcesados.fecha_evento || null;
    }
    
    return datosProcesados;
}

let mainWindow;
let cajaWindow;
let eventoWindow;
let listaCajasWindow;
let listaEventosWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function createCajaWindow() {
    cajaWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    cajaWindow.loadFile('form-cajas.html');

    cajaWindow.on('closed', function () {
        cajaWindow = null;
    });
}

function createEventoWindow() {
    eventoWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    eventoWindow.loadFile('form-eventos.html');    eventoWindow.on('closed', function () {
        console.log('Evento ventana cerrada: limpiando referencia');
        eventoWindow = null;
    });
    
    eventoWindow.on('close', function (e) {
        // Este evento se dispara antes de que la ventana se cierre
        console.log('Evento ventana cerrándose');
    });
}

function createListaCajasWindow() {
    listaCajasWindow = new BrowserWindow({
        parent: mainWindow,
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    listaCajasWindow.loadFile('lista-cajas.html');

    listaCajasWindow.on('closed', function () {
        listaCajasWindow = null;
    });
}

function createListaEventosWindow() {
    listaEventosWindow = new BrowserWindow({
        parent: mainWindow,
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    listaEventosWindow.loadFile('lista-eventos.html');

    listaEventosWindow.on('closed', function () {
        listaEventosWindow = null;
    });
}

// IPC Handlers
ipcMain.on('abrir-formulario-caja', () => {
    if (cajaWindow === null || cajaWindow === undefined) {
        createCajaWindow();
    }
});

ipcMain.on('cerrar-ventana-caja', () => {
    if (cajaWindow) {
        cajaWindow.close();
    }
});

ipcMain.on('guardar-caja', async (event, datos) => {
    try {
        // Procesar fechas antes de enviar a la base de datos
        const datosConFechasProcesadas = procesarFechasParaBaseDatos(datos);
        const resultado = await database.guardarCaja(datosConFechasProcesadas);
        event.reply('caja-guardada', resultado);
    } catch (error) {
        event.reply('caja-guardada', { success: false, message: error.message });
    }
});

ipcMain.on('abrir-formulario-evento', () => {
    if (eventoWindow === null || eventoWindow === undefined) {
        createEventoWindow();
    }
});

ipcMain.on('cerrar-ventana-evento', () => {
    try {
        if (eventoWindow) {
            eventoWindow.close();
            console.log('Ventana de eventos cerrada correctamente');
        } else {
            console.log('No se pudo cerrar la ventana: eventoWindow es null');
        }
    } catch (error) {
        console.error('Error al cerrar la ventana de eventos:', error);
    }
});

ipcMain.on('guardar-evento', async (event, datos) => {
    try {
        // Procesar fechas antes de enviar a la base de datos
        const datosConFechasProcesadas = procesarFechasParaBaseDatos(datos);
        const resultado = await database.guardarEvento(datosConFechasProcesadas);
        event.reply('evento-guardado', resultado);
    } catch (error) {
        event.reply('evento-guardado', { exito: false, mensaje: error.message });
    }
});

ipcMain.on('obtener-tipos-caja', async (event) => {
    try {
        const tiposCaja = await database.obtenerTiposCaja();
        event.reply('tipos-caja-obtenidos', tiposCaja);
    } catch (error) {
        console.error('Error al obtener tipos de caja:', error);
        event.reply('tipos-caja-obtenidos', []);
    }
});

ipcMain.on('obtener-tipos-evento', async (event) => {
    try {
        const tiposEvento = await database.obtenerTiposEvento();
        event.reply('tipos-evento-obtenidos', tiposEvento);
    } catch (error) {
        console.error('Error al obtener tipos de evento:', error);
        event.reply('tipos-evento-obtenidos', []);
    }
});

ipcMain.on('listar-cajas', async (event, filtros) => {
    try {
        console.log('Filtrando cajas con:', filtros);
        const cajas = await database.listarCajas(filtros);
        console.log(`Encontradas ${cajas.length} cajas`);
        event.reply('cajas-listadas', cajas);
    } catch (error) {
        console.error('Error al listar cajas:', error);
        event.reply('cajas-listadas', []);
    }
});

ipcMain.on('listar-eventos', async (event, filtros) => {
    try {
        console.log('Filtrando eventos con:', filtros);
        const eventos = await database.listarEventos(filtros);
        console.log(`Encontrados ${eventos.length} eventos`);
        event.reply('eventos-listados', eventos);
    } catch (error) {
        console.error('Error al listar eventos:', error);
        event.reply('eventos-listados', []);
    }
});

ipcMain.on('abrir-listado-cajas', () => {
    if (listaCajasWindow === null || listaCajasWindow === undefined) {
        createListaCajasWindow();
    } else {
        listaCajasWindow.focus();
    }
});

ipcMain.on('abrir-listado-eventos', () => {
    if (listaEventosWindow === null || listaEventosWindow === undefined) {
        createListaEventosWindow();
    } else {
        listaEventosWindow.focus();
    }
});

ipcMain.on('volver-menu', () => {
    if (listaCajasWindow) {
        listaCajasWindow.close();
    }
    if (listaEventosWindow) {
        listaEventosWindow.close();
    }
    // Solo enfocar la ventana principal si existe, no crearla
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
    }
});

ipcMain.on('eliminar-caja', async (event, id) => {
    try {
        const resultado = await database.eliminarCaja(id);
        event.reply('caja-eliminada', resultado);
    } catch (error) {
        event.reply('caja-eliminada', { success: false, message: error.message });
    }
});

ipcMain.on('eliminar-evento', async (event, id) => {
    try {
        const resultado = await database.eliminarEvento(id);
        event.reply('evento-eliminado', resultado);
    } catch (error) {
        event.reply('evento-eliminado', { exito: false, mensaje: error.message });
    }
});

ipcMain.on('editar-caja', async (event, id) => {
    try {
        const datosCaja = await database.obtenerCaja(id);
        
        // Verificar si se encontró la caja y no es un error
        if (datosCaja.notFound || datosCaja.error) {
            const mensaje = datosCaja.notFound 
                ? 'El registro seleccionado no es una caja válida o no existe' 
                : `Error al acceder a la base de datos: ${datosCaja.message}`;
            console.log('Error al editar caja:', mensaje);
            event.reply('caja-eliminada', { success: false, message: mensaje });
            return;
        }
        
        // Formatear fechas para los inputs
        if (datosCaja.bebe && datosCaja.bebe.fecha_nacimiento) {
            datosCaja.bebe.fecha_nacimiento = formatearFechaParaInput(datosCaja.bebe.fecha_nacimiento);
        }
        
        if (datosCaja.caja && datosCaja.caja.fecha_entrega) {
            datosCaja.caja.fecha_entrega = formatearFechaParaInput(datosCaja.caja.fecha_entrega);
        }
        
        if (cajaWindow === null || cajaWindow === undefined) {
            createCajaWindow();
            // Esperar a que la ventana esté lista para recibir datos
            cajaWindow.webContents.once('did-finish-load', () => {
                cajaWindow.webContents.send('cargar-datos-caja', datosCaja);
            });
        } else {
            cajaWindow.webContents.send('cargar-datos-caja', datosCaja);
            cajaWindow.focus();
        }
    } catch (error) {
        console.error('Error al editar caja:', error);
        event.reply('caja-eliminada', { success: false, message: 'Error de conexión con la base de datos: ' + error.message });
    }
});

ipcMain.on('editar-evento', async (event, id) => {
    try {
        console.log('Solicitando edición de evento ID:', id);
        const datosEvento = await database.obtenerEvento(id);
        
        console.log('Datos del evento obtenidos:', datosEvento);
        
        // Verificar si se encontró el evento y no es un error
        if (!datosEvento || (datosEvento.notFound || datosEvento.error)) {
            const mensaje = 'El registro seleccionado no es un evento válido o no existe';
            console.log('Error al editar evento:', mensaje);
            event.reply('evento-eliminado', { exito: false, mensaje: mensaje });
            return;
        }
        
        // Formatear fechas para los inputs
        if (datosEvento.bebe && datosEvento.bebe.fecha_nacimiento) {
            datosEvento.bebe.fecha_nacimiento = formatearFechaParaInput(datosEvento.bebe.fecha_nacimiento);
        }
        
        if (datosEvento.evento && datosEvento.evento.fecha_evento) {
            datosEvento.evento.fecha_evento = formatearFechaParaInput(datosEvento.evento.fecha_evento);
        }
        
        if (eventoWindow === null || eventoWindow === undefined) {
            createEventoWindow();
            // Esperar a que la ventana esté lista para recibir datos
            eventoWindow.webContents.once('did-finish-load', () => {
                console.log('Enviando datos a la ventana de evento');
                eventoWindow.webContents.send('cargar-datos-evento', datosEvento);
            });
        } else {
            eventoWindow.webContents.send('cargar-datos-evento', datosEvento);
            eventoWindow.focus();
        }
    } catch (error) {
        console.error('Error al editar evento:', error);
        event.reply('evento-eliminado', { exito: false, mensaje: 'Error de conexión con la base de datos: ' + error.message });
    }
});

ipcMain.on('actualizar-caja', async (event, datos) => {
    try {
        // Procesar fechas antes de enviar a la base de datos
        const datosConFechasProcesadas = procesarFechasParaBaseDatos(datos);
        const resultado = await database.actualizarCaja(datosConFechasProcesadas);
        event.reply('caja-actualizada', resultado);
    } catch (error) {
        event.reply('caja-actualizada', { success: false, message: error.message });
    }
});

ipcMain.on('actualizar-evento', async (event, datos) => {
    try {
        // Procesar fechas antes de enviar a la base de datos
        const datosConFechasProcesadas = procesarFechasParaBaseDatos(datos);
        const resultado = await database.actualizarEvento(datosConFechasProcesadas);
        event.reply('evento-actualizado', resultado);
    } catch (error) {
        event.reply('evento-actualizado', { exito: false, mensaje: error.message });
    }
});

ipcMain.on('ver-detalles-caja', async (event, id) => {
    try {
        const datosCaja = await database.obtenerCaja(id);
        event.reply('detalles-caja-cargados', datosCaja);
    } catch (error) {
        console.error('Error al obtener detalles de caja:', error);
        event.reply('detalles-caja-cargados', { error: true, message: error.message });
    }
});

ipcMain.on('ver-detalles-evento', async (event, id) => {
    try {
        const datosEvento = await database.obtenerEvento(id);
        event.reply('detalles-evento-cargados', datosEvento);
    } catch (error) {
        console.error('Error al obtener detalles de evento:', error);
        event.reply('detalles-evento-cargados', { error: true, message: error.message });
    }
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    // Solo crear ventana principal si no hay ninguna ventana abierta
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});