import socketio
import json
import threading

class SocketIOClient:
    def __init__(self, server_url):
        self.sio = socketio.Client()
        self.server_url = server_url
        self.response_event = threading.Event()
        self.response_data = None

        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('response', self.on_response)

    def on_connect(self):
        print('Conectado al servidor')

    def on_disconnect(self):
        print('Desconectado del servidor')

    def on_response(self, data):
        print(f'Respuesta del servidor: {data}')
        self.response_data = data
        self.response_event.set()

    def connect(self):
        self.sio.connect(self.server_url)

    def disconnect(self):
        self.sio.disconnect()

    def emit_event(self, event, params):
        self.sio.emit(event, json.dumps(params))
    
    def addModel(self, add_model_params):
        self.response_event.clear()
        self.sio.emit('addModel', json.dumps(add_model_params))
        self.response_event.wait()  
        return json.loads(self.response_data)
        
    def create(self, create_params):
        self.response_event.clear()
        self.sio.emit('create', json.dumps(create_params))
        self.response_event.wait()  
        return json.loads(self.response_data)
        
    def find(self, find_params):
        self.response_event.clear()
        self.sio.emit('find', json.dumps(find_params))
        self.response_event.wait()  
        return json.loads(self.response_data)

    def getModel(self, getModel_params):
        self.response_event.clear()
        self.sio.emit('getModel', json.dumps(getModel_params))
        self.response_event.wait()  
        return json.loads(self.response_data)

    def update(self, update_params):
        self.response_event.clear()
        self.sio.emit('update', json.dumps(update_params))
        self.response_event.wait()  
        return json.loads(self.response_data)

    def destroy(self, destroy_params):
        self.response_event.clear()
        self.sio.emit('destroy', json.dumps(destroy_params))
        self.response_event.wait()  
        return json.loads(self.response_data)
    
    
# Uso de la clase
if __name__ == "__main__":

#---------------------------------------------------------------------------------------------------------------
    Types = {
        'NUMBER': "Number",
        'BOOLEAN': "Boolean",
        'STRING': "String",
        'OBJECT': "Object",
        'ARRAY': "Array"
    }
    server_url = '152.206.201.225:9015'
    db = SocketIOClient(server_url)
    db.connect()

#---------------------------------------------------------------------------------------------------------------

    # Ejemplo de uso para 'addModel'
    add_model_params = {
        'name': 'Usuarios', # Nombre del modelo de datos que crearás
        'data': {
            'username': {
                'type': Types['STRING'], # tipo de dato
                'allowNull': False, # permitir ser nulo (que no tenga ningun valor)
                'unique': True # parámetro único (básicamente que no se puede repetir el valor del parametro)
            }, 
            'id': {
                'type': Types['NUMBER'],
                'allowNull': False, 
                'unique': True
            },
        }
    }
    db.addModel(add_model_params)

#---------------------------------------------------------------------------------------------------------------
    
    # Ejemplo de uso para 'create'
    create_params = {
        'name': 'Usuarios', # Nombre de un modelo de datos que creaste
        'data': {
            'username': 'Pedro', 
            'id': 123456789,
        }
    }
    db.create(create_params)

#---------------------------------------------------------------------------------------------------------------
    
    # Ejemplo de uso para 'find'
    find_params = {
        'name': 'Usuarios', # Nombre de un modelo de datos que creaste
        'param': 'username', # Nombre del parametro para buscar datos (tambien podria ser 'param': 'id')
        'equal': 'Pedro',
        'number': 1 # Numero de resultados que quieres recibir
    }
    db.find(find_params)

#---------------------------------------------------------------------------------------------------------------
    

    # Ejemplo de uso para 'getModel'
    getModel_params = {
        'name': 'Usuarios', # Nombre de un modelo de datos que creaste
    }
    db.getModel(getModel_params)

#---------------------------------------------------------------------------------------------------------------

    # Ejemplo de uso para 'update'
    update_params = {
        'name': 'Usuarios', # Nombre de un modelo de datos que creaste
        'search': { # Poner el id o username para que la BD sepa a que usuario se le actualiará la información
            'value': 'Pedro', # Valor del param
            'param': 'username' # El nombre del param
        }, 
        'data': {
            'username': 'Pedro2.0' # Nuevo valor
        }
    }
    db.update(update_params)

#---------------------------------------------------------------------------------------------------------------
    
    # Ejemplo de uso para 'destory'
    destroy_params = {
        'name': 'Usuarios', # Nombre de un modelo de datos que creaste
        'search': { # Poner el id o username para que la BD sepa que usuario se eliminará
            'value': 'Pedro', # Valor del param
            'param': 'username' # El nombre del param
        }
    }
    db.destroy(destroy_params)

#---------------------------------------------------------------------------------------------------------------