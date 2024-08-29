const io = require('socket.io-client');
const EventEmitter = require('events');

class DBSocketClient extends EventEmitter {
    constructor(server_url) {
        super();
        this.sio = io(server_url);
        this.server_url = server_url;

        this.sio.on('connect', () => this.emit('connect'));
        this.sio.on('disconnect', () => this.emit('disconnect'));
        this.sio.on('response', (data) => this.emit('response', data));
    }

    emit_event(event, params) {
        this.sio.emit(event, JSON.stringify(params));
    }

    addModel(add_model_params) {
        return new Promise((resolve) => {
            this.sio.emit('addModel', JSON.stringify(add_model_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }

    create(create_params) {
        return new Promise((resolve) => {
            this.sio.emit('create', JSON.stringify(create_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }

    find(find_params) {
        return new Promise((resolve) => {
            this.sio.emit('find', JSON.stringify(find_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }

    getModel(getModel_params) {
        return new Promise((resolve) => {
            this.sio.emit('getModel', JSON.stringify(getModel_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }

    update(update_params) {
        return new Promise((resolve) => {
            this.sio.emit('update', JSON.stringify(update_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }

    destroy(destroy_params) {
        return new Promise((resolve) => {
            this.sio.emit('destroy', JSON.stringify(destroy_params), (data) => {
                resolve(JSON.parse(data));
            });
        });
    }
}

module.exports = DBSocketClient