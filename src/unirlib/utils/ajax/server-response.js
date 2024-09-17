// @ts-check

import { ajaxResponseErrorSignal } from "@newPath/managers/signals";

import { RequestSettings } from "./request-settings";

/** @type {ResponseInterceptor[]} */
const _responseInterceptors = [];

/**
 * Ajax Response
 */
export class ServerResponse {
  /**
   * Converts object to string
   *
   * @param {any} data Format object to string
   * @returns {string} data converted to string
   */
  static formatObjectAsText(data) {
    if (Array.isArray(data) || typeof data === "object") {
      return JSON.stringify(data);
    }
    return `${data}`;
  }

  /**
   *
   * @param {ResponseInterceptor} interceptor interceptor
   */
  static addResponseInterceptor(interceptor) {
    _responseInterceptors.push(interceptor);
  }

  /**
   * Create new instance for ServerResponse
   *
   * @param {Promise} promise fetcher promise
   * @param {ServerRequest} serverRequest Server request
   */
  constructor(promise, serverRequest) {
    const self = this;

    /**
     * @type {Promise}
     * @private
     */
    this._promise = promise;

    /**
     * @type {ServerRequest}
     * @private
     */
    this._serverRequest = serverRequest;

    /**
     * Chained fail callback
     * @private
     */
    this._failFn = undefined;

    /**
     * Chained success callback
     * @private
     */
    this._successCallback = undefined;

    this._promise.then((axiosResponse) => {
      this._setResultFrom(axiosResponse);

      //
      //  extends server response with more elements
      //
      self._serverRequest.getResponseHeader = (header) => {
        return axiosResponse.headers[`${header}`.toLowerCase()];
      };

      self._serverRequest.success(axiosResponse.data, axiosResponse.statusText, self._serverRequest);
      self._successCallback?.apply(self, [axiosResponse.data, axiosResponse.statusText, self._serverRequest]);
    });

    this._promise.catch((error) => {
      this._setResultFrom(error?.response, error?.message);
      let itWasProcessed = false;

      ajaxResponseErrorSignal.signal({
        url: self._serverRequest.url,
        status: error?.response?.status ?? 500,
        statusText: error?.response?.statusText ?? null,
        message: error?.message ?? null,
      });

      ///
      /// If enabled intercepters by using Singleton RequestSettings, then process them
      ///
      if (RequestSettings.instance.enableInterceptors) {
        itWasProcessed = _responseInterceptors.reduce((currentState, interceptorFn) => {
          if (currentState) {
            return true;
          }
          return interceptorFn(this._serverRequest, error?.response);
        }, false);
      }

      if (!itWasProcessed) {
        self._serverRequest.error(self._serverRequest, error?.response?.statusText, error?.message);
        self._failFn?.apply(self, [self._serverRequest, error?.response?.statusText, error?.message]);
      }
    });
  }

  /**
   * Change update config with response
   *
   * @param {Response} response response from fetcher
   * @private
   */
  _setResultFrom(response, message) {
    this._serverRequest.statusText = response?.statusText;
    this._serverRequest.status = response?.status;
    this._serverRequest.responseText = ServerResponse.formatObjectAsText(response?.data);
    if (message) {
      this._serverRequest.message = message;
    }
  }

  /**
   * Promesa interna
   * @type {Promise}
   */
  get promise() {
    return this._promise;
  }

  /**
   * on success method
   *
   * @param {import("./server-request").AjaxSuccessCallback} callback Callback
   * @returns {ServerResponse}
   */
  success(callback) {
    this._successCallback = callback;
    return this;
  }

  /**
   * Alias for success function
   *
   * @param {import("./server-request").AjaxSuccessCallback} callback Callback
   * @returns {ServerResponse}
   */
  done(callback) {
    return this.success(callback);
  }

  /**
   * On fail event
   *
   * @param {import("./server-request").AjaxErrorCallback} callback Callback
   * @returns {ServerResponse}
   */
  fail(callback) {
    this._failFn = callback;
    return this;
  }

  /**
   * On error event alias for fail event
   *
   * @param {import("./server-request").AjaxErrorCallback} callback Callback
   * @returns {ServerResponse}
   */
  error(callback) {
    return this.fail(callback);
  }
}

/**
 * @callback ResponseInterceptor
 * @param {import("./server-request").ServerRequest} request
 * @param {import("axios").AxiosResponse} response
 * @returns {boolean} _true_ si se ha procesado
 */

/**
 * @typedef {import ("./server-request").ServerRequest} ServerRequest
 */

/**
 * @typedef {import("axios").AxiosResponse} Response
 */
