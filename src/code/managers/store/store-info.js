import { appConfig } from "@appConfig";
import { STORES } from "src/code/managers/store/app-store";

/**
 * Clase de informacion rapida
 */
export class StoreInfo {
  /**
   * Crea una nueva instancia del Store info
   * @param {import("./app-store").AppStore} store
   */
  constructor(store) {
    /**
     * True si es un emulador
     * @type {boolean}
     */
    this.isEmulator = false;

    /**
     * true si es un blue ray
     */
    this.isBluRay = false;

    /**
     * Referencia al concentrador de dependencias
     * @private
     * @type {import("./app-store").AppStore}
     */
    this._store = store;

    /**
     * TV Model
     * @private
     * @type {number}
     */
    this._tv_model = 0;
  }

  isToken() {
    if (this.isEmulator) return true;
    if (!this._store.get(STORES.ws_data)._token_enabled) return false;
    return true;
  }

  setTvModel(tv_model) {
    this._tv_model = tv_model;
  }

  hasPixel() {
    var pixel_flag = this._store.get(STORES.ws_data) ? this._store.get(STORES.ws_data)._pixel : false;
    return pixel_flag && (this._tv_model == 1 || this._tv_model == 6);
  }

  getAppType() {
    if (this._tv_model == 10) return "stb";
    else return "app";
  }

  getTVModel() {
    return this._tv_model;
  }

  getTVModelName() {
    var result = "samsung";
    if (this._tv_model == 1) result = "lg";
    else if (this._tv_model == 2) result = "sonytv";
    else if (this._tv_model == 3) result = "ps3";
    else if (this._tv_model == 4) result = "ps4";
    else if (this._tv_model == 6) result = "samsung_tizen2015";
    // 2015
    else if (this._tv_model == 7) result = "samsung_tizen";
    // 2016
    else if (this._tv_model == 8) result = "android.tv";
    else if (this._tv_model == 9) result = "hisense";
    else if (this._tv_model == 10) result = "iptv2";

    return result;
  }

  isTvApp() {
    return this.getTVModelName() === "iptv2";
  }

  getDeviceClass() {
    var result = "samsung";
    if (this._tv_model == 1) result = "lg";
    else if (this._tv_model == 2) result = "sonytv";
    else if (this._tv_model == 3) result = "ps3";
    else if (this._tv_model == 4) result = "ps4";
    else if (this._tv_model == 6 || this._tv_model == 7) result = "samsung_tizen";
    else if (this._tv_model == 8) result = "android.tv";
    else if (this._tv_model == 9) result = "hisense";
    else if (this._tv_model == 10) result = "iptv2";

    return result;
  }

  getManufacturer() {
    var result = "SAMSUNG";
    if (this._tv_model == 1) result = "LG";
    else if (this._tv_model == 2) result = "SONYTV";
    else if (this._tv_model == 3) result = "PS3";
    else if (this._tv_model == 4) result = "PS4";
    else if (this._tv_model == 5) result = "ANDROID.TV";
    else if (this._tv_model == 6) result = "SAMSUNG";
    // 2015
    else if (this._tv_model == 7) result = "SAMSUNG";
    // 2016
    else if (this._tv_model == 8) result = this._store.get(STORES.device).getManufacturer();
    else if (this._tv_model == 9) result = "HISENSE";
    else if (this._tv_model == 10) result = this._store.get(STORES.device).getManufacturer();

    return result;
  }

  getDwMode() {
    var result = "SMG_OTT";
    if (this._tv_model == 1) result = "LG_OTT";
    else if (this._tv_model == 2) result = "SONY_OTT";
    else if (this._tv_model == 3) result = "PS3_OTT";
    else if (this._tv_model == 4) result = "PS4_OTT";
    else if (this._tv_model == 5) result = "ANT_OTT";
    else if (this._tv_model == 6) result = "SMG_OTT";
    else if (this._tv_model == 7) result = "SMG_OTT";
    else if (this._tv_model == 8) result = "ANTV_OTT";
    else if (this._tv_model == 9) result = "HISENSE_OTT";
    else if (this._tv_model == 10) result = "STB_IPTV";

    return result;
  }

  /* Da el nombre del dispositivo al que tiene linkada la compra */
  getDispositivo() {
    var result = "smg";
    if (this._tv_model == 1) result = "lg";
    else if (this._tv_model == 2) result = "sonytv";
    else if (this._tv_model == 3) result = "ps3";
    else if (this._tv_model == 4) result = "ps4";
    else if (this._tv_model == 5) result = "android.tv";
    else if (this._tv_model == 6) result = "smg";
    else if (this._tv_model == 7) result = "smg";
    else if (this._tv_model == 8) result = "atv";
    else if (this._tv_model == 9) result = "hisensetv";
    else if (this._tv_model == 10) result = "iptv2";

    return result;
  }

  getAppName() {
    return "tfgunir"
  }

  isAmazonFireTV() {
    return this._tv_model == 8 && appConfig.ANDROID_TV_MODEL == "amazon.tv";
  }

  isAndroidTV() {
    return this._tv_model == 8 && appConfig.ANDROID_TV_MODEL != "amazon.tv";
  }

  isTizenNativeTV() {
    return this._tv_model === 7 && this._store.get(STORES.device).getTizenPlatform() === 2016;
  }

  getDeviceCode() {
    var dc = "SMARTV_OTT";
    if (this._store.get(STORES.device).is_native_player_device()) dc = this.getDwMode();
    return dc;
  }

  checkHomeZone() {
    return this._store.get(STORES.ws_data)._homezone_check;
  }

  getPlayerVersion() {
    var appVersion = "";
    switch (this.getTVModelName()) {
      case "lg":
        appVersion = appConfig.WEBOS_VERSION;
        break;
      case "samsung_tizen":
        appVersion = appConfig.TIZEN_VERSION;
        break;
      case "samsung":
      case "samsung_tizen2015":
        appVersion = "";
        break;
      case "android.tv":
        if (this.isAmazonFireTV()) appVersion = appConfig.FIRETV_VERSION;
        else appVersion = appConfig.ANDROIDTV_VERSION;
        break;
      case "hisense":
        appVersion = appConfig.HISENSE_VIDAA_VERSION;
        break;
      default:
        break;
    }
    return appVersion;
  }

  get_so() {
    return this._store.get(STORES.device).get_so();
  }

  is_native_player_device() {
    return this._store.get(STORES.device)?.is_native_player_device();
  }

  is_mdrm_player_device() {
    return this._store.get(STORES.device)?.is_mdrm_player_device();
  }

  getServerTime() {
    if (!this._store.has(STORES.servertime)) return new Date();

    return this._store.get(STORES.servertime).getServerTime();
  }

  refreshServerTime() {
    this._store.get(STORES.servertime).refresh();
  }

  start_set_apptime_interval() {
    this._store.get(STORES.servertime).start_set_apptime_interval();
  }

  stop_set_apptime_interval() {
    this._store.get(STORES.servertime).stop_set_apptime_interval();
  }

  get_apptime() {
    return this._store.get(STORES.servertime).get_apptime();
  }

  checkNetworkConnection() {
    var hay_red = false;
    try {
      hay_red = this._store.get(STORES.network).checkNetworkConnection();
    } catch (e) {
      console.error("checkNetworkConnection ERROR " + e.toString());
    }
    return hay_red;
  }
}
