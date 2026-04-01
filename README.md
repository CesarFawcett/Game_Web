# Card Battle Universe - Documentacion del Proyecto

Card Battle Universe es una plataforma avanzada de duelos de cartas coleccionables desarrollada con el stack MERN (MongoDB, Express, React, Node.js). El proyecto integra mecanicas de combate en tiempo real, un sistema de progresion en modo historia y herramientas administrativas completas para la gestion de activos.

---

## Funcionalidades Principales

### Sistema de Duelo Dinamico
Campo de batalla de tres slots con sincronizacion en tiempo real. Incluye fases detalladas de juego: determinacion de turno mediante Piedra-Papel-Tijera, fases principales (Main) y fases de batalla.

### Modo Historia
Sistema de progresion donde el jugador enfrenta enemigos unicos con mazos personalizados, obteniendo recompensas como creditos, nuevos avatares y cartas al obtener la victoria.

### Habilidades Especiales de Cartas
Logica de combate extendida que incluye efectos como:
- Fuego: Daño de area (splash) a monstruos adyacentes.
- Hielo: Congelacion del objetivo por turnos limitados.
- Veneno: Reduccion persistente de defensa enemiga.
- Robo de Vida: Incremento de estadisticas tras ataques exitosos.
- Daño Perforante: Transferencia de exceso de daño directamente a los puntos de vida del rival.

### Gestion de Cuenta y Persistencia
Pantalla de inicio rediseñada con opcion de recordado de credenciales mediante almacenamiento local para un acceso rapido en sesiones futuras.

### Panel de Administracion
Portal seguro para la gestion total del ecosistema del juego:
- Creacion y edicion de cartas y packs.
- Configuracion de enemigos del modo historia.
- Gestion de texturas de tableros y fondos dinamicos.

---

## Arquitectura Tecnica

- **Frontend**: Desarrollado con React y Vite. Gestion de estado global mediante Zustand y animaciones de alta fidelidad con Framer Motion. Comunicación en tiempo real via Socket.io-client.
- **Backend**: Servidor Node.js con Express. Orquestación de duelos PvP mediante un DuelManager centralizado y WebSockets.
- **Base de Datos**: MongoDB para el almacenamiento persistente de usuarios, colecciones y registros de juego.
- **Infraestructura**: Despliegue simplificado mediante Docker y Docker Compose para la orquestacion de contenedores.

---

## Guia de Instalacion y Ejecucion

### Requisitos Previos
- Docker instalado en el sistema.
- Docker Compose.

### Procedimiento de Ejecucion
1. Abra una terminal en el directorio raiz del proyecto (Game_Web).
2. Ejecute el siguiente comando para construir e iniciar los servicios:
   ```bash
   docker-compose up --build
   ```
3. Acceda a la aplicacion en su navegador mediante la direccion: `http://localhost:5173`

---

## Estructura del Proyecto

```text
Game_Web/
├── backend/           # API, Modelos y Logica de Duelos (Socket.io)
├── frontend/          # Aplicacion React, Stores de Zustand y Componentes
├── uploads/           # Almacenamiento de imagenes de cartas y avatares
├── docker-compose.yml # Configuracion de orquestacion de contenedores
└── README.md          # Documentacion tecnica del sistema
```

---

## Credenciales Administrativas Predeterminadas
Para acceder a las funciones de gestion, utilice los siguientes datos en la pantalla de inicio:
- **Usuario**: Admin
- **Contraseña**: 123
- **Acceso**: Una vez iniciada la sesion, la pestaña de Administracion aparecera en la barra de navegacion superior (solo para roles administrativos).

---

*Proyecto diseñado para la escalabilidad y el alto rendimiento en entornos de juego competitivo.*
