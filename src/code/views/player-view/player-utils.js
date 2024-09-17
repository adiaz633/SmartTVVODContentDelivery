import i18next from "i18next";

export async function NO_FUNCTION() {
  return null;
}

/**
 * Anotacion que permite invocar una funcion una sola vez
 *
 * @param {Function} TFunction
 * @param {TFunction} target funcion
 * @returns {TFunction} funcion anotada para ser ejecutada una vez
 */
export function callOnce(target) {
  let wasCalled = false;
  return (...args) => {
    if (wasCalled) {
      console.warn("callOnce: skip");
      return;
    }
    wasCalled = true;
    return target.apply(this, args);
  };
}

/**
 * Inicialización de los textos de la capa de contenido no permitido por control parental
 * @private
 * @param {String} tpl Contenido tpl de la capa "no permitido" para el player
 * @returns {String} Capa tpl formateada con los textos
 */
export function initializeTplNotAllowed(tpl) {
  return tpl
    .replace("{{title}}", i18next.t("player.no_disponible"))
    .replace("{{subtitle}}", i18next.t("player.no_disponible_moral"));
}
