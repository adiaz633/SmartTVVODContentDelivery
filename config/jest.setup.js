//
//  Archivo de puesta en marcha del JEST. aqui se ajustan valores de
//  inicialización de las pruebas.
//
const path = require("path");
const dotenv = require("dotenv");

//
//  Cargar información de variables de entorno
//
const { parsed } = dotenv.config({
  path: path.resolve(process.cwd(), "config/.env"),
});

//
//  Variables globales
//
global.CONFIG_ENV = {
  ...parsed,
};

global.$ = () => ({
  show: jest.fn(),
});

//
//  Hacer mock de las funciones de consola para poder utilizarlas en las pruebas
//
["warn", "log", "info", "error", "debug"].forEach((key) => {
  jest.spyOn(console, key).mockImplementation(() => undefined);
});
