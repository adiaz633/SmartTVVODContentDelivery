import { appConfig } from "@appConfig";
import { NetflixContentEdpoints } from "@newPath/constants/netflix-content-endpoints";
import { createNewEvent } from "src/code/js/event";
import { Main } from "@tvMain";
import { LogMng } from "@unirlib/server/logsmng";
import { MONITORING } from "src/code/constants/monitoring_constants";


let _instance = null;

/**
 * Response Error Interceptor
 */
export class ResponseErrorInterceptor {
  /**
   * Singleton on __ResponseErrorInterceptor__
   * @type {ResponseErrorInterceptor}
   */
  static get instance() {
    if (!_instance) {
      _instance = new ResponseErrorInterceptor();
    }
    return _instance;
  }

  /**
   * Converts object to string
   *
   * @param {any} req error received from request
   */
  errorInterceptor(req) {
    let errorCode;
    if (/\b4\d{2}\b/gm.test(req.status) || /\b5\d{2}\b/gm.test(req.status)) {
      errorCode = req.status.toString();
    } else if (req.message?.includes("timeout")) {
      errorCode = MONITORING.HTTP_STATUS.TIMEOUT;
    } else {
      errorCode = MONITORING.HTTP_STATUS.UNKNOWN;
    }
    if (errorCode) {
      if (errorCode === "401") {
        if (NetflixContentEdpoints.includes(req?.endpoint_ref)) {
          const error401Netflix = createNewEvent("error401Netflix");
          document.dispatchEvent(error401Netflix);
        } else {
          !appConfig.AVOID_REFRESH_USER_DATA_ON_401 && Main.refreshUserData();
          return true;
        }
        return false;
      }
      const logInfo = {};
      logInfo.url = req.url;
      logInfo.errorCode = errorCode;
      LogMng.instance.cscErrorEvent(logInfo);
    }
  }
}
