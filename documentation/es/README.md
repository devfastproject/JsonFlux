# Documentación del Proyecto JsonFlux

## Descripción General

Este proyecto implementa un sistema de base de datos JSON con un servidor y clientes en Python y Node.js. Utiliza Socket.IO para la comunicación en tiempo real entre el servidor y los clientes.

## Componentes del Proyecto

1. Servidor (Node.js)
2. Cliente Python
3. Cliente Node.js

## 1. Servidor

### Tecnologías Utilizadas

- Node.js
- Express
- Socket.IO
- json-db-manager (módulo personalizado para manejar la base de datos JSON)

### Funcionalidades Principales

- Manejo de conexiones Socket.IO
- Operaciones CRUD en la base de datos JSON
- Endpoints HTTP para operaciones de base de datos

### Operaciones Soportadas

1. `addModel`: Añade un nuevo modelo a la base de datos
2. `create`: Crea un nuevo documento en un modelo específico
3. `find`: Busca documentos en un modelo
4. `getModel`: Obtiene todos los documentos de un modelo
5. `update`: Actualiza un documento existente
6. `destroy`: Elimina un documento
7. `dropModel`: Elimina un modelo completo

### Configuración

El servidor se puede configurar mediante argumentos de línea de comandos:

```
node server.js --port 3030
```

## 2. Cliente Python

### Tecnologías Utilizadas

- Python
- python-socketio

### Clase Principal: `DatabaseClient`

#### Métodos

- `connect()`: Conecta al servidor
- `disconnect()`: Desconecta del servidor
- `DB(action, **kwargs)`: Método principal para realizar operaciones en la base de datos

### Uso Básico

```python
from database_client import DB, Types

# Conectar
await DB('connect', url='http://127.0.0.1:3030')

# Añadir un modelo
model_data = {
    "name": Types["STRING"],
    "age": Types["NUMBER"],
    "isActive": Types["BOOLEAN"]
}
await DB('addModel', name="User", data=model_data)

# Crear un documento
user_data = {"name": "John Doe", "age": 30, "isActive": True}
await DB('create', name="User", data=user_data)

# Buscar documentos
result = await DB('find', name="User", param="name", equal="John Doe", number=1)

# Actualizar un documento
await DB('update', name="User", search={"param": "name", "value": "John Doe"}, data={"age": 31})

# Eliminar un documento
await DB('destroy', name="User", search={"param": "name", "value": "John Doe"})

# Eliminar un modelo
await DB('dropModel', name="User")

# Desconectar
await DB('disconnect')
```

## 3. Cliente Node.js

### Tecnologías Utilizadas

- Node.js
- socket.io-client

### Clase Principal: `DatabaseClient`

#### Métodos

- `connect()`: Conecta al servidor
- `disconnect()`: Desconecta del servidor
- `DB(action, params)`: Método principal para realizar operaciones en la base de datos

### Uso Básico

```javascript
const { DatabaseClient, Types } = require('./database_client');

const client = new DatabaseClient('http://152.206.201.225:3030);

async function example() {
  try {
    await db.connect();

    // Añadir un modelo
    const modelData = {
      name: Types.STRING,
      age: Types.NUMBER,
      isActive: Types.BOOLEAN
    };
    await client.DB('addModel', { name: "User", data: modelData });

    // Crear un documento
    const userData = { name: "John Doe", age: 30, isActive: true };
    await client.DB('create', { name: "User", data: userData });

    // Buscar documentos
    const result = await client.DB('find', { name: "User", param: "name", equal: "John Doe", number: 1 });
    console.log(result);

    // Actualizar un documento
    await client.DB('update', { 
      name: "User", 
      search: { param: "name", value: "John Doe" }, 
      data: { age: 31 } 
    });

    // Eliminar un documento
    await client.DB('destroy', { 
      name: "User", 
      search: { param: "name", value: "John Doe" } 
    });

    // Eliminar un modelo
    await client.DB('dropModel', { name: "User" });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

example();
```

## Tipos de Datos

Tanto el cliente Python como el Node.js definen un objeto `Types` con los siguientes tipos de datos:

- `NUMBER`
- `BOOLEAN`
- `STRING`
- `OBJECT`
- `ARRAY`

Estos tipos se utilizan al definir la estructura de los modelos.

## Consideraciones de Seguridad

- Este sistema no incluye autenticación ni autorización. Se recomienda implementar estas características para un uso en producción.
- Las comunicaciones no están cifradas por defecto. Considere usar HTTPS/WSS para conexiones seguras.

## Limitaciones

- La base de datos JSON no es adecuada para grandes volúmenes de datos o operaciones complejas.
- No soporta transacciones ni consultas complejas.

## Mejoras Futuras

- Implementar autenticación y autorización.
- Añadir soporte para consultas más complejas.
- Añadir soporte para relaciones entre modelos.

Esta documentación proporciona una visión general del proyecto y cómo utilizar tanto el servidor como los clientes. Para un uso en producción, se recomienda implementar medidas de seguridad adicionales y considerar las limitaciones mencionadas.
