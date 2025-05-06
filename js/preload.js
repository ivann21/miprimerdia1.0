const { contextBridge, ipcRenderer } = require('electron');
const database = require('./database');

contextBridge.exposeInMainWorld('api', {
    guardarCaja: async (datos) => {
        return await database.guardarCaja(datos);
    },
    obtenerTiposCaja: async () => {
        return await database.obtenerTiposCaja();
    }
});