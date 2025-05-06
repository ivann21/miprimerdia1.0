const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.config = {
            host: 'localhost',
            user: 'root', // Cambiar por tu usuario de MySQL
            password: '', // Cambiar por tu contraseña de MySQL
            database: 'miprimerdia'
        };
        this.connection = null;
    }

    async connect() {
        if (!this.connection) {
            this.connection = await mysql.createConnection(this.config);
        }
        return this.connection;
    }

    async guardarCaja(datos) {
        const conn = await this.connect();
        
        try {
            await conn.beginTransaction();
            
            // 1. Insertar cliente
            const [clienteResult] = await conn.execute(
                `INSERT INTO Clientes 
                (nombre_apellidos, email, telefono, direccion, codigo_postal, ciudad, fecha_de_alta) 
                VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
                [
                    datos.cliente.nombre_apellidos,
                    datos.cliente.email,
                    datos.cliente.telefono,
                    datos.cliente.direccion,
                    datos.cliente.codigo_postal,
                    datos.cliente.ciudad
                ]
            );
            
            const idCliente = clienteResult.insertId;
            
            // 2. Insertar bebé
            const [bebeResult] = await conn.execute(
                `INSERT INTO Bebes 
                (nombre, apellidos, fecha_nacimiento, genero, direccion_familiar, codigo_postal_familiar, ciudad_familiar) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.bebe.nombre,
                    datos.bebe.apellidos,
                    datos.bebe.fecha_nacimiento,
                    datos.bebe.genero,
                    datos.bebe.direccion_familiar,
                    datos.bebe.codigo_postal_familiar,
                    datos.bebe.ciudad_familiar
                ]
            );
            
            const idBebe = bebeResult.insertId;
            
            // 3. Obtener ID del servicio "Caja"
            const [servicioRows] = await conn.execute(
                `SELECT id FROM TiposServicio WHERE nombre = 'Caja' LIMIT 1`
            );
            
            if (servicioRows.length === 0) {
                throw new Error('No se encontró el tipo de servicio "Caja"');
            }
            
            const idTipoServicio = servicioRows[0].id;
            
            // 4. Insertar servicio
            const [servicioResult] = await conn.execute(
                `INSERT INTO Servicios 
                (id_cliente, id_tipo_servicio, fecha_contratacion, fecha_evento, estado) 
                VALUES (?, ?, CURDATE(), ?, 'pendiente')`,
                [idCliente, idTipoServicio, datos.bebe.fecha_nacimiento]
            );
            
            const idServicio = servicioResult.insertId;
            
            // 5. Insertar caja
            const [cajaResult] = await conn.execute(
                `INSERT INTO Cajas 
                (id_servicio, id_tipo_caja, id_bebe, numero_caja, total_cajas_contratadas, personalizacion, fecha_entrega, estado, precio_final) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', 
                (SELECT precio FROM TiposCaja WHERE id = ?) * ?)`,
                [
                    idServicio,
                    datos.caja.id_tipo_caja,
                    idBebe,
                    datos.caja.numero_caja,
                    datos.caja.total_cajas_contratadas,
                    datos.caja.personalizacion,
                    datos.caja.fecha_entrega,
                    datos.caja.id_tipo_caja,
                    datos.caja.total_cajas_contratadas
                ]
            );
            
            // 6. Actualizar cliente con última contratación
            await conn.execute(
                `UPDATE Clientes SET fecha_ultima_contratacion = CURDATE() WHERE id = ?`,
                [idCliente]
            );
            
            await conn.commit();
            
            return { success: true, message: 'Caja registrada correctamente' };
        } catch (error) {
            await conn.rollback();
            console.error('Error en la transacción:', error);
            return { success: false, message: error.message };
        }
    }

    async obtenerTiposCaja() {
        const conn = await this.connect();
        try {
            const [rows] = await conn.execute(
                `SELECT id, nombre, precio FROM TiposCaja WHERE activo = TRUE ORDER BY precio`
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener tipos de caja:', error);
            throw error;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }
}

module.exports = new Database();