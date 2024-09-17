import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { adDisplay, adResponse } from "@unirlib/server/yPlayerAds";

let instance = null;

export class LogMng {
  constructor() {}
  static get instance() {
    if (instance) {
      return instance;
    }
    instance = new LogMng();
    return instance;
  }

  getHeader() {
    return {
      timestamp: new Date().getTime(),
      adminCode: AppStore.login.getAccountNumber(),
      deviceID: unirlib.getDeviceId(),
      dwMode: AppStore.appStaticInfo.getDwMode(),
      dman: AppStore.appStaticInfo.getManufacturer(),
      dmod: Main.getDevModel(),
    };
  }
  adServerLog(info) {
    if (unirlib.is_incidence_mode_on()) return;
    if (!AppStore.wsData.activaMonitorizacion) return;

    const log = {};
    log.par = [];
    let adUrl;
    if (info.result === 200 && adResponse.adsArr.length > 0) {
      for (let i = 0; i < adResponse.adsArr.length; i++) {
        const creative = adDisplay.getVideoCreative(adResponse.adsArr[i]);
        adUrl = creative?.mediaFiles[0]?.uri;
        if (!adUrl || adUrl === "") adUrl = "EMPTY";
        log.par.push({ k: "ads", v: adUrl });
      }
    } else {
      log.par.push({ k: "ads", v: "EMPTY" });
    }

    switch (info.svc) {
      case "voditems":
        info.svc = "vod";
        break;
      case "NPVR":
        info.svc = "npvr";
        break;
      case "U7D":
        info.svc = "cutv";
        break;
      case "SO":
        info.svc = "so";
        break;
    }

    log.evt = 55;
    log.tse = new Date().getTime();
    log.svc = info.svc;
    log.type = "adServer";
    log.url = info.scu;
    log.res = info.result?.toString();
    log.time = info.time;
    this.sendLog(log);
  }
  cscErrorEvent(info) {
    if (unirlib.is_incidence_mode_on()) return;
    if (!AppStore.wsData.activaMonitorizacion) return;

    const log = {
      evt: 72,
      tse: new Date().getTime(),
      url: info.url,
      error: info.errorCode,
    };
    this.sendLog(log);
  }
  epLaunchError(partner, errorReason) {
    if (unirlib.is_incidence_mode_on()) return;
    if (!AppStore.wsData.activaMonitorizacion) return;

    const log = {
      evt: 77,
      tse: Date.now(),
      partner,
      type: 10,
      reason: errorReason,
      //params, //para usos futuros
    };
    this.sendLog(log);
  }
  epCloseError(partner) {
    if (unirlib.is_incidence_mode_on()) return;
    if (!AppStore.wsData.activaMonitorizacion) return;

    const log = {
      evt: 77,
      tse: Date.now(),
      partner,
      //code, //relleno por MW
      type: 10,
      //params, //para usos futuros
    };
    this.sendLog(log);
  }
  sendLog(log) {
    Main.sendDataMonitoring(log);
  }
}
