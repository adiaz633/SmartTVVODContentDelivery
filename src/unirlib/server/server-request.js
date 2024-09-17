// @ts-check

import { parseUrl } from "src/code/js/lib";
import { Utils } from "@unirlib/utils/Utils";

const _timersMap = new Map();

const _METHOD_LOCAL = "local";

/**
 * Obtiene el modulo solicitado
 *
 * @param {string} url Modulo a ser cargado
 * @return {Promise<void>} Modulo cargado
 */
async function _getModule(url) {
  const [, moduleId] = url.split("#");
  // @ts-ignore
  return await import(`@newPath/${moduleId}`);
}

async function _getServerResponse(query) {
  const queryUrl = parseUrl(query.url, true);
  return new Promise((resolve, reject) => {
    Utils.ajax({
      url: queryUrl,
      method: query.method,
      retryLimit: query.retries,
      authorization: query.authorization,
      need_token: true,
      timeout: query.timeout,
      nocache: query.nocache || false,
      beforeSend(xhr) {
        if (this.authorization) {
          xhr.setRequestHeader("Authorization", this.authorization);
        }
      },
      success(data) {
        resolve(data);
      },
      error(xhr) {
        reject(new Error(xhr.responseText));
      },
    });
  });
}

/**
 * Get response
 * @param {import("./data").UrlTkService} urlTkServiceResult Response
 * @return {Promise<any>} resltado
 */
async function _getResponseValue(urlTkServiceResult) {
  if (urlTkServiceResult.method === _METHOD_LOCAL) {
    return _getModule(urlTkServiceResult.url);
  } else {
    return _getServerResponse(urlTkServiceResult);
  }
}

export const ServerRequestDefaultOptions = Object.freeze({
  /**
   * Intervalo de actualizacion de las respuestas
   * @type {Number}
   */
  interval: 0,
});

/**
 * Obtener los request
 *
 * @param {import("./data").UrlTkService} urlTkServiceResult Response
 * @param {ServerRequestDefaultOptions} options options
 * @return {Promise<any>} resultado
 */
export async function serverRequest(urlTkServiceResult, options) {
  const ZERO_INTERVAL = 0;
  const opts = {
    ...ServerRequestDefaultOptions,
    ...options,
  };

  if (_timersMap.has(urlTkServiceResult.url)) {
    return _timersMap.get(urlTkServiceResult.url);
  }

  if (Number(opts.interval) > ZERO_INTERVAL) {
    setInterval(async () => {
      const result = await _getResponseValue(urlTkServiceResult);
      _timersMap.set(urlTkServiceResult.url, result);
    }, Number(opts.interval));
  }

  const result = await _getResponseValue(urlTkServiceResult);
  _timersMap.set(urlTkServiceResult.url, result);
  return result;
}
