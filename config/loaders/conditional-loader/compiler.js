/**
 * Verifica si el contenido de un archivo tiene etiquetas condicionales
 *
 * @param {string} source contenido del archivo
 * @returns {boolean} true si hay etiquetas condicionales
 */
function hasTags(source) {
  return /^\s*\/\/\s+#IF/i.test(source);
}

/**
 * Evalua una linea para verificar si es un #IF.
 * si la variable esta definida no ignora el contenido
 *
 * @param {string} line Linea a evaluar
 * @param {Object.<string,any>} env environment values
 * @returns {boolean} true si el bloque se debe ignorar porque la variable no
 * está definida
 *
 * @example
 * // #IF NOMBRE_VARIABLE
 *
 * @summary
 * NOMBRE_VARIABLE debe estar definido en {@link env}
 */
function evaluateIf(line, env = {}) {
  const regexp = /^\s*\/\/\s+#IF\s(.+)$/i;
  const match = regexp.exec(line);
  if (match) {
    const key = match[1];
    const value = env[`${key}`];
    return typeof value === "undefined";
  }
  return false;
}

/**
 * Evalua si se esta cerrando un #IF
 *
 * @param {string} line Linea a evaluar
 * @returns {boolean} true si {@link line} contiene un #ENDIF
 */
function evaluateEndIf(line) {
  return /^\s*\/\/\s+#ENDIF\s*$/i.test(line);
}

/**
 * Compila el contenido
 *
 * @param {string} source contenido a evaluar
 * @param {Object.<string,any> | undefined} env environment values
 * @returns {string} contenido sin el contenido entre #IF / #ENDIF
 */
function compile(source, env) {
  const comp = source;
  const result = [];
  let itMustToIgnoreLine = false;

  const lines = comp.split(/\n/);
  for (const line of lines) {
    if (!itMustToIgnoreLine && evaluateIf(line, env)) {
      itMustToIgnoreLine = true;
      continue;
    }

    if (itMustToIgnoreLine && evaluateEndIf(line)) {
      itMustToIgnoreLine = false;
      continue;
    }

    if (!itMustToIgnoreLine) {
      result.push(line);
    }
  }

  if (itMustToIgnoreLine) {
    throw new Error("Syntax error missing #ENDIF");
  }

  return result.join("\n");
}

module.exports = {
  hasTags,
  compile,
  evaluateEndIf,
  evaluateIf,
};
