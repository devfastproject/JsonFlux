# JSON Database Project Documentation

## Overview

This project implements a JSON database system with a server and clients in Python and Node.js. It uses Socket.IO for real-time communication between the server and clients.

## Project Components

1. Server (Node.js)
2. Python Client
3. Node.js Client

## 1. Server

### Technologies Used

- Node.js
- Express
- Socket.IO
- json-db-manager (custom module for handling JSON database)

### Main Functionalities

- Handling Socket.IO connections
- CRUD operations on JSON database
- HTTP endpoints for database operations

### Supported Operations

1. `addModel`: Adds a new model to the database
2. `create`: Creates a new document in a specific model
3. `find`: Searches for documents in a model
4. `getModel`: Retrieves all documents from a model
5. `update`: Updates an existing document
6. `destroy`: Deletes a document
7. `dropModel`: Deletes an entire model

### Configuration

The server can be configured using command-line arguments:

```
node server.js --port 3030 --logs true --autosave 15000
```

## 2. Python Client

### Technologies Used

- Python
- python-socketio

### Main Class: `DatabaseClient`

#### Methods

- `connect()`: Connects to the server
- `disconnect()`: Disconnects from the server
- `DB(action, **kwargs)`: Main method for performing database operations

### Basic Usage

```python
import asyncio
from database_client import execute, Types, connect, disconnect


async def main():
    # Conectar
    await connect("http://127.0.0.1:3030")

    # Añadir un modelo
    model_data = {
        "name": {
            "type": Types["STRING"],
            "allowNull": False,
            "unique": True,
        },
        "age": {
            "type": Types["NUMBER"],
            "allowNull": False,
            "unique": True,
        },
        "isActive": {
            "type": Types["BOOLEAN"],
            "allowNull": False,
            "unique": True,
        },
    }
    await execute("addModel", name="UserTest", data=model_data)

    # Crear un documento
    user_data = {"name": "John Doe", "age": 30, "isActive": True}
    await execute("create", name="UserTest", data=user_data)

    # Buscar documentos
    result = await execute(
        "find", name="UserTest", param="name", equal="John Doe", number=1
    )

    # Actualizar un documento
    if result:
        print("Se ejecutó")
        await execute("update", name="UserTest", last_search=result, data={"age": 31})
    else:
        await execute(
            "update",
            name="UserTest",
            search={"param": "name", "value": "John Doe"},
            data={"age": 31},
        )

    # Eliminar un documento
    await execute(
        "destroy", name="UserTest", search={"param": "name", "value": "John Doe"}
    )

    # Eliminar un modelo
    await execute("dropModel", name="UserTest")

    # Desconectar
    await disconnect()


asyncio.run(main())
```

## 3. Node.js Client

### Technologies Used

- Node.js
- socket.io-client

### Main Class: `DatabaseClient`

#### Methods

- `connect()`: Connects to the server
- `disconnect()`: Disconnects from the server
- `DB(action, params)`: Main method for performing database operations

### Basic Usage

```javascript
const { DatabaseClient, Types } = require('./database_client');

const client = new DatabaseClient('http://127.0.0.1:3030');

async function example() {
  try {
    await client.connect();

    // Añadir un modelo
    const modelData = {
      name: {
        type: Types.STRING,
        allowNull: false,
        unique: true
      },
      age: {
        type: Types.NUMBER,
        allowNull: false,
        unique: false
      },
      isActive: {
        type: Types.BOOLEAN,
        allowNull: false,
        unique: false
      }
    };
    await client.DB('addModel', { name: "User", data: modelData });

    // Crear un documento
    const userData = { name: "John Doe", age: 30, isActive: true };
    await client.DB('create', { name: "User", data: userData });

    // Buscar documentos
    const result = await client.DB('find', { name: "User", param: "name", equal: "John Doe", number: 1 });
    console.log(result);

    // Actualizar un documento
    if (result) {
        await client.DB('update', { 
          name: "User", 
          last_search: result,
          data: { age: 31 } 
        });
    } else {
        await client.DB('update', { 
          name: "User", 
          search: { param: "name", value: "John Doe" }, 
          data: { age: 31 } 
        });
    }

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

## Data Types

Both Python and Node.js clients define a `Types` object with the following data types:

- `NUMBER`
- `BOOLEAN`
- `STRING`
- `OBJECT`
- `ARRAY`

These types are used when defining model structures.

## Security Considerations

- This system does not include authentication or authorization. It is recommended to implement these features for production use.
- Communications are not encrypted by default. Consider using HTTPS/WSS for secure connections.

## Limitations

- The JSON database is not suitable for large volumes of data or complex operations.
- It does not support transactions or complex queries.

## Future Improvements

- Implement authentication and authorization.
- Add support for more complex queries.
- Add support for relationships between models.

This documentation provides an overview of the project and how to use both the server and clients. For production use, it is recommended to implement additional security measures and consider the mentioned limitations.
