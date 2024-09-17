import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { convivaAPI } from "@unirlib/server/convivaAPI";
import { debug } from "@unirlib/utils/debug";

export const iptv = function () {
  this._type = 0;
  //0: (default) sin producto mh+, fuera del hogar
  //1: sin producto mh+, dentro del hogar
  //2: con producto mh+, fuera del hogar
  //3: con producto mh+, dentro del hogar

  this._is_router_valid = false;
  this._token = null;
  this._channels = null;
  this._pid_index = 0;

  this._streams_audio = null;
  this._streams_subs = null;

  iptv.prototype.isRouterValid = function () {
    return this._is_router_valid;
  };

  iptv.prototype.getType = function () {
    return this._type;
  };

  iptv.prototype.getToken = function () {
    debug.alert("getToken " + this._token);
    return this._token;
  };

  iptv.prototype.setToken = function (token) {
    debug.alert("setToken " + token);
    this._token = token;
  };

  iptv.prototype.reset = function () {
    this._type = 0;
  };

  iptv.prototype.checkMode = function () {
    const initdata = AppStore.profile ? AppStore.profile.getInitData() : null;
    if (!AppStore.appStaticInfo.checkHomeZone() || initdata == null) {
      this._type = 0;
      debug.alert("iptv.prototype.checkMode HomeZone Type = " + this._type);
      return;
    }

    if (initdata.ef) {
      if (initdata.ef == "I") {
        var ef = initdata.ef;
        if (this.es_primer_autologin()) {
          ef += "_AU1";
        } else if (this.es_autologin()) {
          ef += "_AU";
        }
        if (this.es_usuario_sin_claves()) {
          ef += "_SC";
        }
      }
      debug.alert("iptv.prototype.checkMode ef = " + ef);
      AppStore.tfnAnalytics.set_initdata_ef(ef);
      convivaAPI.set_initdata_ef(ef);
    }
    if (initdata.ef == null || initdata.ef == "A" || initdata.ef == "K") {
      if (initdata.multiHogar != null && (initdata.multiHogar == "true" || initdata.multiHogar == true)) this._type = 2;
      else this._type = 0;
    } else if (initdata.ef == "I") {
      if (initdata.multiHogar != null && (initdata.multiHogar == "true" || initdata.multiHogar == true)) this._type = 3;
      else this._type = 1;
      this._is_router_valid = false;
    }

    debug.alert(
      "iptv.prototype.checkMode HomeZone Type & router valid = " +
        this._type +
        " , es_router_valid = " +
        this._is_router_valid
    );

    return this._type;
  };

  this._es_primer_autologin = false;
  iptv.prototype.es_primer_autologin = function () {
    var es_autologin = AppStore.login.isAutologin();
    var has_last_profile = unirlib.hasLastProfile();
    var es_primer_autologin = es_autologin && !has_last_profile;
    return es_primer_autologin;
  };

  iptv.prototype.es_autologin = function () {
    var es_autologin = AppStore.login.isAutologin();
    var has_last_profile = unirlib.hasLastProfile();
    var es_autologin = es_autologin && has_last_profile;
    return es_autologin;
  };

  iptv.prototype.es_usuario_sin_claves = function () {
    var tiene_claves = AppStore.login.hasAutologinClaves();
    var es_autologin = AppStore.login.isAutologin();
    var sin_claves = !tiene_claves && es_autologin;
    return sin_claves;
  };

  iptv.prototype.getIcon = function () {
    if (!AppStore.appStaticInfo.checkHomeZone()) return null;

    var icon = null;
    if (this._type == 2) icon = AppStore.wsData.getDefaultImage("homezoneoff");
    else if (this._type == 3) icon = AppStore.wsData.getDefaultImage("homezoneiptv");

    return icon;
  };

  iptv.prototype.getText = function () {
    if (!AppStore.appStaticInfo.checkHomeZone()) return null;

    var txt = null;
    if (this._type == 2) txt = "Fuera de casa";
    else if (this._type == 3) txt = "En casa";

    return txt;
  };

  iptv.prototype.isShowWelcome = function () {
    return false;
  };

  iptv.prototype.showWelcome = function () {
    debug.alert("iptv.prototype.showWelcome");

    var msg = "I_Carga_1";
    if (this._type == 3) msg = "I_Carga_2";

    AppStore.errors.showError("HomeScene", "HomeScene", "carga", msg, false);

    AppStore.preferences.setConfHomezoneMsg(1);
    AppStore.preferences.savePreferences();
  };

  iptv.prototype.getTime = function () {
    debug.alert("iptv.prototype.getTime");
    this._is_router_valid = false;

    var routerIP = null;
    try {
      routerIP = AppStore.network.getRouterIP();
      debug.alert("iptv.prototype.getTime routerIP " + routerIP);
    } catch (e) {
      return;
    }
    if (!routerIP) return;

    var URL2 = AppStore.wsData._SRV_IPTV_TIME;
    URL2 = URL2.replace("{IP_ROUTER}", routerIP);

    var self = this;

    var XMLHttpRequestObject = new XMLHttpRequest();
    if (XMLHttpRequestObject.overrideMimeType) {
      XMLHttpRequestObject.overrideMimeType("text/xml");
    }

    XMLHttpRequestObject.open("GET", URL2, false); // false: sync
    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 10000); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      debug.alert("iptv.prototype.getTime ABORT REQUEST: TIMEOUT!!!");
      XMLHttpRequestObject.abort();
    }

    XMLHttpRequestObject.onreadystatechange = function () {
      debug.alert("iptv.prototype.getTime: " + XMLHttpRequestObject.readyState + " " + XMLHttpRequestObject.status);

      if (XMLHttpRequestObject.readyState == 4) {
        var status = XMLHttpRequestObject.status;
        //status = 404;
        window.clearTimeout(xmlHttpTimeout);
        if (status == 200) {
          self._is_router_valid = true;
        } else {
          self._is_router_valid = false;
        }
      }
    };

    try {
      XMLHttpRequestObject.send();
    } catch (errSend) {
      debug.alert("iptv.prototype.getTime Error Send: " + errSend.toString());
      self._is_router_valid = false;
      window.clearTimeout(xmlHttpTimeout);
    }
  };

  iptv.prototype.getDetails = function () {
    if (!AppStore.appStaticInfo.checkHomeZone()) return null;

    debug.alert("iptv.prototype.getDetails");
    this._streams_audio = null;
    this._streams_subs = null;

    this._pid_index = 0;

    var success = false;

    var routerIP = AppStore.network.getRouterIP();
    debug.alert("iptv.prototype.getDetails routerIP " + routerIP);
    var msession = AppStore.yPlayerCommon.getMSession();
    debug.alert("iptv.prototype.getDetails msession " + msession);

    var URL2 = AppStore.wsData._SRV_IPTV_DETAILS;
    URL2 = URL2.replace("{IP_ROUTER}", routerIP);
    URL2 = URL2.replace("{sesion}", msession);

    debug.alert("iptv.prototype.getDetails getDetails " + URL2);

    var self = this;

    var XMLHttpRequestObject = new XMLHttpRequest();
    if (XMLHttpRequestObject.overrideMimeType) {
      XMLHttpRequestObject.overrideMimeType("text/xml");
    }

    XMLHttpRequestObject.open("GET", URL2, false); // false: sync
    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 10000); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      debug.alert("iptv.prototype.getDetails ABORT REQUEST: TIMEOUT!!!");
      XMLHttpRequestObject.abort();
    }

    XMLHttpRequestObject.onreadystatechange = function () {
      debug.alert("iptv.prototype.getDetails: " + XMLHttpRequestObject.readyState + " " + XMLHttpRequestObject.status);

      if (XMLHttpRequestObject.readyState == 4) {
        var status = XMLHttpRequestObject.status;
        //status = 404;
        window.clearTimeout(xmlHttpTimeout);
        if (status == 200) {
          try {
            self.parseDetails(JSON.parse(XMLHttpRequestObject.responseText));
            debug.alert("iptv.prototype.getDetails OK: " + XMLHttpRequestObject.responseText);

            success = true;
          } catch (e) {
            debug.alert("iptv.prototype.getDetails error reading the response: " + e.toString());
          }
        } else if (status == 404) {
          debug.alert("iptv.prototype.getDetails status 404");
          success = false;
        } else {
          success = false;
        }
      }
    };

    try {
      XMLHttpRequestObject.send();
    } catch (errSend) {
      debug.alert("iptv.prototype.getDetails Error Send: " + errSend.toString());
      success = false;
      window.clearTimeout(xmlHttpTimeout);
    }

    return success;
  };

  iptv.prototype.getChannels = function () {
    if (!AppStore.appStaticInfo.checkHomeZone()) return null;

    debug.alert("iptv.prototype.getChannels");

    var success = false;
    this._channels = null;

    var routerIP = AppStore.network.getRouterIP();
    debug.alert("iptv.prototype.getChannels routerIP " + routerIP);

    var URL2 = AppStore.wsData._SRV_IPTV_CHANNELS;
    URL2 = URL2.replace("{IP_ROUTER}", routerIP);
    debug.alert("iptv.prototype.getChannels getChannels " + URL2);

    var self = this;

    var XMLHttpRequestObject = new XMLHttpRequest();
    if (XMLHttpRequestObject.overrideMimeType) {
      XMLHttpRequestObject.overrideMimeType("text/xml");
    }

    XMLHttpRequestObject.open("GET", URL2, false); // false: sync
    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 10000); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      debug.alert("iptv.prototype.getChannels ABORT REQUEST: TIMEOUT!!!");
      XMLHttpRequestObject.abort();
    }

    XMLHttpRequestObject.onreadystatechange = function () {
      debug.alert("iptv.prototype.getChannels: " + XMLHttpRequestObject.readyState + " " + XMLHttpRequestObject.status);

      if (XMLHttpRequestObject.readyState == 4) {
        debug.alert("iptv.prototype.getChannels ENTER ");
        var status = XMLHttpRequestObject.status;
        debug.alert("iptv.prototype.status: " + status);

        //status = 404;
        window.clearTimeout(xmlHttpTimeout);
        debug.alert("iptv.prototype.status2: " + status);
        if (status == 200) {
          try {
            debug.alert("iptv.prototype.getChannels OK xxxx");
            debug.alert("iptv.prototype.getChannels OK 000: " + XMLHttpRequestObject.responseText);
            self._channels = JSON.parse(XMLHttpRequestObject.responseText);
            debug.alert("iptv.prototype.getChannels OK: " + XMLHttpRequestObject.responseText);

            success = true;
          } catch (e) {
            debug.alert("iptv.prototype.getChannels error reading the response: " + e.toString());
          }
        } else if (status == 404) {
          debug.alert("iptv.prototype.getChannels status 404");
          success = false;
        } else {
          debug.alert("iptv.prototype.getChannels status " + status);
          success = false;
        }
      }
    };

    try {
      XMLHttpRequestObject.send();
    } catch (errSend) {
      debug.alert("iptv.prototype.getChannels Error Send: " + errSend.toString());
      success = false;
      window.clearTimeout(xmlHttpTimeout);
    }

    debug.alert("iptv.prototype.getChannels END");

    return success;
  };

  iptv.prototype.switchPID = function (type, index) {
    debug.alert("iptv.prototype.switchPID " + index);

    if (type == "audio" && this._streams_audio != null && index < this._streams_audio.length) {
      const stream = this._streams_audio[index];
      var routerIP = AppStore.network.getRouterIP();
      debug.alert("iptv.prototype.switchPID routerIP " + routerIP);
      var msession = AppStore.yPlayerCommon.getMSession();
      debug.alert("iptv.prototype.switchPID msession " + msession);

      var URL2 = AppStore.wsData._SRV_IPTV_FILTERAUDIO;
      URL2 = URL2.replace("{IP_ROUTER}", routerIP);
      URL2 = URL2.replace("{sesion}", msession);
      URL2 = URL2.replace("{PID_AUDIO}", stream.pid);

      this.setFilter(URL2);
    } else if (type == "subtitle" && this._streams_subs != null && index < this._streams_subs.length) {
      const stream = this._streams_subs[index];
      var routerIP = AppStore.network.getRouterIP();
      debug.alert("iptv.prototype.switchPID routerIP " + routerIP);
      var msession = AppStore.yPlayerCommon.getMSession();
      debug.alert("iptv.prototype.switchPID msession " + msession);

      var URL2 = AppStore.wsData._SRV_IPTV_FILTERSUBTITLE;
      URL2 = URL2.replace("{IP_ROUTER}", routerIP);
      URL2 = URL2.replace("{sesion}", msession);
      URL2 = URL2.replace("{PID_SUBTITLE}", stream.pid);

      this.setFilter(URL2);
    }
  };

  iptv.prototype.setFilter = function (url) {
    if (!AppStore.appStaticInfo.checkHomeZone()) return null;

    debug.alert("iptv.prototype.setFilter " + url);

    var success = false;

    var XMLHttpRequestObject = new XMLHttpRequest();
    if (XMLHttpRequestObject.overrideMimeType) {
      XMLHttpRequestObject.overrideMimeType("text/xml");
    }

    XMLHttpRequestObject.open("GET", url, false); // false: sync
    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 10000); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      debug.alert("iptv.prototype.setFilter ABORT REQUEST: TIMEOUT!!!");
      XMLHttpRequestObject.abort();
    }

    XMLHttpRequestObject.onreadystatechange = function () {
      debug.alert("iptv.prototype.setFilter: " + XMLHttpRequestObject.readyState + " " + XMLHttpRequestObject.status);

      if (XMLHttpRequestObject.readyState == 4) {
        var status = XMLHttpRequestObject.status;
        //status = 404;
        window.clearTimeout(xmlHttpTimeout);
        if (status == 200) {
          try {
            debug.alert("iptv.prototype.setFilter OK: " + XMLHttpRequestObject.responseText);

            success = true;
          } catch (e) {
            debug.alert("iptv.prototype.setFilter error reading the response: " + e.toString());
          }
        } else if (status == 404) {
          debug.alert("iptv.prototype.setFilter status 404");
          success = false;
        } else {
          success = false;
        }
      }
    };

    try {
      XMLHttpRequestObject.send();
    } catch (errSend) {
      debug.alert("iptv.prototype.setFilter Error Send: " + errSend.toString());
      success = false;
      window.clearTimeout(xmlHttpTimeout);
    }

    return success;
  };

  iptv.prototype.setAudios = function () {
    debug.alert("iptv.prototype.setAudios ");
    debug.alert("this._streams_audio.length  " + this._streams_audio.length);

    if (this._streams_audio == null || this._streams_audio.length == 0) {
      AppStore.yPlayerCommon.getScene().addAudio(0, "Español");
    } else {
      debug.alert("iptv.prototype.setAudios length " + this._streams_audio.length);

      for (var i = 0; i < this._streams_audio.length; i++) {
        var stream = this._streams_audio[i];
        debug.alert("iptv.prototype.setAudios stream.code " + stream.code);
        var idioma = AppStore.yPlayerCommon.getAudioLangCode(stream.code);
        AppStore.yPlayerCommon.getScene().addAudio(i, idioma);
      }
    }
  };

  iptv.prototype.setSubs = function () {
    debug.alert("iptv.prototype.setSubs ");

    if (this._streams_subs == null || this._streams_subs.length == 0) {
      AppStore.yPlayerCommon.getScene().addSubtitulo(0, "NINGUNO", null);
    } else {
      AppStore.yPlayerCommon.getScene().addSubtitulo(0, "NINGUNO", null);

      for (var i = 0; i < this._streams_subs.length; i++) {
        var stream = this._streams_subs[i];
        var idioma = AppStore.yPlayerCommon.getAudioLangCode(stream.code);
        AppStore.yPlayerCommon.getScene().addSubtitulo(i + 1, idioma, null);
      }
    }
  };

  iptv.prototype.parseDetails = function (json_details) {
    debug.alert("iptv.prototype.parseDetails");
    var naudios = 0;
    var nsubs = 0;

    if (json_details == null) {
      this._streams_audio = null;
      this._streams_subs = null;
    } else {
      this._streams_audio = new Array();
      this._streams_subs = new Array();

      var nstreams = json_details.data.streams.length;

      for (var i = 0; i < nstreams; i++) {
        var stream = json_details.data.streams[i];
        if (stream.type == "audio") {
          this._streams_audio[naudios] = stream;
          naudios++;
        }
        if (stream.type == "subtitle") {
          this._streams_subs[nsubs] = stream;
          nsubs++;
        }
      }
    }

    debug.alert("iptv.prototype.parseDetails END " + naudios + " " + nsubs);
  };

  iptv.prototype.onMsgHomeZone = function (destino) {
    debug.alert("iptv.prototype.onMsgHomeZone ->" + destino);
    AppStore.errors.showError("", destino, "carga", "I_Carga_1", false);
  };
};
