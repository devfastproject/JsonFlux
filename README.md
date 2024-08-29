# json-db-manager

## Administrador de base de datos basado en json.

## Iniciando el modulo:

```js
const jsonDbManager = require("./json-db-manager.js");

/******************
 *   Iniciando DB  *
 *******************
 * @param String{path}
 * @param Object{opts};
 * @return {self}
 ************/
const path = __dirname + "/datab.json";
const opts = {
  autosave: 5000, //autoguardado de la base de datos en milisegundos
  logs: true, //logos de la base de datos
};
const db = jsonDbManager(path, opts);

const Types = db.Types; //variables de tipados ej: STRING , NUMBER , OBJECT , ARRAY , BOOLEAN

/**********************
 * Añadiendo un Modelo *
 ***********************
 * @param String{modelName}
 * @param Object{opts}
 ***********/
db.addModel("user", {
  id: {
    type: Types.NUMBER, //tipo de dato
    allowNull: false, //permitir ser nulo
    unique: true, //parámetro único
  },
  name: {
    type: Types.STRING,
    allowNull: false,
    unique: true,
  },
  userType: {
    type: Types.STRING,
    default: "regular", //valor por defecto del campo
  },
});

/***********************************
 * Creando una instancia del modelo *
 ************************************
 * @param String{modelName}
 * @param String{}
 * return {null || model}
 *******************/
const u = db.create("user", {
  id: 666,
  name: "Jhon",
});

const u2 = db.create("user", {
  id: 1,
  name: "Doe",
  userType: "admin",
});

console.log(u, u2);
/* output :
    {
        id: 666,
        name: "Jhon",
        userType: "regular"
    }
    {
        id: 1,
        name: "Doe",
        userType: "admin"
    }
*/

/*********************
 *  Buscando Modelos  *
 **********************
 * @param String{modelName}
 * @param {Object}
 * @return {null || Array[models] || Object{model}}
 ***********/
let users = db.find("user", {
  where: (data) => data.userType == "regular", //buscar los modelos donde userType sean igual a regular
  limit: 50, //buscar hasta 50 modelo (devuelve un array de objetos con todos los resultados)
});

console.log(users);
/* Output: 
    [{
        id: 666,
        name: "Jhon",
        userType: "regular"
    }]
*/

let doe = db.find("user", {
  where: (data) => data.name == "Doe",
  limit: 1, //solo buscar un encuentro (devuelve un objeto si encuentra algun resultado)
});

console.log(doe);
/* Output:
    {
        id: 1,
        name: "Doe",
        userType: "admin"
    }
*/

/********************
 * Actualizar Campos *
 *********************
 * @param String{modelName}
 * @param Object{modelToUpdate}
 * @param Object{opts}
 * @return Object{model}
 **********/

for (let us of users) {
  const updtUs = db.update("user", us, {
    userType: "admin",
  });
  if (updtUs) {
    doe = db.update("user", doe, {
      userType: "regular",
    });
  }
}

/*********************************
 * Eliminando instancia de Modelo *
 **********************************
 * @param String{modelName}
 * @param Object{model}
 * @return Boolean
 **************/

db.destroy("user", doe);

users = db.find("user"); //encuentra todos los valores de el modelo

console.log(users);
/* Output:
    [{
        id: 666,
        name: "Jhon",
        userType: "admin"
    }]
*/
```
