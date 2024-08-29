# DBSocketClient

## Cliente de una base de datos con Json usando socket.io en nodejs

## Iniciando el módulo:

```js
const DBSocketClient = require("./client.js");

/******************
 *   Iniciando Cliente  *
 *******************
 * @param String{server_url}
 * @return {self}
 ************/
const server_url = "http://localhost:3000";
const client = new DBSocketClient(server_url);

/**********************
 * Añadiendo un Modelo *
 ***********************
 * @param Object{add_model_params}
 * @return Promise{response}
 ***********/
const add_model_params = {
  id: 666,
  name: "Jhon",
};
client.addModel(add_model_params).then((response) => {
  console.log(response);
});

/***********************************
 * Creando una instancia del modelo *
 ************************************
 * @param Object{create_params}
 * return Promise{response}
 *******************/
const create_params = {
  id: 1,
  name: "Doe",
  userType: "admin",
};
client.create(create_params).then((response) => {
  console.log(response);
});

/*********************
 *  Buscando Modelos  *
 **********************
 * @param Object{find_params}
 * @return Promise{response}
 ***********/
const find_params = {
  userType: "regular",
};
client.find(find_params).then((response) => {
  console.log(response);
});

/********************
 * Actualizar Campos *
 *********************
 * @param Object{update_params}
 * @return Promise{response}
 **********/
const update_params = {
  id: 666,
  userType: "admin",
};
client.update(update_params).then((response) => {
  console.log(response);
});

/*********************************
 * Eliminando instancia de Modelo *
 **********************************
 * @param Object{destroy_params}
 * @return Promise{response}
 **************/
const destroy_params = {
  id: 1,
};
client.destroy(destroy_params).then((response) => {
  console.log(response);
});
```
