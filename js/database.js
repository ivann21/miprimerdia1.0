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

    async guardarEvento(datos) {
        const conn = await this.connect();
        
        try {
            await conn.beginTransaction();
            
            // 1. Insertar o actualizar cliente
            let idCliente;
            if (datos.cliente.id) {
                await conn.execute(
                    `UPDATE Clientes 
                    SET nombre_apellidos = ?, email = ?, telefono = ?, direccion = ?, 
                    codigo_postal = ?, ciudad = ?, fecha_nacimiento = ?
                    WHERE id = ?`,
                    [
                        datos.cliente.nombre_apellidos,
                        datos.cliente.email,
                        datos.cliente.telefono,
                        datos.cliente.direccion,
                        datos.cliente.codigo_postal,
                        datos.cliente.ciudad,
                        datos.cliente.fecha_nacimiento,
                        datos.cliente.id
                    ]
                );
                idCliente = datos.cliente.id;
            } else {
                const [clienteResult] = await conn.execute(
                    `INSERT INTO Clientes 
                    (nombre_apellidos, email, telefono, direccion, codigo_postal, ciudad, fecha_nacimiento, fecha_de_alta) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
                    [
                        datos.cliente.nombre_apellidos,
                        datos.cliente.email,
                        datos.cliente.telefono,
                        datos.cliente.direccion,
                        datos.cliente.codigo_postal,
                        datos.cliente.ciudad,
                        datos.cliente.fecha_nacimiento
                    ]
                );
                idCliente = clienteResult.insertId;
            }
            
            // 2. Insertar o actualizar servicio de evento
            if (datos.servicio.id) {
                await conn.execute(
                    `UPDATE Servicios 
                    SET id_tipo_servicio = ?, fecha_evento = ?, estado = ?,
                    notas_cliente = ?, observaciones_internas = ?, precio_total = ?
                    WHERE id = ?`,
                    [
                        datos.servicio.id_tipo_servicio,
                        datos.servicio.fecha_evento,
                        datos.servicio.estado,
                        datos.servicio.notas_cliente,
                        datos.servicio.observaciones_internas,
                        datos.servicio.precio_total,
                        datos.servicio.id
                    ]
                );
            } else {
                await conn.execute(
                    `INSERT INTO Servicios 
                    (id_cliente, id_tipo_servicio, fecha_contratacion, fecha_evento, estado, notas_cliente, observaciones_internas, precio_total) 
                    VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
                    [
                        idCliente,
                        datos.servicio.id_tipo_servicio,
                        datos.servicio.fecha_evento,
                        datos.servicio.estado,
                        datos.servicio.notas_cliente,
                        datos.servicio.observaciones_internas,
                        datos.servicio.precio_total
                    ]
                );
            }
            
            // 3. Actualizar cliente con última contratación
            await conn.execute(
                `UPDATE Clientes SET fecha_ultima_contratacion = CURDATE() WHERE id = ?`,
                [idCliente]
            );
            
            await conn.commit();
            
            return { exito: true, mensaje: 'Evento registrado correctamente' };
        } catch (error) {
            await conn.rollback();
            console.error('Error en la transacción:', error);
            return { exito: false, mensaje: error.message };
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

    async obtenerTiposEvento() {
        const conn = await this.connect();
        try {
            const [rows] = await conn.execute(
                `SELECT id, nombre, descripcion FROM TiposServicio 
                WHERE nombre != 'Caja' 
                ORDER BY id`
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener tipos de evento:', error);
            throw error;
        }
    }

    async listarCajas(filtros = {}) {
        const conn = await this.connect();        try {
            let query = `
                SELECT 
                    c.id,
                    c.numero_caja,
                    tc.nombre AS tipo_caja,
                    b.nombre AS nombre_bebe,
                    b.apellidos AS apellidos_bebe,
                    cl.nombre_apellidos AS nombre_cliente,
                    c.fecha_entrega,
                    c.estado,
                    c.precio_final,
                    c.personalizacion
                FROM 
                    Cajas c
                JOIN 
                    TiposCaja tc ON c.id_tipo_caja = tc.id
                JOIN 
                    Bebes b ON c.id_bebe = b.id
                JOIN 
                    Servicios s ON c.id_servicio = s.id
                JOIN 
                    Clientes cl ON s.id_cliente = cl.id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Aplicar filtros básicos
            if (filtros.estado) {
                query += " AND c.estado = ?";
                params.push(filtros.estado);
            }
            
            if (filtros.tipoCaja) {
                query += " AND c.id_tipo_caja = ?";
                params.push(filtros.tipoCaja);
            }
            
            if (filtros.busqueda) {
                query += " AND (c.numero_caja LIKE ? OR b.nombre LIKE ? OR b.apellidos LIKE ? OR cl.nombre_apellidos LIKE ?)";
                const termino = `%${filtros.busqueda}%`;
                params.push(termino, termino, termino, termino);
            }
            
            // Aplicar filtros avanzados
            if (filtros.fechaEntregaDesde) {
                query += " AND c.fecha_entrega >= ?";
                params.push(filtros.fechaEntregaDesde);
            }
            
            if (filtros.fechaEntregaHasta) {
                query += " AND c.fecha_entrega <= ?";
                params.push(filtros.fechaEntregaHasta);
            }
            
            if (filtros.precioMinimo) {
                query += " AND c.precio_final >= ?";
                params.push(parseFloat(filtros.precioMinimo));
            }
            
            if (filtros.precioMaximo) {
                query += " AND c.precio_final <= ?";
                params.push(parseFloat(filtros.precioMaximo));
            }
            
            if (filtros.buscarPersonalizacion) {
                query += " AND c.personalizacion LIKE ?";
                params.push(`%${filtros.buscarPersonalizacion}%`);
            }
            
            query += " ORDER BY c.id DESC";
            
            const [rows] = await conn.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error al listar cajas:', error);
            throw error;
        }
    }    async listarEventos(filtros = {}) {
        const conn = await this.connect();
        try {
            let query = `
                SELECT 
                    s.id,
                    cl.nombre_apellidos AS nombre_cliente,
                    ts.nombre AS tipo_servicio,
                    s.fecha_contratacion,
                    s.fecha_evento,
                    s.estado,
                    s.precio_total,
                    s.notas_cliente,
                    s.observaciones_internas
                FROM 
                    Servicios s
                JOIN 
                    Clientes cl ON s.id_cliente = cl.id
                JOIN 
                    TiposServicio ts ON s.id_tipo_servicio = ts.id
                WHERE 
                    ts.nombre != 'Caja'
            `;
            
            const params = [];
            
            // Aplicar filtros básicos
            if (filtros.estado) {
                query += " AND s.estado = ?";
                params.push(filtros.estado);
            }
            
            if (filtros.tipoEvento) {
                query += " AND s.id_tipo_servicio = ?";
                params.push(filtros.tipoEvento);
            }
            
            if (filtros.busqueda) {
                query += " AND (cl.nombre_apellidos LIKE ? OR s.notas_cliente LIKE ?)";
                const termino = `%${filtros.busqueda}%`;
                params.push(termino, termino);
            }
            
            // Aplicar filtros avanzados
            if (filtros.fechaEventoDesde) {
                query += " AND s.fecha_evento >= ?";
                params.push(filtros.fechaEventoDesde);
            }
            
            if (filtros.fechaEventoHasta) {
                query += " AND s.fecha_evento <= ?";
                params.push(filtros.fechaEventoHasta);
            }
            
            if (filtros.fechaContratacionDesde) {
                query += " AND s.fecha_contratacion >= ?";
                params.push(filtros.fechaContratacionDesde);
            }
            
            if (filtros.fechaContratacionHasta) {
                query += " AND s.fecha_contratacion <= ?";
                params.push(filtros.fechaContratacionHasta);
            }
            
            if (filtros.precioMinimo) {
                query += " AND s.precio_total >= ?";
                params.push(parseFloat(filtros.precioMinimo));
            }
            
            if (filtros.precioMaximo) {
                query += " AND s.precio_total <= ?";
                params.push(parseFloat(filtros.precioMaximo));
            }
            
            if (filtros.buscarObservaciones) {
                query += " AND s.observaciones_internas LIKE ?";
                params.push(`%${filtros.buscarObservaciones}%`);
            }
            
            query += " ORDER BY s.fecha_contratacion DESC";
            
            const [rows] = await conn.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error al listar eventos:', error);
            throw error;
        }
    }

    async eliminarCaja(id) {
        const conn = await this.connect();
        try {
            await conn.beginTransaction();
            
            // Obtener información de la caja para saber qué registros eliminar
            const [cajaInfo] = await conn.execute('SELECT id_servicio, id_bebe FROM Cajas WHERE id = ?', [id]);
            
            if (cajaInfo.length === 0) {
                throw new Error('No se encontró la caja');
            }
            
            const idServicio = cajaInfo[0].id_servicio;
            const idBebe = cajaInfo[0].id_bebe;
            
            // Eliminar la caja
            await conn.execute('DELETE FROM Cajas WHERE id = ?', [id]);
            
            // Eliminar el servicio asociado
            await conn.execute('DELETE FROM Servicios WHERE id = ?', [idServicio]);
            
            // Eliminar el bebé asociado
            await conn.execute('DELETE FROM Bebes WHERE id = ?', [idBebe]);
            
            await conn.commit();
            return { success: true, message: 'Caja eliminada correctamente' };
        } catch (error) {
            await conn.rollback();
            console.error('Error al eliminar caja:', error);
            return { success: false, message: error.message };
        }
    }

    async eliminarEvento(id) {
        const conn = await this.connect();
        try {
            // Eliminar el servicio directamente
            await conn.execute('DELETE FROM Servicios WHERE id = ?', [id]);
            
            return { exito: true, mensaje: 'Evento eliminado correctamente' };
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            return { exito: false, mensaje: error.message };
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    async obtenerCaja(id) {
        const conn = await this.connect();
        try {
            const query = `
                SELECT 
                    c.id,
                    c.numero_caja,
                    c.id_tipo_caja,
                    c.id_bebe,
                    c.id_servicio,
                    c.total_cajas_contratadas,
                    c.personalizacion,
                    c.fecha_entrega,
                    c.estado,
                    c.precio_final,
                    b.nombre AS nombre_bebe,
                    b.apellidos AS apellidos_bebe,
                    b.fecha_nacimiento AS fecha_nacimiento_bebe,
                    b.genero AS genero_bebe,
                    b.direccion_familiar,
                    b.codigo_postal_familiar,
                    b.ciudad_familiar,
                    cl.id AS id_cliente,
                    cl.nombre_apellidos,
                    cl.email,
                    cl.telefono,
                    cl.direccion,
                    cl.codigo_postal,
                    cl.ciudad
                FROM 
                    Cajas c
                JOIN 
                    Bebes b ON c.id_bebe = b.id
                JOIN 
                    Servicios s ON c.id_servicio = s.id
                JOIN 
                    Clientes cl ON s.id_cliente = cl.id
                WHERE 
                    c.id = ?
            `;
            
            const [rows] = await conn.execute(query, [id]);
            
            if (rows.length === 0) {
                throw new Error('No se encontró la caja');
            }
            
            // Formato para devolver los datos en la estructura esperada por el formulario
            const caja = rows[0];
            return {
                id: caja.id,
                cliente: {
                    id: caja.id_cliente,
                    nombre_apellidos: caja.nombre_apellidos,
                    email: caja.email,
                    telefono: caja.telefono,
                    direccion: caja.direccion,
                    codigo_postal: caja.codigo_postal,
                    ciudad: caja.ciudad
                },
                bebe: {
                    id: caja.id_bebe,
                    nombre: caja.nombre_bebe,
                    apellidos: caja.apellidos_bebe,
                    fecha_nacimiento: caja.fecha_nacimiento_bebe,
                    genero: caja.genero_bebe,
                    direccion_familiar: caja.direccion_familiar,
                    codigo_postal_familiar: caja.codigo_postal_familiar,
                    ciudad_familiar: caja.ciudad_familiar
                },
                caja: {
                    id: caja.id,
                    id_tipo_caja: caja.id_tipo_caja,
                    id_servicio: caja.id_servicio,
                    numero_caja: caja.numero_caja,
                    total_cajas_contratadas: caja.total_cajas_contratadas,
                    personalizacion: caja.personalizacion,
                    fecha_entrega: caja.fecha_entrega,
                    estado: caja.estado,
                    precio_final: caja.precio_final
                }
            };
        } catch (error) {
            console.error('Error al obtener caja:', error);
            throw error;
        }
    }

    async obtenerEvento(id) {
        const conn = await this.connect();
        try {
            const query = `
                SELECT 
                    s.id,
                    s.id_tipo_servicio,
                    s.fecha_contratacion,
                    s.fecha_evento,
                    s.estado,
                    s.notas_cliente,
                    s.observaciones_internas,
                    s.precio_total,
                    cl.id AS id_cliente,
                    cl.nombre_apellidos,
                    cl.email,
                    cl.telefono,
                    cl.direccion,
                    cl.codigo_postal,
                    cl.ciudad,
                    cl.fecha_nacimiento
                FROM 
                    Servicios s
                JOIN 
                    Clientes cl ON s.id_cliente = cl.id
                JOIN 
                    TiposServicio ts ON s.id_tipo_servicio = ts.id
                WHERE 
                    s.id = ? AND ts.nombre != 'Caja'
            `;
            
            const [rows] = await conn.execute(query, [id]);
            
            if (rows.length === 0) {
                throw new Error('No se encontró el evento');
            }
            
            // Formato para devolver los datos en la estructura esperada por el formulario
            const evento = rows[0];
            return {
                cliente: {
                    id: evento.id_cliente,
                    nombre_apellidos: evento.nombre_apellidos,
                    email: evento.email,
                    telefono: evento.telefono,
                    direccion: evento.direccion,
                    codigo_postal: evento.codigo_postal,
                    ciudad: evento.ciudad,
                    fecha_nacimiento: evento.fecha_nacimiento
                },
                servicio: {
                    id: evento.id,
                    id_tipo_servicio: evento.id_tipo_servicio,
                    fecha_contratacion: evento.fecha_contratacion,
                    fecha_evento: evento.fecha_evento,
                    estado: evento.estado,
                    notas_cliente: evento.notas_cliente,
                    observaciones_internas: evento.observaciones_internas,
                    precio_total: evento.precio_total
                }
            };
        } catch (error) {
            console.error('Error al obtener evento:', error);
            throw error;
        }
    }    async actualizarCaja(datos) {
        const conn = await this.connect();
        
        try {
            await conn.beginTransaction();
            
            // 1. Actualizar cliente
            await conn.execute(
                `UPDATE Clientes 
                SET nombre_apellidos = ?, email = ?, telefono = ?, direccion = ?, 
                codigo_postal = ?, ciudad = ?
                WHERE id = ?`,
                [
                    datos.cliente.nombre_apellidos,
                    datos.cliente.email,
                    datos.cliente.telefono,
                    datos.cliente.direccion,
                    datos.cliente.codigo_postal,
                    datos.cliente.ciudad,
                    datos.cliente.id
                ]
            );
            
            // 2. Actualizar bebé
            await conn.execute(
                `UPDATE Bebes 
                SET nombre = ?, apellidos = ?, fecha_nacimiento = ?, genero = ?, 
                direccion_familiar = ?, codigo_postal_familiar = ?, ciudad_familiar = ? 
                WHERE id = ?`,
                [
                    datos.bebe.nombre,
                    datos.bebe.apellidos,
                    datos.bebe.fecha_nacimiento,
                    datos.bebe.genero,
                    datos.bebe.direccion_familiar,
                    datos.bebe.codigo_postal_familiar,
                    datos.bebe.ciudad_familiar,
                    datos.bebe.id
                ]
            );
            
            // 3. Actualizar servicio
            await conn.execute(
                `UPDATE Servicios 
                SET fecha_evento = ?
                WHERE id = ?`,
                [
                    datos.bebe.fecha_nacimiento,
                    datos.caja.id_servicio
                ]
            );
            
            // 4. Actualizar caja
            await conn.execute(
                `UPDATE Cajas 
                SET id_tipo_caja = ?, numero_caja = ?, total_cajas_contratadas = ?, 
                personalizacion = ?, fecha_entrega = ?, 
                precio_final = (SELECT precio FROM TiposCaja WHERE id = ?) * ?
                WHERE id = ?`,
                [
                    datos.caja.id_tipo_caja,
                    datos.caja.numero_caja,
                    datos.caja.total_cajas_contratadas,
                    datos.caja.personalizacion,
                    datos.caja.fecha_entrega,
                    datos.caja.id_tipo_caja,
                    datos.caja.total_cajas_contratadas,
                    datos.caja.id
                ]
            );
            
            // 5. Actualizar cliente con última contratación
            await conn.execute(
                `UPDATE Clientes SET fecha_ultima_contratacion = CURDATE() WHERE id = ?`,
                [datos.cliente.id]
            );
            
            await conn.commit();
            
            return { success: true, message: 'Caja actualizada correctamente' };
        } catch (error) {
            await conn.rollback();
            console.error('Error en la actualización:', error);
            return { success: false, message: error.message };
        }
    }

    async actualizarEvento(datos) {
        const conn = await this.connect();
        
        try {
            await conn.beginTransaction();
            
            // 1. Actualizar cliente
            await conn.execute(
                `UPDATE Clientes 
                SET nombre_apellidos = ?, email = ?, telefono = ?, direccion = ?, 
                codigo_postal = ?, ciudad = ?, fecha_nacimiento = ?
                WHERE id = ?`,
                [
                    datos.cliente.nombre_apellidos,
                    datos.cliente.email,
                    datos.cliente.telefono,
                    datos.cliente.direccion,
                    datos.cliente.codigo_postal,
                    datos.cliente.ciudad,
                    datos.cliente.fecha_nacimiento,
                    datos.cliente.id
                ]
            );
            
            // 2. Actualizar servicio
            await conn.execute(
                `UPDATE Servicios 
                SET id_tipo_servicio = ?, fecha_evento = ?, estado = ?,
                notas_cliente = ?, observaciones_internas = ?, precio_total = ?
                WHERE id = ?`,
                [
                    datos.servicio.id_tipo_servicio,
                    datos.servicio.fecha_evento,
                    datos.servicio.estado,
                    datos.servicio.notas_cliente,
                    datos.servicio.observaciones_internas,
                    datos.servicio.precio_total,
                    datos.servicio.id
                ]
            );
            
            // 3. Actualizar cliente con última contratación
            await conn.execute(
                `UPDATE Clientes SET fecha_ultima_contratacion = CURDATE() WHERE id = ?`,
                [datos.cliente.id]
            );
            
            await conn.commit();
            
            return { exito: true, mensaje: 'Evento actualizado correctamente' };
        } catch (error) {
            await conn.rollback();
            console.error('Error en la actualización:', error);
            return { exito: false, mensaje: error.message };
        }
    }
}

module.exports = new Database();