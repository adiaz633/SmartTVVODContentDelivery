import { parseUrl } from "src/code/js/lib";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export const transaction = function () {
  this._status = null;
  this._request_status = -1;
  this._command;
  this._origen_scene;
  this._parameters;

  transaction.prototype.getRequestStatus = function () {
    return this._request_status;
  };

  transaction.prototype.getStatus = function () {
    return this._status;
  };

  /******************************
      CONSULTA METODOS DE PAGO
  *******************************/
  transaction.prototype.consultaMetodosPago = function () {
    debug.alert("transaction.prototype.consultaMetodosPago");
    var query = AppStore.wsData.getURLTkservice("tfgunir/cobro", "consultaformaspago");
    var urlPago = parseUrl(query.url);
    query.url = this.escapeURL(urlPago);
    query.method = "POST";
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: query.method,
        url: query.url,
        data: "",
        x_hzid: query.x_hzid,
        need_token: query.need_token,
        first_401: true,
        retryLimit: query.retries,
        contentType: "x-www-form-urlencoded",
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = xhr.responseText;
                reject(error);
              }
            );
          } else if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else reject(error);
          } else {
            var error = xhr.responseText;
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  /*****************************************************
                  PAGO CARGO A CUENTA
  ******************************************************/

  transaction.prototype.deferredPurchase = function (requestBody) {
    debug.alert("transaction.prototype.deferredPurchase");
    var query = AppStore.wsData.getURLTkservice("tfgunir/cobro", "pagodiferido");
    var urlPago = parseUrl(query.url, true);
    query.url = this.escapeURL(urlPago);
    query.method = "POST";
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: query.method,
        url: query.url,
        data: requestBody,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        first_401: true,
        contentType: "application/json",

        success(data, status, xhr) {
          resolve();
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  responseText: xhr.responseText,
                  status: xhr.status,
                };
                reject(error);
              }
            );
          } else {
            var error = { responseText: xhr.responseText, status: xhr.status };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  /******************************************
        PAGO CON TARJETA VIA ONESITE
  *******************************************/

  // Pago a traves de tarjeta requestBody desde formsOfPayment2
  transaction.prototype.consultaInstantPurchase = function (requestBody) {
    debug.alert("transaction.prototype.consultaInstantPurchase");
    var query = AppStore.wsData.getURLTkservice("tfgunir/cobro", "consultaformaspago");
    var urlPago = parseUrl(query.url);
    query.url = this.escapeURL(urlPago);
    query.method = "POST";
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: query.method,
        url: query.url,
        data: requestBody,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        first_401: true,
        retryLimit: query.retries,
        contentType: "application/json",
        success(data, status, xhr) {
          const json_data = JSON.parse(xhr.responseText);
          var location = xhr.getResponseHeader("Location");
          const json_response = {
            json_data,
            location,
            authorization: this.authorization,
          };
          resolve(json_response);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = xhr.responseText;
                reject(error);
              }
            );
          } else if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else reject(error);
          } else {
            var error = xhr.responseText;
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this._xhr_polling = null;
  transaction.prototype.instantPurchasePolling = function (requestBody, location, authorization) {
    debug.alert("transaction.prototype.instantPurchasePolling location = " + location);
    var url = AppStore.wsData.getServerAddress("default", location);
    debug.alert("transaction.prototype.instantPurchasePolling url = " + url);
    var url_aux = this.escapeURL(url);
    var self = this;
    this._polling_cancelled = false;
    var promise = new Promise(function (resolve, reject) {
      self._xhr_polling = Utils.ajax({
        url: url_aux,
        method: "POST",
        data: requestBody,
        retryLimit: 3,
        is_first_202: true,
        pollTimeout: null,
        need_token: authorization,
        contentType: "application/json",
        success(data, status, xhr) {
          if (xhr.status == 202) {
            this.is_first_202 = false;
            var max_age = xhr.getResponseHeader("Cache-Control");
            max_age = max_age.substring(max_age.indexOf("=") + 1, max_age.length);
            max_age = parseInt(max_age); // Suggested polling delay (por ejemplo 3 segundos)
            var timeout = max_age * 1000;
            var ajaxcall = this;
            this.pollTimeout = window.setTimeout(function () {
              debug.alert("instantPurchasePolling reintento! self._pooling_cancelled = " + self._pooling_cancelled);
              if (!self._pooling_cancelled) self._xhr_polling = Utils.ajax(ajaxcall);
            }, timeout);
            if (self._pooling_cancelled) {
              var error = { status: 0, responseText: "End_of_Timeout" };
              reject(error);
            }
          } else if (xhr.status == 200) {
            var response = { status: xhr.status };
            resolve(response);
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        error(xhr, textStatus, errorThrown) {
          if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) {
              if (self._pooling_cancelled) self._xhr_polling = Utils.ajax(this);
            } else {
              var error = {
                status: xhr.status,
                responseText: xhr.responseText,
              };
              reject(error);
            }
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: 5000,
      });
    });
    return promise;
  };

  this._pooling_cancelled = false;
  transaction.prototype.cancel_xhr_polling = function () {
    debug.alert("transaction.prototype.cancel_xhr_polling");
    if (this._xhr_polling) {
      this._pooling_cancelled = true;
      this._xhr_polling.abort();
    }
  };

  /***************************************
            RENEW PURCHASE PIN
  ****************************************/

  transaction.prototype.renew_purchase_pin = function (pin, pwd) {
    debug.alert("transaction.prototype.renew_purchase_pin");
    var query = AppStore.wsData.getURLTkservice("tfgunir/cobro", "cambiopin");
    var url_pin = parseUrl(query.url, true);
    query.url = this.escapeURL(url_pin);
    var user = AppStore.login.getUsername();
    const basicToken = AppStore.login.encode64(user + ":" + pwd);
    query.method = "PUT";
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: query.method,
        url: query.url,
        data: pin,
        authorization: "Basic " + basicToken,
        x_hzid: query.x_hzid,
        first_401: true,
        contentType: "application/json",
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  responseText: xhr.responseText,
                  status: xhr.status,
                };
                reject(error);
              }
            );
          } else {
            var error = { responseText: xhr.responseText, status: xhr.status };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  /************************************************************************
   * 								UPSELLING								*
   ************************************************************************/

  // Consulta producto UPGRADE
  transaction.prototype.consultaProducto = function () {
    debug.alert("transaction.prototype.consultaProducto");
    var url = AppStore.wsData._SRV_CONSULTA_PRODUCTO;
    url = AppStore.wsData.getServerAddress("default", url);
    var playReadyID = AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
    url = url.replace("{MEDIAPLAYERID}", playReadyID);
    var profile = AppStore.login.getProfile();
    url = url.replace("{PROFILE}", profile);
    url = url.replace("{contents}", this._parameters.tipo);
    url = url.replace("{contentId}", this._parameters.contentId);
    var url_contrata = this.escapeURL(url);

    var json_data = null;
    var xcookie = null;
    this._status = false;
    this._request_status = 0;
    var promise = new Promise(function (resolve, reject) {
      var token = unirlib.getIptv().getToken();
      Utils.ajax({
        method: "GET",
        url: url_contrata,
        x_hzid: token,
        need_token: AppStore.wsData.hasServiceToken("consulta_producto"),
        contentType: "application/json",
        success(data, status, xhr) {
          if (xhr.status == 200) {
            json_data = JSON.parse(xhr.responseText);
            xcookie = xhr.getResponseHeader("X-Cookie");
            const json_response = { json_data, XCookie: xcookie };
            resolve(json_response);
          } else reject(xhr.status);
        },
        error(xhr, textStatus, errorThrown) {
          reject(xhr.status);
        },
        timeout: 30000,
      });
    });
    return promise;
  };

  /*
	 	Contrata producto UPGRADE
	*/

  transaction.prototype.contrataProducto = function (bodyRequest, params) {
    debug.alert("transaction.prototype.contrataProducto");

    var url = AppStore.wsData._SRV_CONTRATA_PRODUCTO;
    url = AppStore.wsData.getServerAddress("default", url);
    url = Utils.urlvar2UpperString(url);

    var playReadyID = AppStore.playReady.getPlayReadyId(AppStore.login.getUserId());
    debug.alert("transaction.prototype.contrataProducto playReadyID = " + playReadyID);
    url = url.replace("{MEDIAPLAYERID}", playReadyID);
    url = url.replace("{ACCOUNTNUMBER}", AppStore.login.getAccountNumber());
    url = url.replace("{PRODUCTID}", params.ProductId);
    var url_contrata = this.escapeURL(url);

    this._status = false;
    this._request_status = 0;
    var promise = new Promise(function (resolve, reject) {
      var requestBody = bodyRequest;
      Utils.ajax({
        method: "PUT", // Esto antes estaba POST
        url: url_contrata,
        data: requestBody,
        x_hzid: unirlib.getIptv().getToken(),
        need_token: AppStore.wsData.hasServiceToken("contrata_producto"),
        headers: { "X-Cookie": params.XCookie },
        contentType: "application/json",
        success(data, status, xhr) {
          var location = "";
          if (xhr.status == 201 || xhr.status == 204) {
            var response = { status: xhr.status, location: "" };
            resolve(response);
          } else if (xhr.status == 202) {
            var location = xhr.getResponseHeader("Location");
            var response = { status: xhr.status, location };
            resolve(response);
          }
        },
        error(xhr, textStatus, errorThrown) {
          var error = { status: xhr.status, responseText: xhr.responseText };
          reject(error);
        },
        timeout: 30000,
      });
    });
    return promise;
  };

  transaction.prototype.contrataProductoPolling = function (location, xcookie) {
    debug.alert("transaction.prototype.contrataProductoPolling location = " + location);
    var url = AppStore.wsData.getServerAddress("default", location);
    //var url = "http://lab.clientservices.dof6.com:8080/" + location;	/* TODO: COMENTAR */
    debug.alert("transaction.prototype.contrataProductoPolling url = " + url);
    var url_aux = this.escapeURL(url);

    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        url: url_aux,
        method: "HEAD",
        retryLimit: 1,
        is_first_404: true,
        x_hzid: unirlib.getIptv().getToken(),
        headers: { "X-Cookie": xcookie },
        contentType: "application/json",
        success(data, status, xhr) {
          if (xhr.status == 204) {
            var response = { status: xhr.status };
            resolve(response);
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        error(xhr, textStatus, errorThrown) {
          if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else {
              var error = {
                status: xhr.status,
                responseText: xhr.responseText,
              };
              reject(error);
            }
          } else if (xhr.status == 404) {
            if (this.is_first_404) {
              this.is_first_404 = false;
              var max_age = xhr.getResponseHeader("Cache-Control");
              max_age = max_age.substring(max_age.indexOf("=") + 1, max_age.length);
              max_age = parseInt(max_age); // Suggested polling delay (por ejemplo 3 segundos)
              this.timeout = max_age * 1000;
              this.retryLimit = parseInt(parseInt(AppStore.wsData._contrataproducto_timeout) / this.timeout);
              Utils.ajax(this);
            } else {
              this.retryLimit--;
              if (this.retryLimit >= 0) {
                var ajaxcall = this;
                window.setTimeout(function () {
                  Utils.ajax(ajaxcall);
                }, ajaxcall.timeout);
              } else {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            }
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: 5000,
      });
    });

    return promise;
  };

  transaction.prototype.escapeURL = function (URL) {
    var url2 = URL;

    url2 = url2.replace("+", "%2B");

    return url2;
  };
};
