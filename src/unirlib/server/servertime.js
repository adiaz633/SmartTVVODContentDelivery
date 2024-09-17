import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";

export function servertime() {
  var _mode = 0; // 0 Auto - 1 Peninsula - 2 Canarias
  var offset = 0;

  var _gmtserver = 2;
  var _gmtlocal = 2;

  var _offset_verano = 0;

  var _semaphore = 0;

  var _dateyear = 0;

  servertime.prototype.initialize = function (URL) {
    var isOK = false;

    var local_now = new Date();
    _gmtlocal = this.findGMT(local_now.toString());
    _semaphore = 0;

    _dateyear = new Date();

    debug.alert("local_now " + local_now);
    debug.alert("local time:" + local_now.toString());
    debug.alert("local gmt:" + _gmtlocal);
    URL = Utils.sanitizeURL(URL);
    debug.alert("URL:" + URL);

    var XMLHttpRequestObject = new XMLHttpRequest();

    XMLHttpRequestObject.open("GET", URL, true); // false: sync
    //XMLHttpRequestObject.setRequestHeader("Cache-Control", "no-cache");

    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000); // REQUEST TIMEOUT!
    function ajaxTimeout() {
      debug.alert("servertime.prototype.initialize TIMEOUT!");
      XMLHttpRequestObject.abort();
    }

    XMLHttpRequestObject.onreadystatechange = function () {
      if (XMLHttpRequestObject.readyState == 4) {
        window.clearTimeout(xmlHttpTimeout);
        if (XMLHttpRequestObject.status == 200 || XMLHttpRequestObject.status == 204) {
          try {
            var dateStr = XMLHttpRequestObject.getResponseHeader("Date");
            var gmttime = new Date(Date.parse(dateStr));
            _dateyear = gmttime;
            var serverTimeMillisGMT = Date.parse(gmttime.toUTCString());

            var localMillisUTC = Date.parse(local_now.toUTCString());

            offset = serverTimeMillisGMT - localMillisUTC;

            debug.alert("dateStr:" + dateStr);
            debug.alert("server time:" + serverTimeMillisGMT);
            debug.alert("local time:" + local_now.toString());
            debug.alert("local gmt:" + _gmtlocal);

            debug.alert("Time offset: " + serverTimeMillisGMT + " / " + localMillisUTC + " / " + offset);
            isOK = true;
            if (dateStr == null || dateStr == "null") offset = 0;
            unirlib.callback_servertime_initialize(isOK);
          } catch (e) {
            // display error message
            debug.alert("Servertime error !!!: " + e.toString());
            isOK = true;
            offset = 0;
            unirlib.callback_servertime_initialize(isOK);
          }
        } else {
          // display status message
          debug.alert("Servertime error !!!: " + XMLHttpRequestObject.statusText);
          isOK = true;
          offset = 0;
          unirlib.callback_servertime_initialize(isOK);
        }
      }
    };

    try {
      XMLHttpRequestObject.send(null);
    } catch (e) {
      debug.alert("Error !!!: " + e.toString());
      isOK = true;
      offset = 0;
      unirlib.callback_servertime_initialize(isOK);
    }
  };

  servertime.prototype.refresh = function () {
    _offset_verano = this.offsetDST(_dateyear);

    _mode = 0;
    var time_auto = AppStore.preferences.getConfTimezoneManual();
    if (time_auto != null && time_auto == 1) {
      _mode = 1;
      var zonaActual = AppStore.preferences.getConfTimezone();
      if (zonaActual != null && zonaActual == 1) {
        _mode = 2;
      }
    }

    //debug.alert('refresh GMT mode:' + _mode);
  };

  servertime.prototype.command_servertime_initialize = function (isOK) {
    _semaphore++;
    if (_semaphore > 1) return;

    unirlib.callback_servertime_initialize(isOK);
  };

  servertime.prototype.findGMT = function (this_time) {
    var ind_gmt = this_time.indexOf("GMT");
    if (ind_gmt < 1) return 0;
    var gmttxt = this_time.substring(ind_gmt + 3, ind_gmt + 8);

    debug.alert("gmtxt " + gmttxt);

    var sign = 1;
    if (gmttxt[0] == "-") sign = -1;
    var hour = parseInt(gmttxt[2]);

    return sign * hour;
  };

  servertime.prototype.getServerTime = function () {
    var date = new Date();
    date.setTime(date.getTime() + offset);
    return date;
  };

  servertime.prototype.getMadridGMT = function () {
    return 1 + _offset_verano;
  };

  servertime.prototype.getFinalGMT = function () {
    var finalgmt = _gmtlocal;

    if (_mode == 0) {
      // Auto from TV
      finalgmt = _gmtlocal;
    } else if (_mode == 1) {
      // Península
      finalgmt = 1 + _offset_verano;
    } else if (_mode == 2) {
      // Canarias
      finalgmt = _offset_verano;
    }

    return finalgmt;
  };

  // Devuelve 0 en invierno - 1 en verano
  servertime.prototype.offsetDST = function (date) {
    //date = new Date(2015, 9, 25 , 4, 55, 0, 0);

    var result = 0;

    var y = date.getUTCFullYear();

    var beginDST = 31 - Math.floor(((5 * y) / 4 + 4) % 7);
    var endDST = 31 - Math.floor(((5 * y) / 4 + 1) % 7);

    var date_beginDST = new Date(y, 2, beginDST, 2, 0, 0, 0);
    var date_endDST = new Date(y, 9, endDST, 3, 0, 0, 0);

    if (date > date_beginDST && date < date_endDST) result = 1;

    /*
		debug.alert('date ' + date);
		debug.alert('date_beginDST ' + date_beginDST);
		debug.alert('date_endDST ' + date_endDST);
		debug.alert('result ' + result);*/

    return result;
  };

  /* CONTROL DE APPTIME INTERNO  */
  var _apptime = null;
  var _apptime_interval = null;
  servertime.prototype.set_apptime = function () {
    _apptime = AppStore.appStaticInfo.getServerTime();
    debug.alert("servertime.prototype.set_apptime _apptime = " + _apptime.toString());
  };

  servertime.prototype.get_apptime = function () {
    debug.alert("servertime.prototype.get_apptime _apptime = " + _apptime.toString());
    return _apptime;
  };

  servertime.prototype.start_set_apptime_interval = function () {
    if (_apptime == null) this.set_apptime();
    if (!_apptime_interval) {
      var self = this;
      _apptime_interval = window.setInterval(function () {
        self.set_apptime();
      }, 60000);
    }
  };

  servertime.prototype.stop_set_apptime_interval = function () {
    if (_apptime_interval) {
      window.clearInterval(_apptime_interval);
      _apptime_interval = null;
    }
  };

  /* HORA DESDE EL HOST */
  servertime.prototype.getTimeFromServer = function () {
    var url = AppStore.wsData._TIME_HOST;
    var self = this;
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        url,
        success(data, status, xhr) {
          var dateStr = xhr.getResponseHeader("Date");
          var serverdate = new Date(Date.parse(dateStr));
          resolve(serverdate);
        },
        error(xhr, textStatus, errorThrown) {
          var date = self.getServerTime();
          reject(date);
        },
        timeout: 3000,
      });
    });
    return promise;
  };
}
