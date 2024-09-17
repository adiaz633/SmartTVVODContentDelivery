// @ts-checkts-check

/**
 * AJAX Request class
 */
export class ServerRequest {
  constructor() {
    /**
     * HTTP Method
     *
     * @type {"get" | "post" | "put" | "delete" | "options" }
     */
    this.method = "get";

    /**
     * Resource url
     *
     * @type {string}
     */
    this.url = undefined;

    /**
     * HTTP Request headers
     * @type {{[key:string]: string}}
     */
    this.headers = {};

    /**
     * When sending data to the server, use this content type
     * @type {string}
     */
    this.contentType = undefined;

    /**
     * Status code
     * @type {number}
     */
    this.status = undefined;

    /**
     * Http Status text
     *
     * @type {string | undefined}
     */
    this.statusText = undefined;

    /**
     * Mensaje Adicional
     *
     * @type {string | undefined}
     */
    this.message = undefined;

    /**
     * Timeout in MS
     *
     * @type {number | undefined}
     */
    this.timeout = undefined;

    /**
     * Post data
     *
     * @param {object | undefined}
     */
    this.data = undefined;

    /**
     * Response data as string
     * @param {string | undefined}
     */
    this.responseText = undefined;

    /**
     * Sets the value of an HTTP request header
     * @type {(key: string, value: string) => void}
     */
    this.setRequestHeader = this.#setRequestHeader.bind(this);

    /**
     * Executes before send query
     *
     * @type {AjaxBeforeSendCallback}
     */
    this.beforeSend = async () => {
      // To be implemented
    };

    /**
     * On success callback
     * @type {AjaxSuccessCallback}
     */
    this.success = () => {
      // To be implemented
    };

    /**
     * On Error callback
     * @type {AjaxErrorCallback}
     */
    this.error = () => {
      // To be implemented
    };

    /**
     * @type {AjaxGetResponseHeaderCallback}
     */
    this.getResponseHeader = () => {
      // To be implemented
    };
  }

  /**
   * Sets the value of an HTTP request header
   *
   * @param {string} key header key
   * @param {string} value header value
   * @private
   */
  #setRequestHeader(key, value) {
    if (value !== undefined) {
      this.headers[`${key}`] = value;
    }
  }
}

/**
 * @callback AjaxSuccessCallback
 * @param {any} data Request data
 * @param {string} textStatus Response status text
 * @param {ServerRequest} serverRequest Original server request object
 */

/**
 * @callback AjaxErrorCallback
 * @param {ServerRequest} serverRequest Original server request object
 * @param {string} [textStatus] error text status if any
 * @param {string} [errorMessage] error message if any
 */

/**
 * @callback AjaxBeforeSendCallback
 * @param {ServerRequest} serverRequest
 * @return {Promise<any>}
 */

/**
 * @callback AjaxGetResponseHeaderCallback
 * @param {string} header
 */
