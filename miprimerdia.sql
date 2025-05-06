-- Creación de la base de datos

DROP DATABASE IF EXISTS miprimerdia;
CREATE DATABASE miprimerdia;
USE miprimerdia;

-- 1. Primero tablas independientes

CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(50),
    fecha_nacimiento DATE,
    fecha_de_alta DATE DEFAULT (CURRENT_DATE),
    fecha_ultima_contratacion DATE,
    CONSTRAINT chk_contacto CHECK (email IS NOT NULL OR telefono IS NOT NULL)
);

CREATE TABLE TiposServicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tiene_tabla_especifica BOOLEAN DEFAULT FALSE
);

CREATE TABLE TiposCaja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Tablas que dependen de las anteriores

CREATE TABLE Bebes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    lugar_nacimiento VARCHAR(100),
    genero ENUM('masculino', 'femenino'),
    direccion_familiar TEXT,
    codigo_postal_familiar VARCHAR(10),
    ciudad_familiar VARCHAR(50),
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(100),
    nombre_padre VARCHAR(100),
    apellidos_padre VARCHAR(100),
    fecha_nacimiento_padre DATE,
    nombre_madre VARCHAR(100),
    apellidos_madre VARCHAR(100),
    fecha_nacimiento_madre DATE,
    fecha_nacimiento_hermanos TEXT
);

CREATE TABLE Servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_tipo_servicio INT NOT NULL,
    fecha_contratacion DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_evento DATE,
    estado ENUM('pendiente', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
    notas_cliente TEXT,
    observaciones_internas TEXT,
    precio_total DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_servicio) REFERENCES TiposServicio(id)
);

-- 3. Última tabla (depende de varias)

CREATE TABLE Cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT NOT NULL,
    id_tipo_caja INT NOT NULL,
    id_bebe INT NOT NULL,
    numero_caja VARCHAR(20) NOT NULL UNIQUE,
    total_cajas_contratadas INT NOT NULL DEFAULT 1,
    personalizacion TEXT,
    fecha_entrega DATE,
    estado ENUM('pendiente', 'preparada', 'entregada', 'cancelada') DEFAULT 'pendiente',
    precio_final DECIMAL(10,2),
    FOREIGN KEY (id_servicio) REFERENCES Servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_caja) REFERENCES TiposCaja(id),
    FOREIGN KEY (id_bebe) REFERENCES Bebes(id),
    CONSTRAINT chk_numero_caja_valido CHECK (numero_caja REGEXP '^[A-Za-z0-9\-]+$')
);

-- 4. Datos iniciales

INSERT INTO TiposServicio (nombre, descripcion, tiene_tabla_especifica) VALUES 
('Caja', 'Servicio de caja para recién nacidos', TRUE),
('Evento corporativo', 'Organización de eventos para empresas', TRUE),
('Evento colegio', 'Eventos educativos y escolares', TRUE),
('Evento familiar', 'Celebraciones familiares', TRUE),
('Alquiler', 'Alquiler de equipos o espacios', FALSE),
('Proveedor', 'Servicios de proveedores externos', FALSE);

INSERT INTO TiposCaja (nombre, descripcion, precio) VALUES
('Caja Clásica', 'Incluye productos esenciales para el recién nacido', 90.00),
('Caja Emotiva', 'Incluye productos de alta calidad y algunos artículos adicionales', 120.00),
('Caja Sol y Luna', 'Incluye productos esenciales para el recién nacido', 145.00),
('Caja Candilejas', 'Productos premium, personalización y artículos exclusivos', 175.00),
('Caja Mágica', 'Incluye productos esenciales para el recién nacido', 195.00),
('Caja Fashion', 'Incluye productos esenciales para el recién nacido', 245.00);

-- 5. Vista (se crea al final)

CREATE VIEW VistaCajasCompleta AS
SELECT 
    c.numero_caja,
    tc.nombre AS tipo_caja,
    tc.precio AS precio_base,
    c.precio_final,
    b.nombre AS nombre_bebe,
    b.apellidos AS apellidos_bebe,
    b.fecha_nacimiento AS fecha_nacimiento_bebe,
    b.direccion_familiar,
    b.codigo_postal_familiar,
    b.ciudad_familiar
FROM 
    Cajas c
JOIN 
    TiposCaja tc ON c.id_tipo_caja = tc.id
JOIN 
    Servicios s ON c.id_servicio = s.id
JOIN 
    Bebes b ON c.id_bebe = b.id;