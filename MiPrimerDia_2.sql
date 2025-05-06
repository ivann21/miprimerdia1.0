-- Creación de la base de datos
DROP DATABASE IF EXISTS miprimerdia;
CREATE DATABASE miprimerdia;
USE miprimerdia;

-- Tabla de Clientes (quien contrata el servicio)
CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(50),
    fecha_nacimiento DATE,
    fecha_de_alta DATE DEFAULT CURRENT_DATE,
    fecha_ultima_contratacion DATE,
    CONSTRAINT chk_contacto CHECK (email IS NOT NULL OR telefono IS NOT NULL)
);

-- Tabla de Tipos de Servicio
CREATE TABLE TiposServicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tiene_tabla_especifica BOOLEAN DEFAULT FALSE
);

-- Tabla principal de Servicios
CREATE TABLE Servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_tipo_servicio INT NOT NULL,
    fecha_contratacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_evento DATE,
    estado ENUM('pendiente', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
    notas_cliente TEXT,
    observaciones_internas TEXT,
    precio_total DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_servicio) REFERENCES TiposServicio(id)
);

-- Tabla de Tipos de Caja
CREATE TABLE TiposCaja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Bebés con todos los datos familiares incluidos
CREATE TABLE Bebes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Datos del bebé
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    lugar_nacimiento VARCHAR(100),
   -- peso_nacimiento DECIMAL(5,2),
   -- talla_nacimiento INT,
    genero ENUM('masculino', 'femenino'),
    
    -- Datos de la familia
    direccion_familiar TEXT,
    codigo_postal_familiar VARCHAR(10),
    ciudad_familiar VARCHAR(50),
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(100),
    
    -- Datos del padre
    nombre_padre VARCHAR(100),
    apellidos_padre VARCHAR(100),
    fecha_nacimiento_padre DATE,
    
    -- Datos de la madre
    nombre_madre VARCHAR(100),
    apellidos_madre VARCHAR(100),
    fecha_nacimiento_madre DATE,
    
    -- Datos de hermanos (como JSON para flexibilidad)
    fecha_nacimiento_hermanos TEXT
);

-- Tabla de Cajas (relacionada con bebé)
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

-- Tablas de Eventos (corporativos, colegio, familiares) se mantienen igual
-- ... [las tablas de eventos que ya teníamos anteriormente]

-- Insertar datos iniciales
INSERT INTO TiposServicio (nombre, descripcion, tiene_tabla_especifica) VALUES 
('Caja', 'Servicio de caja para recién nacidos', TRUE),
('Evento corporativo', 'Organización de eventos para empresas', TRUE),
('Evento colegio', 'Eventos educativos y escolares', TRUE),
('Evento familiar', 'Celebraciones familiares', TRUE),
('Alquiler', 'Alquiler de equipos o espacios', FALSE),
('Proveedor', 'Servicios de proveedores externos', FALSE);

INSERT INTO TiposCaja (nombre, descripcion, precio) VALUES
('Caja Básica', 'Incluye productos esenciales para el recién nacido', 50.00),
('Caja Premium', 'Incluye productos de alta calidad y algunos artículos adicionales', 85.00),
('Caja Deluxe', 'Productos premium, personalización y artículos exclusivos', 120.00);

-- Vista para información completa de cajas con todos los datos
CREATE VIEW VistaCajasCompleta AS
SELECT 
    c.numero_caja,
    tc.nombre AS tipo_caja,
    tc.precio AS precio_base,
    c.precio_final,
    -- Datos del bebé
    b.nombre AS nombre_bebe,
    b.apellidos AS apellidos_bebe,
    b.fecha_nacimiento AS fecha_nacimiento_bebe,
    -- Datos familiares
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