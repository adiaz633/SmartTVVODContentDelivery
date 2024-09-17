import { appConfig } from "@appConfig";
import { AuthMng } from "src/code/managers/auth-mng";
import { InactivityMng } from "src/code/managers/inactivity-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

import { DataProperties } from "./data-properties";

const LOADED_EVENT_NAME = "loaded";

export class ServiceDirectoryData extends DataProperties {
  hasServiceDirectory() {
    return this.j_servicios !== null && this.j_servicios !== undefined && this.j_servicios?.services !== null;
  }

  async loadUrlServiceDirectory() {
    return "https://pub-2e6b98b29263474fa786f4b2e779246b.r2.dev/ws.json";
  }

  async loadServiceDirectory() {
    debugger;
    const self = this;
    const url = await this.loadUrlServiceDirectory();

    await Utils.fetchWithTimeout(url, 3000, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (response.status === 200 || response.status === 202) {
          self._SDLoadedOk = true;
        }
        const responseData = await response.json();
        await self.save_services_json(responseData);
      })
      .catch((error) => {
        self._SDLoadedOk = false;
        console.error("Error load service directory", error);
      });
  }

  async save_services_json(json) {
    /* asignamos el json de servicios*/
    this.j_servicios = json;
    /* generamos las estructuras de datos de los servicios */
    this._SRV_TOKENS_MAP = {};

    const nhosts = this.j_servicios.services.host.length;
    for (let i = 0; i < nhosts; i++) {
      const host = this.j_servicios.services.host[i];
      const hostid = host["@id"];
      const hostaddress = host["@address"];

      if (hostid == "default") this._DEFAULT_HOST = hostaddress;
      else if (hostid == "seguro") this._SECURE_HOST = hostaddress;
      else if (hostid == "local") this._LOCAL_HOST = hostaddress;
      else if (hostid == "cache") this._CACHE_HOST = hostaddress;
      else if (hostid == "quative") this._QUATIVE_HOST = hostaddress;
      else if (hostid == "squative") this._SQUATIVE_HOST = hostaddress;
      else if (hostid == "timeserver") this._TIME_HOST = hostaddress;
      else if (hostid == "convivaserver") this._CONVIVA_SERVER = hostaddress;
      else if (hostid == "pixelserver") this._PIXEL_SERVER = hostaddress;
      else if (hostid == "adserver") this._AD_SERVER = hostaddress;
      else if (hostid == "httpserver") this._HTTP_SERVER = hostaddress;
      else if (hostid == "sdp") this._SDP_SERVER = hostaddress;
      else if (hostid == "sdp_seguro") this._SDP_SEGURO_SERVER = hostaddress;
      else if (hostid == "login_fau") this._LOGIN_FAU_SERVER = hostaddress;
    }

    const nservices = this.j_servicios.services.service.length;
    for (let i = 0; i < nservices; i++) {
      const serv = this.j_servicios.services.service[i];
      const servname = this.j_servicios.services.service[i]["@name"];
      let endpoints = [];

      if (Array.isArray(serv.endpoint)) {
        endpoints = serv.endpoint;
      } else {
        // Convert endpoints into array if only 1
        endpoints.push(serv.endpoint);
      }

      for (let j = 0; j < endpoints.length; j++) {
        const endpoint = endpoints[j];
        const endpointname = endpoint["@name"];
        const address = endpoint["@address"];

        const token_pair = { t: false, thz: false };
        token_pair.t = endpoint["@t"] && endpoint["@t"] == "true" ? true : false;
        token_pair.thz = endpoint["@thz"] && endpoint["@thz"] == "true" ? true : false;

      }
    }
    this._SRV_CANALES = this._SRV_CANALES_PERFIL;

    if (this.j_servicios.services.Context["time_out_firstframedisplayed"] != null) {
      this._time_out_firstframedisplayed = this.j_servicios.services.Context["time_out_firstframedisplayed"];
    }

    if (this.j_servicios.services.Context["showsimilarplayer"] != null) {
      this._showsimilarplayer = this.j_servicios.services.Context["showsimilarplayer"] === "true";
    }

    if (this.j_servicios.services.Context["showsimilarMiniguide"] != null) {
      this._showsimilarMiniguide = this.j_servicios.services.Context["showsimilarMiniguide"] === "true";
    }

    if (this.j_servicios.services.Context["_hellocheckadm"] != null) {
      this._hellocheckadm = this.j_servicios.services.Context["_hellocheckadm"];
    }

    if (this.j_servicios.services.Context["TimeoutMinivodM360"] != null) {
      this._timeout_minivod_m360 = this.j_servicios.services.Context["TimeoutMinivodM360"];
    }

    if (this.j_servicios.services.Context["session_duration"] != null) {
      this._session_duration = this.j_servicios.services.Context["session_duration"];
    }

    if (this.j_servicios.services.Context["keepsession_duration"] != null) {
      this._keepsession_duration = this.j_servicios.services.Context["keepsession_duration"];
    }

    if (this.j_servicios.services.Context["inactivity_check"] != null) {
      this._inactivity_check = this.j_servicios.services.Context["inactivity_check"];
    }

    if (this.j_servicios.services.Context["inactivity_timer_residencial"] != null) {
      this._inactivity_timer_residencial = this.j_servicios.services.Context["inactivity_timer_residencial"];
    }

    if (this.j_servicios.services.Context["inactivity_timer_horeca"] != null) {
      this._inactivity_timer_horeca = this.j_servicios.services.Context["inactivity_timer_horeca"];
    }

    if (this.j_servicios.services.Context["inactivity_popup_timer"] != null) {
      this._inactivity_popup_timer = this.j_servicios.services.Context["inactivity_popup_timer"];
    }

    if (this.j_servicios.services.Context["modo_apagado"] != null) {
      this._modo_apagado = this.j_servicios.services.Context["modo_apagado"];
    }

    if (this.j_servicios.services.Context["timerMiniguideSide"] != null) {
      this._timer_miniguide_side = this.j_servicios.services.Context["timerMiniguideSide"];
    }

    if (this.j_servicios.services.Context["timerDialNumbers"] != null) {
      this._timer_dial_numbers = this.j_servicios.services.Context["timerDialNumbers"];
    }

    if (this.j_servicios.services.Context["delayShowTooltip_menu_ficha"] != null) {
      this._delay_show_tooltip_menu_ficha = this.j_servicios.services.Context["delayShowTooltip_menu_ficha"];
    }

    if (this.j_servicios.services.Context["delayHideTooltip_menu_ficha"] != null) {
      this._delay_hide_tooltip_menu_ficha = this.j_servicios.services.Context["delayHideTooltip_menu_ficha"];
    }

    if (this.j_servicios.services.Context["timerShowTooltip"] != null) {
      this._timer_show_tooltip = this.j_servicios.services.Context["timerShowTooltip"];
    }

    if (this.j_servicios.services.Context["timerHideTooltip"] != null) {
      this._timer_hide_tooltip = this.j_servicios.services.Context["timerHideTooltip"];
    }

    if (this.j_servicios.services.Context["timer_lanzamiento_mod"] != null) {
      this._timer_lanzamiento_mod = this.j_servicios.services.Context["timer_lanzamiento_mod"];
    }

    if (this.j_servicios.services.Context["timerHideMinivod"] != null) {
      this._timer_hide_minivod = this.j_servicios.services.Context["timerHideMinivod"];
    }

    if (this.j_servicios.services.Context["timerHideMiniguide"] != null) {
      this._timer_hide_miniguide = this.j_servicios.services.Context["timerHideMiniguide"];
    }

    if (this.j_servicios.services.Context["timerHideMiniguide_sinmulticast"] != null) {
      this._timer_hide_miniguide_app_channel = this.j_servicios.services.Context["timerHideMiniguide_sinmulticast"];
    }

    if (this.j_servicios.services.Context["timerHidePlayerPublicidad"] != null) {
      this._timerHidePlayerPublicidad = this.j_servicios.services.Context["timerHidePlayerPublicidad"];
    }

    if (this.j_servicios.services.Context["EPGtimmerFanart"] != null) {
      this._epgTimerFanart = parseInt(this.j_servicios.services.Context["EPGtimmerFanart"]);
    }

    if (this.j_servicios.services.Context["TemporizadorPopUp"] != null) {
      this.TemporizadorPopUp = parseInt(this.j_servicios.services.Context["TemporizadorPopUp"]);
    }

    if (this.j_servicios.services.Context["numberItemsRecordingCarrousel"] != null) {
      this._numberItemsRecordingCarrousel = this.j_servicios.services.Context["numberItemsRecordingCarrousel"];
    }

    if (this.j_servicios.services.Context["timerDialError"] != null) {
      this._timer_dial_error = this.j_servicios.services.Context["timerDialError"];
    }

    if (this.j_servicios.services.Context["bookmark_set"] != null) {
      this._bookmark_set = this.j_servicios.services.Context["bookmark_set"];
    }

    if (
      this.j_servicios.services.Context["check_physical_network"] != null &&
      this.j_servicios.services.Context["check_physical_network"] == "false"
    ) {
      this._check_physical_network = false;
    }

    if (
      this.j_servicios.services.Context["check_http_network"] != null &&
      this.j_servicios.services.Context["check_http_network"] == "false"
    ) {
      this._check_http_network = false;
    }

    if (this.j_servicios.services.Context["network_check"] != null) {
      this._network_check = this.j_servicios.services.Context["network_check"];
    }

    if (this.j_servicios.services.Context["sleep_DRM_Agent"] != null) {
      this._sleep_DRM_Agent = this.j_servicios.services.Context["sleep_DRM_Agent"];
    }

    if (this.j_servicios.services.Context["min_bitrate"] != null) {
      this._min_bitrate = parseInt(this.j_servicios.services.Context["min_bitrate"]);
    }

    if (this.j_servicios.services.Context["max_bitrate"] != null) {
      this._max_bitrate = parseInt(this.j_servicios.services.Context["max_bitrate"]);
    }
    if (this.j_servicios.services.Context["sd_max_bitrate"] != null) {
      this._sd_max_bitrate = parseInt(this.j_servicios.services.Context["sd_max_bitrate"]);
    }
    if (this.j_servicios.services.Context["retries"] != null) {
      this._retries = this.j_servicios.services.Context["retries"];
    }

    if (this.j_servicios.services.Context["timeout"] != null) {
      this._timeout = this.j_servicios.services.Context["timeout"] * 1000;
    }

    if (this.j_servicios.services.Context["servidor_videos"] != null) {
      this._servidor_videos = this.j_servicios.services.Context["servidor_videos"] === "true";
    }

    if (this.j_servicios.services.Context["conviva"] != null) {
      this._conviva = this.j_servicios.services.Context["conviva"] === "true";
    }

    if (this.j_servicios.services.Context["porcentajeConviva"] != null) {
      this._porcentajeConviva = parseInt(this.j_servicios.services.Context["porcentajeConviva"]);
      this._randomConviva = Math.floor(Math.random() * 100);
    }

    if (this.j_servicios.services.Context["pixel"] != null) {
      this._pixel = this.j_servicios.services.Context["pixel"] === "true";
    }

    if (
      this.j_servicios.services.Context["pixel_ga"] != null &&
      this.j_servicios.services.Context["pixel_ga"] == "true"
    ) {
      this._pixel_ga = true;
    }
    if (
      this.j_servicios.services.Context["pixel_tfn"] != null &&
      this.j_servicios.services.Context["pixel_tfn"] == "true"
    ) {
      this._pixel_tfn = true;
    }

    if (
      this.j_servicios.services.Context["homezone_check"] != null &&
      this.j_servicios.services.Context["homezone_check"] == "true"
    ) {
      this._homezone_check = true;
    }
    if (
      this.j_servicios.services.Context["auto_trailer"] != null &&
      this.j_servicios.services.Context["auto_trailer"] == "true"
    ) {
      this._auto_trailer = true;
    }
    if (this.j_servicios.services.Context["estabilidad_live"] != null) {
      this._estabilidad_live = this.j_servicios.services.Context["estabilidad_live"] * 1000;
    }
    if (this.j_servicios.services.Context["recordings"] != null) {
      this._recordings_enabled = this.j_servicios.services.Context["recordings"] === "true";
    }
    if (this.j_servicios.services.Context["token"] != null) {
      this._token_enabled = this.j_servicios.services.Context["token"] === "true";
    }
    if (this.j_servicios.services.Context["modo_audio"] != null) {
      this._modo_audio = this.j_servicios.services.Context["modo_audio"];
    }
    if (this.j_servicios.services.Context["TimeoutMinivodM360"] != null) {
      this._timeoutMinivodM360 = this.j_servicios.services.Context["TimeoutMinivodM360"];
    }
    if (this.j_servicios.services.Context["maxDispoM360"] != null) {
      this._maxStoredDevices = this.j_servicios.services.Context["maxDispoM360"];
    }
    if (this.j_servicios.services.Context["TemporizadorPopUp"] != null) {
      this._temporizador_popUp = this.j_servicios.services.Context["TemporizadorPopUp"];
    }
    if (this.j_servicios.services.Context["activaMonitorizacion"] != null) {
      this.activaMonitorizacion = this.j_servicios.services.Context["activaMonitorizacion"] === "true";
    }
    if (this.j_servicios.services.Context["timerHideinfoextendida"] != null) {
      this._timerHideinfoextendida = parseInt(this.j_servicios.services.Context["timerHideinfoextendida"]);
    }
    if (this.j_servicios.services.Context["timerautoplaybillboard"] != null) {
      this.timerautoplaybillboard = parseInt(this.j_servicios.services.Context["timerautoplaybillboard"]);
    }

    if (this.j_servicios.services.Context["timer_estabilidad"] != null) {
      this._timer_estabilidad = this.j_servicios.services.Context["timer_estabilidad"] * 1000;
    }

    if (this.j_servicios.services.Context["update_catalogo3PA"] != null) {
      this.tpa_catalog_update_timer = this.j_servicios.services.Context["update_catalogo3PA"] * 1000;
    }

    if (this.j_servicios.services.Context["TMO_3PA_Stopped"] != null) {
      this.timer_stop_3pa = this.j_servicios.services.Context["TMO_3PA_Stopped"];
    }

    if (this.j_servicios.services.Context["TemporizadorPauseSO"] != null) {
      this._timer_pause_so = this.j_servicios.services.Context["TemporizadorPauseSO"];
    }

    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      try {
        // Guardamos directorio de servicios y su url en local storage
        await Main.setConfigParam("service_directory", this.j_servicios);
        const service_directory_url = await Main.getConfigParam("GvpServicesDirectory");
        await Main.setConfigParam("service_directory_url", service_directory_url);

        // Guardamos timeout OPCH en local storage
        const devModel = Main.getDevModel();
        const timeout_arranque = this.j_servicios.services.Context["timeout_arranque"];
        if (timeout_arranque && timeout_arranque[devModel]) {
          await Main.setConfigParam("timeout_arranque", timeout_arranque[devModel]);
        }

        const timeout_app = this.j_servicios.services.Context["timeout_app"];
        if (timeout_app && timeout_app[devModel]) {
          await Main.setConfigParam("timeout_app", timeout_app[devModel]);
        }

        // Seteamos inactivity status inicial
        const inactivityParams = {
          inactivity: false,
        };
        await Main.setValue("middleware", "inactivityStatus", inactivityParams);
        await InactivityMng.instance.initializeInactivity();
      } catch (err) {
        console.error(err);
      }
    }

    console.info("loaded");
    this.emit(LOADED_EVENT_NAME);
  }

  onLoaded(eventListener) {
    this.on(LOADED_EVENT_NAME, eventListener);
  }

  getBackgroundURL() {
    let imgUrl = "";

    if (this.j_servicios != null) {
      const js = unirlib.getJsonConfigGraphics();
      const urlFondo = js.VOD_graficos?.aplicacion.imagen[1]["@url"];
      const imgHTML = this._SRV_IMAGENES;
      imgUrl = imgHTML + urlFondo;
    }

    return imgUrl;
  }

  getDefaultImage(id) {
    let imgUrl = "";
    if (this.j_servicios != null) {
      const js = unirlib.getJsonConfigGraphics();
      let imgDef = null;
      const images = js.VOD_graficos?.aplicacion.imagen;
      const nimages = images.length;
      let i = 0;
      let exito = false;
      while (!exito && i < nimages) {
        exito = js.VOD_graficos?.aplicacion.imagen[i]["@id"] == id;
        if (!exito) {
          i++;
        }
      }
      if (exito) {
        imgDef = js.VOD_graficos?.aplicacion.imagen[i]["@url"];
        let imgHTML = this._SRV_IMAGENES;
        if (imgDef.search("http:") != -1) {
          imgHTML = "";
        }
        imgUrl = imgHTML + imgDef;
      }
    }
    return imgUrl;
  }

  getCintilloImage(id) {
    let imgUrl = "";
    if (this.j_servicios != null) {
      const js = unirlib.getJsonConfigGraphics();
      const confmenu = js.VOD_graficos?.ConfMenus.ConfMenu;
      let i = 0;
      let exito = false;
      while (!exito && i < confmenu.length) {
        exito = js.VOD_graficos?.ConfMenus.ConfMenu[i]["@id"] == "cintillos";
        if (!exito) {
          i++;
        }
      }
      if (exito) {
        let imgDef = null;
        const images = js.VOD_graficos?.ConfMenus.ConfMenu[i].imagen;
        const nimages = images.length;
        i = 0;
        exito = false;
        while (!exito && i < nimages) {
          exito = images[i]["@id"] == id;
          if (!exito) {
            i++;
          }
        }
        if (exito) {
          imgDef = images[i]["@url"];
          let imgHTML = this._SRV_IMAGENES;
          if (imgDef.search("http:") != -1) {
            imgHTML = "";
          }
          imgUrl = imgHTML + imgDef;
        } else {
          debug.alert(`ERROR: no se han encontrado el cintillo con id: ${id}`);
        }
      } else {
        debug.alert("ERROR: no se han encontrado las imagenes con id: cintillos");
      }
    }
    return imgUrl;
  }

  getModificador(id) {
    debug.alert(`data.prototype.getModificador (id) = ${id.toUpperCase()}`);
    let modDef = null;
    if (this.j_servicios != null) {
      const modificadores = unirlib.getJsonConfigMods();
      const nmods = modificadores.length;
      let i = 0;
      let exito = false;
      while (!exito && i < nmods) {
        exito = modificadores[i]["@id"].toUpperCase() == id.toUpperCase();
        if (!exito) {
          i++;
        }
      }
      if (exito) {
        modDef = modificadores[i];
        debug.alert(`data.prototype.getModificador modificador encontrado id: ${modDef["@id"].toUpperCase()}`);
      } else {
        debug.alert(`data.prototype.getModificador ERROR: no se han encontrado mod con id: ${id.toUpperCase()}`);
      }
    }

    return modDef;
  }

  estaNMIModificadorValue(value, modif) {
    debug.alert(`data.prototype.estaNMIModificadorValue ${value}`);
    let i = 0;
    let exito = false;
    const mod_length = modif && modif.parametro ? modif.parametro.length : 0;
    if (modif) {
      while (!exito && i < mod_length) {
        exito = modif.parametro[i]["@value"] == value;
        if (!exito) i++;
      }
    }
    return exito;
  }

  getServerAddress(hostid, address) {
    if (!this._host_addresses) this.load_host_adresses();

    let result = "";
    if (address) {
      if (address.indexOf("http:") == 0 || address.indexOf("https:") == 0) {
        result = address;
      } else {
        if (hostid && this._host_addresses[hostid]) {
          result = this._host_addresses[hostid] + address;
        } else {
          result = this._DEFAULT_HOST + address;
        }
      }
    }
    return result;
  }

  load_host_adresses() {
    const hosts = this.j_servicios.services.host;
    this._host_addresses = [];
    for (let i = 0; i < hosts.length; i++) this._host_addresses[hosts[i]["@id"]] = hosts[i]["@address"];
  }

  get_url_service_base_domain(url_site) {
    // Separamos, protocolo y el resto de la direccion
    const url_pos = url_site.indexOf("//");
    const url_dominio = url_site.substr(url_pos + 2);
    const url_protocolo = url_site.substr(0, url_pos + 2);
    // Separamos los subdominios
    const url_split = url_dominio.split("/");
    // Juntamos protocolo, mas dominio principal
    const url_base = url_protocolo + url_split[0];
    return url_base;
  }

  /**
   *
   * @returns {import("./context").DataContext}
   */
  getContext() {
    return this.j_servicios?.services.Context;
  }

  getItemContext(_keyContext, _nameConfig) {
    try {
      const CONTEXT = this.getContext();
      const item = CONTEXT ? CONTEXT[_keyContext] : null;
      if (_nameConfig && appConfig[_nameConfig] && item) appConfig[_nameConfig] = item;
      return item;
    } catch (e) {
      debug.alert(`Error al hacer get de la propiedad ${_keyContext}, (${e.toString()})`);
    }
  }
  /* eliminar:
data.prototype.replaceParam = (_url, _key, _value) => {
  let _regExpKey = new RegExp('{'+ _key +'}', 'gi');
  return _url.replace(_regExpKey, _value);
};
data.prototype.replaceOrDeleteParam = (_address, _key, _value) => {
  if (_value == null || _value == '') {
    let _url = new URL(_address);
    _url.searchParams.delete(_key);
    return _url.toString();
  } else {
    return this.replaceParam(_address, _key, _value);
  }
};
  data.prototype.replaceDemarcation = (_address) => {
      return this.replaceOrDeleteParam(_address, 'demarcation', (AppStore.profile.getInitData() || {}).demarcation);
  };
*/
  /**
   * @param {string} service
   * @param {string} endp
   * @returns {UrlTkService}
   */
  getURLTkservice(service, endp) {
    if (!this.j_servicios) {
      console.warn("[log] getURLTkservice j_servicios is empty");
      return;
    }
    const nservices = this.j_servicios.services.service.length;
    let serv = null;
    let servicio_encontrado = false;
    let url = "";
    let need_token = false;
    let need_hztoken = false;
    let need_header_deviceid = false;
    let retries = parseInt(this._retries);
    let timeout = parseInt(this._timeout_errores);
    let method = "GET";

    let i = 0;
    while (!servicio_encontrado && i < nservices) {
      servicio_encontrado = this.j_servicios.services.service[i]["@name"] == service;
      if (servicio_encontrado) serv = this.j_servicios.services.service[i];
      else i++;
    }
    if (servicio_encontrado) {
      if (!serv.endpoint.length) serv.endpoint = [serv.endpoint];
      const nendpoints = serv.endpoint.length;
      let j = 0;
      let endpoint_encontrado = false;
      while (!endpoint_encontrado && j < nendpoints) {
        const endpoint = serv.endpoint[j];
        endpoint_encontrado = endpoint["@name"] == endp;
        if (endpoint_encontrado) {
          if (endpoint["@verb"]) {
            method = endpoint["@verb"];
          }
          const address = endpoint["@address"];
          url = this.getServerAddress(endpoint["@ref_host"], address);
          const accessToken = endpoint["@t"];
          if (accessToken && accessToken == "true") need_token = true;
          const hzToken = endpoint["@thz"];
          if (hzToken && hzToken == "true") need_hztoken = true;
          const h_deviceid = endpoint["@header_deviceid"];
          if (h_deviceid && h_deviceid == "true") need_header_deviceid = true;

          if (endpoint["@retries"]) {
            retries = parseInt(endpoint["@retries"]);
          }
          if (endpoint["@timeout"]) {
            timeout = parseInt(endpoint["@timeout"]);
          }
        } else {
          j++;
        }
      }
    }

    let x_hzid = null;
    if (need_hztoken) {
      if (AppStore.profile) {
        const token = AppStore.profile.get_token();
        if (token && token != "null" && token != "") {
          x_hzid = AppStore.profile.get_token();
        }
      }
    }

    const urltk = {
      url,
      method,
      timeout,
      retries,
      x_hzid,
      need_token,
      need_hztoken,
      need_header_deviceid,
    };

    return urltk;
  }

  async getAuthorization(query) {
    let authorization = null;
    if (query.need_token || AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      const accessToken = AppStore.profile.get_access_token();
      if (accessToken && accessToken != "null" && accessToken != "") {
        if (appConfig.AUTHORIZATION_V2) {
          authorization = await AuthMng.instance.authConstructor(query.url, query.method, accessToken, query);
        } else {
          authorization = `Bearer ${accessToken}`;
        }
      }
    }
    return authorization;
  }

  hasServiceToken(service) {
    let has_token = false;
    if (this._SRV_TOKENS_MAP[service] && (this._SRV_TOKENS_MAP[service]["t"] || this._SRV_TOKENS_MAP[service]["thz"]))
      has_token = true;

    return has_token;
  }

  hasAccessToken(service) {
    let has_token = false;
    if (this._SRV_TOKENS_MAP[service] && this._SRV_TOKENS_MAP[service]["t"]) has_token = true;
    return has_token;
  }

  hasToken(service) {
    let has_token = false;
    if (this._SRV_TOKENS_MAP[service] && this._SRV_TOKENS_MAP[service]["thz"]) has_token = true;
    return has_token;
  }

  getDirectoryData() {
    return this.j_servicios;
  }
}

export const data = ServiceDirectoryData;

/**
 * @typedef UrlTkService
 * @property {string} url
 * @property {string} method
 * @property {string} timeout
 * @property {number} retries
 * @property {any} x_hzid
 * @property {boolean} need_token
 * @property {boolean} need_hztoken
 * @property {Blob} need_header_deviceid
 */
