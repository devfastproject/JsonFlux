//? ---------------------> IMPORTACIONES <---------------------------- ?//
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

//? ---------------------> CONFIGURACIÓN INICIAL <---------------------------- ?//
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//? ---------------------> CONFIGURACIÓN DE LA BASE DE DATOS <---------------------------- ?//
const jsonDbManager = require("./json-db-manager/json-db-manager.js");
const path = __dirname + "/DB.json";
const opts = {
    autosave: 15000,  // Guardado automático cada 15 segundos
    logs: true        // Activar logs para seguimiento de operaciones
};
const db = jsonDbManager(path, opts);

//? ---------------------> MIDDLEWARE <---------------------------- ?//
app.use(express.json());

//? ---------------------> CONFIGURACIÓN DE ARGUMENTOS <---------------------------- ?//
const argv = yargs(hideBin(process.argv))
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Puerto en el que correrá el servidor',
        default: 3030
    }).argv;

const PORT = argv.port;

//? ---------------------> RUTA PRINCIPAL <---------------------------- ?//
app.get('/', (req, res) => {
    res.send({ status: 'Active', message: 'Bienvenido a JsonFlux' }).status(200);
});

//? ---------------------> CONFIGURACIÓN DE SOCKET.IO <---------------------------- ?//
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    //! -----> Función auxiliar para operaciones de DB <----- !//
    const handleDbOperation = async (operation, params, callback) => {
        try {
            const result = await db[operation](params.name, ...Object.values(params).slice(1));
            callback(JSON.stringify(result));
        } catch (error) {
            console.error(`Error en operación ${operation}:`, error);
            callback(JSON.stringify({ error: error.message }));
        }
    };

    //! -----> Mapeo de eventos a operaciones de DB <----- !//
    const dbOperations = {
        'addModel': (params, cb) => handleDbOperation('addModel', params, cb),
        'create': (params, cb) => handleDbOperation('create', params, cb),
        'find': (params, cb) => handleDbOperation('find', params, cb),
        'getModel': (params, cb) => handleDbOperation('find', params, cb),
        'update': (params, cb) => handleDbOperation('update', params, cb),
        'destroy': (params, cb) => handleDbOperation('destroy', params, cb),
        'dropModel': (params, cb) => handleDbOperation('drop', params, cb)
    };

    //! -----> Registro de eventos para cada operación <----- !//
    Object.entries(dbOperations).forEach(([event, handler]) => {
        socket.on(event, (rawParams, callback) => {
            const params = JSON.parse(rawParams);
            console.log(`Operación solicitada: ${event}`, params);
            handler(params, callback);
        });
    });

    //! -----> Manejo de desconexión <----- !//
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

//? ---------------------> ENDPOINTS EXPRESS <---------------------------- ?//
const expressOperations = {
    '/addModel': (req, res) => db.addModel(req.body.name, req.body.data),
    '/create': (req, res) => db.create(req.body.name, req.body.data),
    '/find': (req, res) => db.find(req.body.name, req.body.where, req.body.limit),
    '/update': (req, res) => db.update(req.body.name, req.body.search, req.body.data),
    '/destroy': (req, res) => db.destroy(req.body.name, req.body.search),
    '/dropModel': (req, res) => db.drop(req.body.name)
};

//! -----> Creación de rutas POST para cada operación <----- !//
Object.entries(expressOperations).forEach(([path, operation]) => {
    app.post(path, async (req, res) => {
        try {
            const result = await operation(req, res);
            res.json(result);
        } catch (error) {
            console.error(`Error en ruta ${path}:`, error);
            res.status(500).json({ error: error.message });
        }
    });
});

//? ---------------------> INICIO DEL SERVIDOR <---------------------------- ?//
server.listen(PORT, () => {
    console.log(`Servidor JsonFlux iniciado en el puerto ${PORT}`);
    console.log('Esperando conexiones...');
});
