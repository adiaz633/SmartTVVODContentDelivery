const path = require("path");
const fs = require("fs");

/**
 * Obtiene la ruta relativa al directorio de inicio del cli
 * @param {string} pathLike - ruta
 * @return {string}
 */
const fromCwd = (pathLike) => path.relative(process.cwd(), pathLike);

/**
 * Cambia la extension de la ruta
 *
 * @param {string} pathLike Ruta a cambiar la extensión
 * @return {string} Ruta con la extensión nueva
 */
const changePathExtension = (pathLike, newExtension = ".dev.js") => {
  const originalDirname = path.dirname(pathLike);
  const originalBasename = path.basename(pathLike, path.extname(pathLike));
  const newBasename = `${originalBasename}${newExtension}`;
  return path.resolve(originalDirname, newBasename);
};

/**
 * Cargador de Webpack que reemplaza el contenido de un archivo si encuentra uno
 * con una extension **.dev.js**
 *
 * @param {string | Buffer} source - Contenido del archivo
 */
function replaceLoader(source) {
  const callback = this.async();
  const originalResourcePath = this.resourcePath;
  const replacementResourcePath = changePathExtension(originalResourcePath);
  //
  //  Si existe un archivo que posea el mismo nombre pero con extension .dev.js
  //  se substituye el contenido
  //
  if (fs.existsSync(replacementResourcePath)) {
    fs.readFile(replacementResourcePath, (error, content) => {
      if (error) {
        throw new Error(`replaceLoader: ${error.message} on ${fromCwd(replacementResourcePath)}`);
      }
      console.info(`replaceLoader: Replace ${fromCwd(originalResourcePath)} to ${fromCwd(replacementResourcePath)}`);
      this.addDependency(replacementResourcePath);
      callback(null, content);
    });
  } else {
    // No se necesita substitución
    callback(null, source);
  }
}

module.exports = replaceLoader;
