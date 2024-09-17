/* istanbul ignore file */

/**
 * Funciones para el manejo de la navegacion con el url
 *
 * @module BrowserNavigation
 */

/**
 * Navega hacia un hash
 *
 * @param {ViewMng<T>} viewMng View Manager
 * @template T
 * @memberof BrowserNavigation
 */
export function navigateToHash(viewMng) {
  const url = new URL(location.href);
  if (url.hash.length > 1) {
    const [route, ...args] = url.hash.substring(1).split(/\//g);

    // Se remueve el # del hash
    viewMng.navigateTo(route, ...args);
  }
}

/**
 * Inicializar la navegacion por el url del browser
 *
 * @param {ViewMng<T>} viewMng View Manager
 * @template T
 * @memberof BrowserNavigation
 */
export function initBrowserNavigation(viewMng) {
  window.addEventListener("hashchange", () => navigateToHash(viewMng));
  setTimeout(() => navigateToHash(viewMng), 2000);
}

/**
 * @typedef {import("./index").ViewMng} ViewMng<T>
 * @template T
 */
