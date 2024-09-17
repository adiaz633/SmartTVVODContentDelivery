import { parseUrl } from "src/code/js/lib";
import { AppStore } from "src/code/managers/store/app-store";
import { Utils } from "@unirlib/utils/Utils";

let _instance = null;

export class PlayerDetailsService {
  /**
   * @type {import("./player-details-service").PlayerDetailsService}
   */
  static get instance() {
    if (_instance) {
      return _instance;
    }
    _instance = new PlayerDetailsService();
    return _instance;
  }

  /**
   * Recupera el JSON de un evento contra backend ("details")
   * @public
   * @name callDetails
   * @param {Object|null} event Contenido/programa que queremos consultar
   * @returns {Promise<Object>} Devuelve el JSON con los datos
   */
  callDetails(event = null) {
    const url = this._getUrlCall(event);

    const tout = parseInt(AppStore.wsData._timeout);
    const retry_limit = parseInt(AppStore.wsData._retries);
    var get_data = new Promise(function (resolve, reject) {
      Utils.ajax({
        url,
        retryLimit: retry_limit,
        need_token: AppStore.appStaticInfo.getTVModelName() === "iptv2",
        success(data, status, xhr) {
          var json = JSON.parse(xhr.responseText);
          resolve(json);
        },
        error(xhr, textStatus) {
          if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else reject(xhr.status);
          } else reject(xhr.status);
        },
        timeout: tout,
      });
    });
    return get_data;
  }

  _getUrlCall(event = null) {
    const url =
      AppStore.appStaticInfo.getTVModelName() === "iptv2"
        ? this._prepareUrlLoadDetailsByDvdipi(event)
        : this._prepareUrlLoadDetailsByHttp(event);
    return url;
  }

  _prepareUrlLoadDetailsByHttp(event = null) {
    return event?.Ficha;
  }

  /**
   * @private
   * @param {import ("../../model/programEpgDvbipi").programEpgDvbipi} evento
   * @returns {string}
   */
  _prepareUrlLoadDetailsByDvdipi(evento = null) {
    const profile = AppStore.login.getProfile();
    var query = AppStore.wsData.getURLTkservice("tfgunir/consultas", "ficha_EPG");
    const serviceUid = evento?.getCanal()?.referenceIdByQuality;
    var url = query.url
      .toLowerCase()
      .replace("{contentid}", evento?.ShowId)
      .replace("{serviceuid}", serviceUid)
      .replace("{profile}", profile);
    url = parseUrl(url, true);
    return url;
  }
}
