const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const database = require('./database');

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
        const resultado = await database.guardarCaja(datos);
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
        const resultado = await database.guardarEvento(datos);
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
        const cajas = await database.listarCajas(filtros);
        event.reply('cajas-listadas', cajas);
    } catch (error) {
        console.error('Error al listar cajas:', error);
        event.reply('cajas-listadas', []);
    }
});

ipcMain.on('listar-eventos', async (event, filtros) => {
    try {
        const eventos = await database.listarEventos(filtros);
        event.reply('eventos-listados', eventos);
    } catch (error) {
        console.error('Error al listar eventos:', error);
        event.reply('eventos-listados', []);
    }
});

ipcMain.on('abrir-listado-cajas', () => {
    if (listaCajasWindow === null || listaCajasWindow === undefined) {
        createListaCajasWindow();
    }
});

ipcMain.on('abrir-listado-eventos', () => {
    if (listaEventosWindow === null || listaEventosWindow === undefined) {
        createListaEventosWindow();
    }
});

ipcMain.on('volver-menu', () => {
    if (listaCajasWindow) {
        listaCajasWindow.close();
    }
    if (listaEventosWindow) {
        listaEventosWindow.close();
    }
    if (mainWindow === null) {
        createWindow();
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
        if (cajaWindow === null || cajaWindow === undefined) {
            createCajaWindow();
            // Esperar a que la ventana esté lista para recibir datos
            cajaWindow.webContents.on('did-finish-load', () => {
                cajaWindow.webContents.send('cargar-datos-caja', datosCaja);
            });
        } else {
            cajaWindow.webContents.send('cargar-datos-caja', datosCaja);
        }
    } catch (error) {
        console.error('Error al editar caja:', error);
        event.reply('caja-eliminada', { success: false, message: 'Error al cargar datos: ' + error.message });
    }
});

ipcMain.on('editar-evento', async (event, id) => {
    try {
        const datosEvento = await database.obtenerEvento(id);
        if (eventoWindow === null || eventoWindow === undefined) {
            createEventoWindow();
            // Esperar a que la ventana esté lista para recibir datos
            eventoWindow.webContents.on('did-finish-load', () => {
                eventoWindow.webContents.send('cargar-datos-evento', datosEvento);
            });
        } else {
            eventoWindow.webContents.send('cargar-datos-evento', datosEvento);
        }
    } catch (error) {
        console.error('Error al editar evento:', error);
        event.reply('evento-eliminado', { exito: false, mensaje: 'Error al cargar datos: ' + error.message });
    }
});

ipcMain.on('actualizar-caja', async (event, datos) => {
    try {
        const resultado = await database.actualizarCaja(datos);
        event.reply('caja-actualizada', resultado);
    } catch (error) {
        event.reply('caja-actualizada', { success: false, message: error.message });
    }
});

ipcMain.on('actualizar-evento', async (event, datos) => {
    try {
        const resultado = await database.actualizarEvento(datos);
        event.reply('evento-actualizado', resultado);
    } catch (error) {
        event.reply('evento-actualizado', { exito: false, mensaje: error.message });
    }
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});