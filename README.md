# Crónicas del Abismo — Android

Cliente Android del prototipo LAN original (HTML5 + Node.js). El APK **no incluye servidor**: para jugar, iniciá `server.js` en tu PC, conectá el teléfono a la misma red y escribí la IP local de la PC, por ejemplo `192.168.1.15:8080`.

- Paisaje y pantalla completa
- WebView con JavaScript, DOM Storage, audio, controles táctiles y posibilidad de mandos
- Conexión HTTP/WebSocket LAN solamente a direcciones IPv4 privadas
- Permiso INTERNET, sin acceso a archivos privados del teléfono
- Botón de volver a la pantalla de conexión

## Compilar

El workflow de GitHub Actions **Compilar APK Android** crea un APK de pruebas firmado con la clave de depuración de Android. Descargalo en Actions → última ejecución → Artifacts → **Cronicas_del_Abismo_APK**.

## PC anfitriona

El ZIP previo de Crónicas del Abismo contiene el servidor original en la carpeta `SERVIDOR_PC`; en esa carpeta iniciá `INICIAR_SERVIDOR.bat`. Si Windows pregunta, permití el acceso de red privada al puerto 8080. No publiques ese servidor de pruebas en Internet.

**Estado:** primer prototipo 2.5D; no es todavía el juego 3D definitivo.
