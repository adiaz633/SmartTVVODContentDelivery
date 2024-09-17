import { parseUrl } from "src/code/js/lib";
import { audienceManager } from "@newPath/managers/audiences/audience-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export const playReady = function () {
  var _playReadyCollection = new Array();
  var _playReady_json = null;
  var _playReadyId = { playreadyid: "", token: "" };
  var _fileName = "playreadyids.db";
  var _payload_iptv = "";
  var _http = null;

  playReady.prototype.deletePlayReadyIds = function () {
    _playReadyId = { playreadyid: "", token: _playReadyId.token };
    _playReadyCollection = new Array();
    _playReadyCollection.push(_playReadyId);
    this.savePlayReadyIds();
  };

  playReady.prototype.deleteToken = function () {
    _playReadyId = { playreadyid: "", token: "" };
    _playReadyCollection = new Array();
    _playReadyCollection.push(_playReadyId);

    this.savePlayReadyIds();
  };

  playReady.prototype.resetPlayReadyId = function () {
    _playReadyId = { playreadyid: "", token: _playReadyId.token };
  };

  playReady.prototype.abortHttp = function () {
    _http.abort();
  };

  playReady.prototype.loadPlayReadyIds = function () {
    _http = new XMLHttpRequest();
    if (_http.overrideMimeType) {
      _http.overrideMimeType("text/xml");
    }

    _playReady_json = AppStore.fileUtils.readJSON(_fileName);
    _playReadyCollection = new Array();

    if (_playReady_json != null) {
      var ids = _playReady_json.Ids;
      if (_playReady_json != null && _playReady_json.Ids != null) {
        var nids = _playReady_json.Ids.length;
        for (var i = 0; i < nids; i++) {
          _playReadyCollection[i] = ids[i];
          _playReadyId = _playReadyCollection[i];
        }
      }
    } else {
      _playReadyId = { playreadyid: "", token: "" };
      _playReadyCollection.push(_playReadyId);
      _playReady_json = { Ids: _playReadyCollection };
    }

    debug.alert(
      "playReady.prototype.loadPlayReadyIds FILENAME CARGADO: " + _fileName + " " + JSON.stringify(_playReady_json)
    );
  };

  playReady.prototype.savePlayReadyIds = function () {
    _playReady_json = { Ids: _playReadyCollection };
    AppStore.fileUtils.saveJSON(_fileName, _playReady_json);

    debug.alert("playReady.prototype.savePlayReadyIds JSON PLAYREADY GUARDADO: " + JSON.stringify(_playReady_json));
  };

  playReady.prototype.getJson = function () {
    debug.alert("getJson " + JSON.stringify(_playReadyId));

    return _playReadyId;
  };

  playReady.prototype.setJson = function (playid) {
    debug.alert("setJson " + JSON.stringify(playid));

    if (playid != null) {
      _playReadyId = { playreadyid: "", token: playid.token };
      _playReadyCollection = new Array();
      _playReadyCollection.push(_playReadyId);
      _playReady_json = { Ids: _playReadyCollection };

      this.savePlayReadyIds();
    }
  };

  playReady.prototype.hasPlayReadyId = function () {
    var exito = false;

    if (_playReadyId != null) {
      if (!AppStore.appStaticInfo.isToken()) {
        exito = _playReadyId.playreadyid != null && _playReadyId.playreadyid != "";
      } else {
        if (
          (_playReadyId.token == null || _playReadyId.token == "") &&
          _playReadyId.playreadyid != null &&
          _playReadyId.playreadyid != ""
        ) {
          _playReadyId.token = _playReadyId.playreadyid;
        }
        exito = _playReadyId.token != null && _playReadyId.token != "";
      }
    }

    debug.alert("playReady.prototype.hasPlayReadyId " + exito + ", _playReadyId = " + JSON.stringify(_playReadyId));

    return exito;
  };

  playReady.prototype.newPlayReadyId = function (playreadyid) {
    if (!AppStore.appStaticInfo.isToken()) _playReadyId = { playreadyid, token: _playReadyId.token };
    else _playReadyId = { playreadyid: "", token: playreadyid };

    _playReadyCollection = new Array();
    _playReadyCollection.push(_playReadyId);

    this.savePlayReadyIds();

    debug.alert("playReady.prototype.newPlayReadyId NEW PLAYREADY JSON: " + JSON.stringify(_playReadyId));
  };

  playReady.prototype.getPlayReadyId = function () {
    if (AppStore.appStaticInfo.isToken()) return _playReadyId.token;

    return _playReadyId.playreadyid;
  };

  playReady.prototype.getTokenError = function () {
    return this._token_error;
  };

  playReady.prototype.getInitDataErrorCode = function () {
    var err_code = "I_Login_2";
    var is404error = unirlib.isInitData404();
    var userprofile = AppStore.login.getProfile();
    debug.alert("playReady.prototype.getInitDataErrorCode is404error " + is404error);
    debug.alert("playReady.prototype.getInitDataErrorCode userprofile " + userprofile);
    if (is404error == true && userprofile == "DTHCASUAL") {
      err_code = "I_Login_4";
    } else {
      if (this._token_error == 0) err_code = "E_Login_6";
      else if (this._token_error == 1) err_code = "E_Login_7";
      else if (this._token_error == 2) err_code = "E_Login_8";
    }
    return err_code;
  };

  /***********************************/
  /*    FIN GESTION DE PLAYREADYS    */
  /***********************************/

  /***********************************/
  /* ACCESO A PETICIONES AL SERVIDOR */
  /***********************************/

  /* Request status global...*/
  this._isTimeout = false;
  this._request_status;
  this._first_request = true;
  playReady.prototype.getStatusReq = function () {
    return this._request_status;
  };

  /* consulta_idPR */
  playReady.prototype.consultarPlayReadyId = function (accountnumber, command) {
    debug.alert("#### F4 #### playReady.prototype.consultarPlayReadyId Consultar PLAYREADY ID");
    if (AppStore.appStaticInfo.isEmulator) {
      var playemuid = "abcde";
      AppStore.yPlayerCommon.setMode(2);
      debug.alert("playReady.prototype.consultarPlayReadyId EL PLAYREADYID ES: " + playemuid);
      this.newPlayReadyId(playemuid);
      this._request_status = 200;
      this.command_consultarPlayReadyId(true, command);
    } else {
      this.devices_consultarPlayReadyId(accountnumber, command);
    }
  };

  playReady.prototype.devices_consultarPlayReadyId = function (accountnumber, command) {
    const query = AppStore.wsData.getURLTkservice("tfgunir/devices", "consulta_idPR");
    const url_query = parseUrl(query.url, false);
    var self = this;
    Utils.ajax({
      method: "GET",
      url: url_query,
      mimeType: "text/xml",
      retryLimit: query.retries,
      success(data, status, xhr) {
        self._request_status = xhr.status;
        const playreadyid = xhr.responseText;
        self.newPlayReadyId(playreadyid.substring(1, playreadyid.length - 1));
        self.command_consultarPlayReadyId(true, command);
      },
      error(xhr, textStatus, errorThrown) {
        this.retryLimit--;
        if (textStatus === "timeout") {
          if (this.retryLimit >= 0) Utils.ajax(this);
          else self.command_consultarPlayReadyId(false, command);
        } else {
          self._request_status = xhr.status;
          if (xhr.status == 404) {
            debug.alert(
              "playReady.prototype.devices_consultarPlayReadyId_rec 404 - EL DISPOSITIVO NO ESTA EN LA LISTA"
            );
          } else if (xhr.status == 502) {
            debug.alert(
              "playReady.prototype.devices_consultarPlayReadyId_rec 502 - UNEXPECTED ERROR: " + xhr.statusText
            );
          } else {
            debug.alert("playReady.prototype.devices_consultarPlayReadyId_rec - ERROR: " + xhr.statusText);
          }
          self.command_consultarPlayReadyId(false, command);
        }
      },
      timeout: query.timeout,
    });
  };

  playReady.prototype.command_consultarPlayReadyId = function (ok, command) {
    if (command == "generar_alta_dispositivo") this.callback_generar_alta_dispositivo(ok);
  };

  /* espacio_dispositivo */
  playReady.prototype.comprobarEspacioDispositivo = function (accountnumber, command) {
    const query = AppStore.wsData.getURLTkservice("tfgunir/devices", "espacio_dispositivo");
    const url_query = parseUrl(query.url, false);
    var self = this;
    Utils.ajax({
      method: "GET",
      url: url_query,
      mimeType: "text/xml",
      retryLimit: query.retries,
      success(data, status, xhr) {
        self._request_status = xhr.status;
        self.command_comprobarEspacioDispositivo(command, true);
      },
      error(xhr, textStatus, errorThrown) {
        if (textStatus === "timeout") {
          this.retryLimit--;
          if (this.retryLimit >= 0) Utils.ajax(this);
          else self.command_comprobarEspacioDispositivo(command, false);
        } else {
          self._request_status = xhr.status;
          if (xhr.status == 403) {
            debug.alert(
              "playReady.prototype.comprobarEspacioDispositivo: 403 - NUMERO MAXIMO DE DISPOSITIVOS. NO SE PUEDEN REALIZAR CAMBIOS"
            );
          } else if (xhr.status == 409) {
            debug.alert(
              "playReady.prototype.comprobarEspacioDispositivo: 409 - NUMERO MAXIMO DE DISPOSITIVOS. SE PUEDEN REALIZAR CAMBIOS"
            );
          } else if (xhr.status == 502) {
            debug.alert("playReady.prototype.comprobarEspacioDispositivo: 502 - UNEXPECTED ERROR: " + xhr.statusText);
          } else {
            debug.alert("playReady.prototype.comprobarEspacioDispositivo ERROR: " + xhr.statusText);
          }
          self.command_comprobarEspacioDispositivo(command, false);
        }
      },
      timeout: query.timeout,
    });
  };

  playReady.prototype.command_comprobarEspacioDispositivo = function (command, ok) {
    debug.alert("playReady.prototype.command_comprobarEspacioDispositivo command " + command);
    if (command == "login_link") AppStore.sceneManager.get("PopLoginScene").callback_link_espacio_dispositivo(ok);
    else if (command == "ofertas_link")
      AppStore.sceneManager.get("PopOfertaScene").callback_link_espacio_dispositivo(ok);
  };

  /* alta_dispositivo */
  this._activacion_status = 0;
  playReady.prototype.solicitarActivacionDispositivo = function (param) {
    let query = AppStore.wsData.getURLTkservice("tfgunir/devices", "activacion_dispositivo_cuenta");
    if (AppStore.appStaticInfo.isToken())
      query = AppStore.wsData.getURLTkservice("tfgunir/devices", "activacion_dispositivo_cuenta_tk");
    let url_query = query.url;
    const hasplayid = this.hasPlayReadyId();
    if (hasplayid) {
      let playID = "";
      if (!AppStore.appStaticInfo.isToken()) playID = _playReadyCollection[0].playreadyid;
      else playID = _playReadyCollection[0].token;
      url_query = url_query.replace("{PLAYREADYID}", playID);
      url_query = url_query.replace("{MEDIAPLAYERID}", playID);
    } else {
      url_query = url_query.replace("/{MEDIAPLAYERID}", "");
    }
    url_query = parseUrl(url_query, false);

    const headers = {};
    if (!AppStore.appStaticInfo.isToken()) {
      headers["Content-Type"] = "application/json";
    } else {
      headers["Accept"] = "application/json";
      if (query.need_header_deviceid && AppStore.playReady.getPlayReadyId())
        headers["x-tfgunir-deviceid"] = AppStore.playReady.getPlayReadyId();
    }

    var self = this;
    Utils.ajax({
      method: "POST",
      url: url_query,
      retryLimit: query.retries,
      data: param,
      headers,
      success(data, status, xhr) {
        if (xhr.status == 200)
          debug.alert("playReady.prototype.solicitarActivacionDispositivo 200 - EL DISPOSITIVO YA ESTABA EN CUENTA");
        else if (xhr.status == 201)
          debug.alert(
            "playReady.prototype.solicitarActivacionDispositivo 201 - EL DISPOSITIVO SE HA INCLUIDO EN LA CUENTA"
          );
        var resp_text = xhr.responseText;
        if (resp_text && resp_text.length > 0) {
          if (AppStore.appStaticInfo.isToken()) resp_text = resp_text.replace('"', "").replace('"', "");
          var is_valid = !resp_text.includes("html") && !resp_text.includes("url");
          if (is_valid) self.newPlayReadyId(resp_text);
        }
        self._request_status = xhr.status;
        self.command_solicitarActivacionDispositivo(true);
      },
      error(xhr, textStatus, errorThrown) {
        if (textStatus === "timeout") {
          this.retryLimit--;
          if (this.retryLimit >= 0) Utils.ajax(this);
          else self.command_solicitarActivacionDispositivo(false);
        } else {
          self._request_status = xhr.status;
          if (xhr.status == 403) {
            debug.alert(
              "playReady.prototype.solicitarActivacionDispositivo 403 - NUMERO MAXIMO DE DISPOSITIVOS. NO SE PUEDEN REALIZAR CAMBIOS"
            );
          } else if (xhr.status == 409) {
            debug.alert(
              "playReady.prototype.solicitarActivacionDispositivo 409 - NUMERO MAXIMO DE DISPOSITIVOS. SE PUEDEN REALIZAR CAMBIOS"
            );
          } else if (xhr.status == 400) {
            debug.alert("playReady.prototype.solicitarActivacionDispositivo 400 - MISSING DEVICE ID");
          } else if (xhr.status == 401) {
            debug.alert("playReady.prototype.solicitarActivacionDispositivo 401 - UNAUTHORIZED. BAD PASSWORD");
          } else if (xhr.status == 502) {
            debug.alert("playReady.prototype.solicitarActivacionDispositivo 502 - UNEXPECTED ERROR: " + xhr.statusText);
          } else {
            debug.alert("playReady.prototype.solicitarActivacionDispositivo - ERROR: " + xhr.statusText);
          }
          self.command_solicitarActivacionDispositivo(false);
        }
      },
      timeout: query.timeout,
    });
  };

  playReady.prototype.command_solicitarActivacionDispositivo = function (ok) {
    debug.alert("playReady.prototype.command_solicitarActivacionDispositivo con result = " + this._request_status);
    this._activacion_status = this._request_status;
    AppStore.sceneManager.get("PopLoginScene").callback_link_activa_activacion_dispositivo(ok);
  };

  /*****************************/
  /* singon: devuelve el token */
  /*****************************/

  playReady.prototype.set_session_payload = function (content_id, streamType, channel_id) {
    if (streamType != "AST" && channel_id) {
      _payload_iptv =
        "{" +
        '"contentID":"' +
        content_id +
        '",' +
        '"streamType":"' +
        streamType +
        '",' +
        '"channelID":"' +
        channel_id +
        '"' +
        "}";
    } else {
      _payload_iptv = "{" + '"contentID":"' + content_id + '",' + '"streamType":"' + streamType + '"' + "}";
    }
  };

  this._token_error;
  /* iniciarsesion */
  playReady.prototype.iniciar_setUpStream = function (content_id, streamType, channel_id) {
    debug.alert("playReady.prototype.iniciar_setUpStream - #### F12 ####");
    const x_hzid = AppStore.profile.get_token();
    this._isTimeout = false;
    this._request_status = 0;
    if (AppStore.appStaticInfo.isEmulator || x_hzid == null) {
      AppStore.yPlayerCommon.callback_new_session(true, this._request_status);
    } else {
      var query = AppStore.wsData.getURLTkservice("tfgunir/devices", "setUpStream");
      var url_query = query.url;
      var url_query = parseUrl(url_query, false);
      debug.alert("playReady.prototype.iniciar_setUpStream url: " + url_query);
      _payload_iptv = this.set_session_payload(content_id, streamType, channel_id);
      var self = this;
      Utils.ajax({
        method: "POST",
        url: url_query,
        retryLimit: query.retries,
        data: _payload_iptv,
        x_hzid: query.x_hzid,
        dataType: "json",
        first401: true,
        contentType: "application/json",
        success(data, status, xhr) {
          let ok = true;
          debug.alert("playReady.prototype.iniciar_setUpStream es: " + JSON.stringify(data));
          debug.alert("playReady.prototype.iniciar_setUpStream request.resultCode " + data.resultCode);
          if (data.resultCode == 0 && data.resultData) {
            var sessionID = data.resultData.sessionID;
            debug.alert("playReady.prototype.iniciar_setUpStream sessionID: " + sessionID);
            AppStore.yPlayerCommon.setSessionID(sessionID);
            self._request_status = 200;
          } else {
            debug.alert("playReady.prototype.iniciar_setUpStream error session code: " + data.resultCode);
            self._request_status = data.resultCode;
            ok = false;
          }
          AppStore.yPlayerCommon.callback_new_session(ok, self._request_status);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") !== -1 && this.first401) {
            var ajax_instance = this;
            this.first401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(function (response) {
              if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
              Utils.ajax(ajax_instance);
            });
          } else {
            let ok = true;
            if (xhr.textStatus != "timeout") {
              self._request_status = xhr.status;
              debug.alert(
                "playReady.prototype.iniciar_setUpStream UNEXPECTED ERROR: " + xhr.status + " " + xhr.statusText
              );
              debug.alert("playReady.prototype.iniciar_setUpStream: " + xhr.responseText);
              if (xhr.status >= 400 && xhr.status < 500) {
                self._request_status = -1;
                if (xhr != null && xhr.responseText != null && xhr.responseText.length > 0) {
                  const request = JSON.parse(xhr.responseText);
                  if (request.resultCode != null) self._request_status = request.resultCode;
                }
                ok = false;
              }
              debug.alert("self._request_status: " + self._request_status);
              AppStore.yPlayerCommon.callback_new_session(ok, self._request_status);
            } else {
              AppStore.yPlayerCommon.callback_new_session(ok, self._request_status);
            }
          }
        },
        timeout: query.timeout,
      });
    }
  };

  /* cerrarsesion */
  this._success_cierre_sesion = false;
  this._status_cierre_sesion = false;
  playReady.prototype.iniciar_tearDownStream = function (sesID) {
    debug.alert("playReady.prototype.cerrarSesion IPTV #### F15 #### -> " + sesID);
    const x_hzid = AppStore.profile.get_token();
    if (AppStore.appStaticInfo.isEmulator || x_hzid == null) {
      unirlib.getSessions().deleteSessions();
    } else {
      var query = AppStore.wsData.getURLTkservice("tfgunir/devices", "tearDownStream");
      var url_query = query.url;
      var url_query = parseUrl(url_query, false);
      debug.alert("playReady.prototype.iniciar_tearDownStream url: " + url_query);
      var self = this;
      Utils.ajax({
        method: "DELETE",
        url: url_query,
        mimeType: "text/xml",
        retryLimit: query.retries,
        x_hzid: query.x_hzid,
        success(data, status, xhr) {
          if (
            xhr.status == 200 ||
            xhr.status == 201 ||
            xhr.status == 202 ||
            xhr.status == 203 ||
            xhr.status == 204 ||
            xhr.status == 205 ||
            xhr.status == 206
          ) {
            self._status_cierre_sesion = xhr.status;
            self._success_cierre_sesion = true;
          }
        },
        error(xhr, textStatus, errorThrown) {
          self._status_cierre_sesion = xhr.status;
          self._success_cierre_sesion = false;
        },
        timeout: query.timeout,
      });
    }
  };

  playReady.prototype.keepAlive = function () {
    debug.alert("playReady.prototype.keepAlive");
    const x_hzid = AppStore.profile.get_token();
    if (AppStore.appStaticInfo.isEmulator || x_hzid == null) {
      this._request_status = 0;
      AppStore.yPlayerCommon.callback_new_session(true, this._request_status);
    } else {
      var query = AppStore.wsData.getURLTkservice("tfgunir/devices", "keepAliveStream");
      var url_query = query.url;
      var url_query = parseUrl(url_query, false);
      debug.alert("playReady.prototype.keepAlive URL: " + url_query);
      var self = this;
      Utils.ajax({
        method: "POST",
        url: url_query,
        retryLimit: query.retries,
        data: _payload_iptv,
        x_hzid: query.x_hzid,
        first401: true,
        contentType: "application/json",
        success(data, status, xhr) {
          const ok = true;
          self._request_status = 200;
          debug.alert("keepAlive OK " + xhr.status);
          AppStore.yPlayerCommon.callback_new_session(ok, self._request_status);
          //auditar
          const _sendAUD = AppStore.yPlayerCommon.getMode() === 1 ? { evt: 1 } : { evt: 2 };
          AppStore.tfnAnalytics.player("keep_alive", { ..._sendAUD });
        },
        error(xhr, textStatus, errorThrown) {
          let ok = true;
          if (xhr.textStatus != "timeout") {
            if (xhr.responseText && xhr.responseText.search("40101") !== -1 && this.first401) {
              var ajax_instance = this;
              this.first401 = false;
              AppStore.login
                .getProfile()
                .refreshActiveInitDataElements()
                .then(function (response) {
                  if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                  Utils.ajax(ajax_instance);
                });
            } else {
              ok = false;
              if (xhr.responseText != null) {
                const request = JSON.parse(xhr.responseText);
                if (request.resultCode == "40403" || request.resultCode == "40401") {
                  ok = true;
                  self._request_status = 200;
                  debug.alert("keepAlive OK " + xhr.status);
                }
              }
            }
            if (!ok) {
              debug.alert("keepAlive NO OK " + xhr.status);
              if (xhr.status >= 400 && xhr.status < 500) {
                self._request_status = -1;
                if (xhr && xhr.responseText != null) {
                  let request = null;
                  try {
                    request = JSON.parse(xhr.responseText);
                  } catch (e) {
                    request.resultCode = null;
                  }
                  if (request.resultCode != null) self._request_status = request.resultCode;
                }
                AppStore.yPlayerCommon.setSessionID(null);
                ok = false;
              } else {
                ok = true;
                self._request_status = xhr.status;
              }
            }
          } else {
            AppStore.yPlayerCommon.setSessionID(0);
            self._request_status = 200;
          }
          debug.alert("keepAlive request_status " + self._request_status);
          AppStore.yPlayerCommon.callback_new_session(ok, self._request_status);
        },
        timeout: query.timeout,
      });
    }
  };

  /* solicitaLicencia */
  playReady.prototype.solicitaLicencia = function () {
    //TODO: No esta en el documento aun, tienen que enviarnos esta parte
  };

  playReady.prototype.escapeURL = function (URL) {
    var url2 = URL;
    url2 = url2.replace("+", "%2B");
    return url2;
  };

  /* GENERAR ALTA DISPOSITIVO */
  this._origen_alta_dispositivo;
  playReady.prototype.generar_alta_dispositivo = function (origen) {
    debug.alert("playReady.prototype.generar_alta_dispositivo");
    this._origen_alta_dispositivo = origen;
    var accNumber = AppStore.login.getAccountNumber();
    debug.alert("playReady.prototype.generar_alta_dispositivo #### F6 #### Solicitar alta PLAYREADY");
    var query = AppStore.wsData.getURLTkservice("tfgunir/license", "url_video");
    var url_video = query.url;
    PlayMng.player.initPlayReady(url_video);

    // lg y samsung no necesitan esperar por el video fake...
    if (
      AppStore.appStaticInfo.getTVModelName() == "lg" ||
      AppStore.appStaticInfo.getTVModelName() == "samsung" ||
      AppStore.appStaticInfo.getTVModelName() == "samsung_tizen" ||
      AppStore.appStaticInfo.getTVModelName() == "android.tv" ||
      AppStore.appStaticInfo.isEmulator
    )
      this.consultarPlayReadyId(accNumber, "generar_alta_dispositivo");
  };

  playReady.prototype.callback_generar_alta_dispositivo = function (playReadyOK) {
    debug.alert(
      "playReady.prototype.callback_generar_alta_dispositivo " +
        this._origen_alta_dispositivo +
        " " +
        unirlib.isInitData404()
    );

    if (
      AppStore.appStaticInfo.getTVModelName() == "lg" ||
      AppStore.appStaticInfo.getTVModelName() == "samsung" ||
      AppStore.appStaticInfo.getTVModelName() == "samsung_tizen" ||
      AppStore.appStaticInfo.getTVModelName() == "android.tv"
    )
      AppStore.yPlayerCommon.stop(true); /* NO necesitamos stopSession, pasamos true a is_not_req */

    if (this._origen_alta_dispositivo == "PopLoginScene")
      AppStore.sceneManager.get("PopLoginScene").callback_alta_dispositivo(playReadyOK);
    if (this._origen_alta_dispositivo == "PopOfertaScene")
      AppStore.sceneManager.get("PopOfertaScene").callback_alta_dispositivo(playReadyOK);
  };
};

/**
 * @typedef {Object} PlayReady
 * @property {boolean} _first_request
 * @property {(content_id, streamType, channel_id) => void} iniciar_setUpStream
 * @property {() => string} getPlayReadyId
 * @property {() => void} keepAlive
 * @property {(sessionId: string) => void} iniciar_tearDownStream
 * @property {() => void} resetPlayReadyId
 * @property {() => void} deletePlayReadyIds
 */
