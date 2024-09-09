import socketio
import json
import asyncio
from loguru import logger

sio = socketio.AsyncClient()
connected = False


async def connect(url):
    global connected
    if not connected:
        logger.info(f"Conectando a {url}...")
        await sio.connect(url)
        connected = True
        logger.warning("Conectado al servidor")


async def disconnect():
    global connected
    if connected:
        logger.info("Desconectando del servidor...")
        await sio.disconnect()
        connected = False
        logger.warning("Desconectado del servidor")


async def execute(operation, **kwargs):
    global connected
    if not connected:
        logger.error("No conectado al servidor")
        raise Exception("Not connected to server")

    params = json.dumps(kwargs)
    future = asyncio.get_event_loop().create_future()

    @sio.on("response")
    def on_response(data):
        logger.debug(f"Respuesta recibida: {data}")
        future.set_result(json.loads(data))

    logger.info(f"Enviando operación {operation} con parámetros: {params}")
    await sio.emit(operation, params)
    return await future


Types = {
    "NUMBER": "Number",
    "BOOLEAN": "Boolean",
    "STRING": "String",
    "OBJECT": "Object",
    "ARRAY": "Array",
}
