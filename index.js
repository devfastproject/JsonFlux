//? ---------------------> IMPORTACIONES <---------------------------- ?//
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const yargs = require('yargs/yargs'); 
const { hideBin } = require('yargs/helpers'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//? ---------------------> DB CONFIG <---------------------------- ?//
const jsonDbManager = require("./json-db-manager/json-db-manager.js");
const path = __dirname + "/DB.json";
const opts = {
    autosave: 15000, 
    logs: true 
};
const db = jsonDbManager(path, opts);

app.use(express.json());

//? ---------------------> YARGS CONFIG <---------------------------- ?//
const argv = yargs(hideBin(process.argv)).option('port', {
  alias: 'p',
  type: 'number',
  description: 'Puerto en el que correrá el servidor',
  default: 3030 
}).argv;

const PORT = argv.port;

//? ---------------------> RUTAS EXPRESS <---------------------------- ?//
app.get('/', (req, res) => {
  res.send({ status: 'Active' }).status(200);
});

//? ---------------------> SOCKET.IO HANDLERS <---------------------------- ?//
io.on('connection', (socket) => {
  console.log('¡Administrador conectado!');

  //? -----> Añadir Modelo <----- //
  socket.on('addModel', (params) => {
    params = JSON.parse(params);
    console.log(params);
    db.addModel(params.name, params.data);
    socket.emit('response', JSON.stringify({ message: 'The new model has been created.' }));
  });

  //? -----> Crear Elemento <----- //
  socket.on('create', (params) => {
    params = JSON.parse(params);
    console.log(params);
    const new_element = db.create(params.name, params.data);
    socket.emit('response', JSON.stringify(new_element));
  });

  //? -----> Encontrar Elemento <----- //
  socket.on('find', (params) => {
    params = JSON.parse(params);
    console.log(params);
    let users = db.find(params.name, {
      where: (data) => data[params.param] == params.equal,
      limit: Number(params.number)
    });
    socket.emit('response', JSON.stringify(users));
  });

  //? -----> Obtener Modelo <----- //
  socket.on('getModel', (params) => {
    params = JSON.parse(params);
    console.log(params);
    let users = db.find(params.name);
    console.log(users)
    socket.emit('response', JSON.stringify(users));
  });

  //? -----> Actualizar Elemento <----- //
  socket.on('update', (params) => {
    params = JSON.parse(params);
    console.log(params);
    let user = db.find(params.name, {
      where: (data) => data[params.search.param] == params.search.value,
      limit: 1
    });
    const updtUs = db.update(params.name, user, params.data);
    socket.emit('response', JSON.stringify(updtUs));
  });

  //? -----> Eliminar Elemento <----- //
  socket.on('destroy', (params) => {
    params = JSON.parse(params);
    console.log(params);
    let user = db.find(params.name, {
      where: (data) => data[params.search.param] == params.search.value,
      limit: 1
    });
    const destroy = db.destroy(params.name, user);
    socket.emit('response', JSON.stringify(destroy));
  });

  //? -----> Eliminar Modelo <----- //
  socket.on('dropModel', (params) => {
    params = JSON.parse(params);
    console.log(`Eliminando modelo: ${params.name}`);
    db.drop(params.name);
    socket.emit('response', JSON.stringify({ message: `El modelo ${params.name} ha sido eliminado.` }));
  });

  socket.on('disconnect', () => {
    console.log('¡Administrador desconectado!');
  });
});

//? ---------------------> EXPRESS POST ENDPOINTS <---------------------------- ?//

app.post('/addModel', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  const new_model = db.addModel(params.name, params.data);
  res.send(JSON.stringify(new_model));
});

app.post('/create', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  const new_element = db.create(params.name, params.data);
  res.send(JSON.stringify(new_element));
});

app.post('/find', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  let users = db.find(params.name, {
    where: (data) => data[params.param] == params.equal,
    limit: Number(params.number)
  });
  res.send(JSON.stringify(users));
});

app.post('/update', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  const updtUs = db.update(params.name, params.last_search, params.data);
  res.send(JSON.stringify(updtUs));
});

app.post('/destroy', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  const destroy = db.destroy(params.name, params.last_search);
  res.send(JSON.stringify(destroy));
});

//? -----> Nueva ruta POST para eliminar modelo <----- //
app.post('/dropModel', (req, res) => {
  const params = typeof req.body.params === 'object' || typeof req.body.params === 'array' ? req.body.params : JSON.parse(req.body.params);
  db.drop(params.name);
  res.send(JSON.stringify({ message: `El modelo ${params.name} ha sido eliminado.` }));
});

//? -----> Iniciar Servidor <----- //
server.listen(PORT, () => {
  console.log(`Servidor Express y Socket.IO iniciado en el puerto ${PORT}`);
});
