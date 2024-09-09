const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const jsonDbManager = require("./json-db-manager/json-db-manager.js");

//? ---------------------> CONFIGURACIÓN DE ARGUMENTOS <---------------------------- ?//

const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Puerto en el que correrá el servidor',
    default: 3030
  })
  .option('autosave', {
    alias: 'a',
    type: 'number',
    description: 'Intervalo de autoguardado de la base de datos (en milisegundos)',
    default: 15000
  })
  .option('logs', {
    alias: 'l',
    type: 'boolean',
    description: 'Habilitar logs de la base de datos',
    default: true
  })
  .argv;

//? ---------------------> CONFIGURACIÓN INICIAL <---------------------------- ?//

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Inicialización de la base de datos JSON
const db = jsonDbManager(__dirname + "/DB.json", { autosave: argv.autosave, logs: argv.logs });

app.use(express.json());

//? ---------------------> MANEJO DE SOLICITUDES <---------------------------- ?//

const handleRequest = (operation, params) => {
  const { name, data, param, equal, number, search, value, last_search } = params;

  try {
    switch (operation) {
      case 'addModel':
        db.addModel(name, data.length === 1 ? data[0] : data);
        return { message: 'Modelo agregado' };

      case 'create':
        const result = db.create(name, data.length === 1 ? data[0] : data);
        return typeof result === 'object' ? result : { message: result };

      case 'find':
        return param && equal 
          ? db.find(name, { where: (data) => data[param] == equal, limit: Number(number) }) 
          : db.find(name);

      case 'update':
        const target = last_search || (search && db.find(name, {
          where: (data) => data[search.param] == search.value,
          limit: 1
        }));
        return target ? db.update(name, target, data.length === 1 ? data[0] : data) : null;

      case 'destroy':
        const toDestroy = last_search || (search && value && db.find(name, {
          where: (data) => data[search] == value,
          limit: 1
        })[0]);
        return toDestroy ? db.destroy(name, toDestroy) : null;

      case 'dropModel':
        db.drop(name);
        return { message: `El modelo ${name} ha sido eliminado.` };

      default:
        return { error: 'Operación no válida' };
    }
  } catch (error) {
    console.error(`Error en operación ${operation}:`, error);
    return { error: `Error en operación ${operation}: ${error.message}` };
  }
};

//? ---------------------> MANEJO DE CONEXIONES SOCKET <---------------------------- ?//

const socketHandler = (socket) => {
  console.log('¡Administrador conectado!');
  
  const operations = ['addModel', 'create', 'find', 'getModel', 'update', 'destroy', 'dropModel'];
  
  operations.forEach(operation => {
    socket.on(operation, (params) => {
      try {
        const parsedParams = JSON.parse(params);
        const result = handleRequest(operation, parsedParams);
        socket.emit('response', JSON.stringify(result));
      } catch (error) {
        socket.emit('response', JSON.stringify({ error: `Error al procesar la solicitud: ${error.message}` }));
      }
    });
  });

  socket.on('disconnect', () => console.log('¡Administrador desconectado!'));
};

io.on('connection', socketHandler);

//? ---------------------> RUTAS HTTP <---------------------------- ?//

app.get('/', (req, res) => res.status(200).send({ status: 'Active' }));

const postHandler = (req, res) => {
  try {
    const params = typeof req.body.params === 'object' ? req.body.params : JSON.parse(req.body.params);
    const result = handleRequest(req.path.slice(1), params);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: `Error al procesar la solicitud: ${error.message}` });
  }
};

['addModel', 'create', 'find', 'update', 'destroy', 'dropModel'].forEach(operation => {
  app.post(`/${operation}`, postHandler);
});

//? ---------------------> INICIO DEL SERVIDOR <---------------------------- ?//

server.listen(argv.port, () => {
  console.log(`Servidor JsonFlux iniciado en el puerto ${argv.port}`);
  console.log(`Autosave configurado a ${argv.autosave} ms`);
  console.log(`Logs ${argv.logs ? 'habilitados' : 'deshabilitados'}`);
});
