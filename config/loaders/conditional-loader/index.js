const { hasTags, compile } = require("./compiler");

/**
 * Cargador de Webpack que elimina el contenido que este entre las etiquetas
 * @example
 * // #IF VARIABLE
 * console.warn("si")
 * // #ENDIF
 *
 * // si process.env.VARIABLE esta definida se muestra el contenido
 * // si NO esta definida se elimina el contenido que está entre las
 * // etiquetas
 *
 * @param {string | Buffer} source - Contenido del archivo
 */
function conditionalLoader(source) {
  const callback = this.async();
  const logger = this.getLogger();

  //
  // Si tiene las etiquetas de compilacion ejecutar el compilador
  //
  if (hasTags(source)) {
    logger.info("Conditional content");
    try {
      const content = compile(source, process.env);
      callback(null, content);
    } catch (error) {
      callback(error);
    }
  } else {
    // No se necesita substitución
    callback(null, source);
  }
}

module.exports = conditionalLoader;
