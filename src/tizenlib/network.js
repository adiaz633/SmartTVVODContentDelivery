import { AppStore } from "src/code/managers/store/app-store";
import { debug } from "@unirlib/utils/debug";
import { network as webapis_network } from "tizen-tv-webapis";

export const network = function () {
  network.prototype.is_api_network_disabled = function () {
    var api_network_disabled = false;
    try {
      var gt = webapis_network.getGateway();
    } catch (e) {
      debug.alert("network.prototype.is_api_network_disabled... ERROR API NETWORK -> " + e.toString());
      api_network_disabled = true;
    }
    return api_network_disabled;
  };

  network.prototype.checkNetworkConnection = function () {
    var isConnected = false;
    var api_error = false;
    try {
      isConnected = webapis_network.getGateway() !== null;
    } catch (e) {
      debug.alert("network.prototype.checkNetworkConnection... ERROR API NETWORK -> " + e.toString());
      api_error = true;
    }
    try {
      if (api_error) isConnected = AppStore.network.check_network_via_html(800);
    } catch (e) {
      debug.alert("network.prototype.checkNetworkConnection... ERROR XHR -> " + e.toString());
    }
    return isConnected;
  };

  network.prototype.checkMultitaskingNetworkConnection = function () {
    var isConnected = false;
    var xhr_error = false;
    debug.alert("network.prototype.checkMultitaskingNetworkConnection...");
    try {
      isConnected = AppStore.network.check_network_via_html(800) || webapis_network.getGateway() !== null;
      xhr_error = false;
    } catch (e) {
      debug.alert("network.prototype.checkMultitaskingNetworkConnection... ERROR XHR -> " + e.toString());
      xhr_error = true;
    }
    try {
      if (xhr_error) isConnected = webapis_network.getGateway() !== null;
    } catch (e) {
      debug.alert("network.prototype.checkMultitaskingNetworkConnection... ERROR API NETWORK -> " + e.toString());
    }
    return isConnected;
  };

  network.prototype.getIP = function () {
    return webapis_network.getIp();
  };

  network.prototype.getRouterIP = function () {
    var ip = AppStore.appStaticInfo.isEmulator ? "192.168.1.1" : webapis_network.getGateway();
    debug.alert("network.prototype.getRouterIP " + ip);
    return ip;
  };

  network.prototype.check_network_via_html = function (timeout) {
    var isOK = false;
    var XMLHttpRequestObject = new XMLHttpRequest();
    if (XMLHttpRequestObject.overrideMimeType) {
      XMLHttpRequestObject.overrideMimeType("image/png");
    }
    var url = AppStore.wsData._HTTP_SERVER;
    XMLHttpRequestObject.open("GET", url, false); // false: sync
    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, timeout); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      XMLHttpRequestObject.abort();
    }
    XMLHttpRequestObject.send(null);
    isOK = XMLHttpRequestObject.status == 200;
    debug.alert("network.prototype.check_network_via_html isOK = " + isOK);
    return isOK;
  };
};
