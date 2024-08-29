import socketio
import json
import asyncio
from logger_config import logger

class DB:
    sio = socketio.AsyncClient()
    connected = False
    
    @classmethod
    async def __call__(cls, operation, **kwargs):
        if operation == 'connect':
            if not cls.connected:
                logger.info(f"Conectando a {kwargs['url']}...")
                await cls.sio.connect(kwargs['url'])
                cls.connected = True
                logger.warning("Conectado al servidor")
            return
        
        if operation == 'disconnect':
            if cls.connected:
                logger.info("Desconectando del servidor...")
                await cls.sio.disconnect()
                cls.connected = False
                logger.warning("Desconectado del servidor")
            return

        if not cls.connected:
            logger.error("No conectado al servidor")
            raise Exception("Not connected to server")

        params = json.dumps(kwargs)
        future = asyncio.get_event_loop().create_future()

        @cls.sio.on('response')
        def on_response(data):
            logger.debug(f"Respuesta recibida: {data}")
            future.set_result(json.loads(data))
            cls.sio.off('response')

        logger.info(f"Enviando operación {operation} con parámetros: {params}")
        await cls.sio.emit(operation, params)
        return await future

Types = {
    "NUMBER": "Number",
    "BOOLEAN": "Boolean",
    "STRING": "String",
    "OBJECT": "Object",
    "ARRAY": "Array",
}
