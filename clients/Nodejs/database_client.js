const io = require('socket.io-client');

class DatabaseClient {
  constructor(url) {
    this.socket = io(url);
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Conectado al servidor');
        this.connected = true;
        resolve();
      });
      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    return new Promise((resolve) => {
      this.socket.disconnect();
      this.socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        this.connected = false;
        resolve();
      });
    });
  }

  DB(operation, params) {
    return new Promise((resolve, reject) => {
      if (!this.connected && operation !== 'connect') {
        reject(new Error('No conectado al servidor'));
        return;
      }

      this.socket.emit(operation, JSON.stringify(params));
      this.socket.once('response', (data) => {
        resolve(JSON.parse(data));
      });
    });
  }
}

const Types = {
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  STRING: "String",
  OBJECT: "Object",
  ARRAY: "Array",
};

module.exports = { DatabaseClient, Types };
