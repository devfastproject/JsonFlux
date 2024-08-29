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

  switch (operation) {
    case 'addModel':
      return db.addModel(name, data);

    case 'create':
      return db.create(name, data);

    case 'find':
      if (param && equal) {
        return db.find(name, {
          where: (data) => data[param] == equal,
          limit: Number(number)
        });
      }
      return db.find(name);

    case 'update':
      let target;
      if (last_search) {
        target = last_search;
      } else if (search && value) {
        target = db.find(name, {
          where: (data) => data[search] == value,
          limit: 1
        })[0];
      }
      return target ? db.update(name, target, data) : null;

    case 'destroy':
      let toDestroy;
      if (last_search) {
        toDestroy = last_search;
      } else if (search && value) {
        toDestroy = db.find(name, {
          where: (data) => data[search] == value,
          limit: 1
        })[0];
      }
      return toDestroy ? db.destroy(name, toDestroy) : null;

    case 'dropModel':
      db.drop(name);
      return { message: `El modelo ${name} ha sido eliminado.` };

    default:
      return null;
  }
};

//? ---------------------> MANEJO DE CONEXIONES SOCKET <---------------------------- ?//

const socketHandler = (socket) => {
  console.log('¡Administrador conectado!');

  const operations = ['addModel', 'create', 'find', 'getModel', 'update', 'destroy', 'dropModel'];
  operations.forEach(operation => {
    socket.on(operation, (params) => {
      const result = handleRequest(operation, JSON.parse(params));
      socket.emit('response', JSON.stringify(result));
    });
  });

  socket.on('disconnect', () => console.log('¡Administrador desconectado!'));
};

io.on('connection', socketHandler);

//? ---------------------> RUTAS HTTP <---------------------------- ?//

app.get('/', (req, res) => res.send({ status: 'Active' }).status(200));

const postHandler = (req, res) => {
  const params = typeof req.body.params === 'object' ? req.body.params : JSON.parse(req.body.params);
  const result = handleRequest(req.path.slice(1), params);
  res.send(JSON.stringify(result));
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
