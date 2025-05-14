const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const database = require('./database');

let mainWindow;
let cajaWindow;
let eventoWindow;

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

    eventoWindow.loadFile('form-eventos.html');

    eventoWindow.on('closed', function () {
        eventoWindow = null;
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
    if (eventoWindow) {
        eventoWindow.close();
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

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});