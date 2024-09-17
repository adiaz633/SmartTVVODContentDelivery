import { AppStore } from "src/code/managers/store/app-store";

export function timezone() {
  var _date = null;

  var _tzhour = null;
  var _tzday = null;

  timezone.prototype.initialize = function (indate) {
    _date = indate;

    var finalgmt = AppStore.serverTime.getFinalGMT();

    _tzhour = _date.getUTCHours() + finalgmt;
    if (_tzhour >= 24) {
      _tzhour = _tzhour - 24;
      _tzday = new Date(_date.getUTCFullYear(), _date.getUTCMonth(), _date.getUTCDate() + 1);
    } else if (_tzhour < 0) {
      _tzhour = 24 - _tzhour;
      _tzday = new Date(_date.getUTCFullYear(), _date.getUTCMonth(), _date.getUTCDate() - 1);
    } else {
      _tzday = new Date(_date.getUTCFullYear(), _date.getUTCMonth(), _date.getUTCDate());
    }
  };

  timezone.prototype.getSeconds = function () {
    return _date.getSeconds();
  };

  timezone.prototype.getMinutes = function () {
    return _date.getMinutes();
  };

  timezone.prototype.getHours = function () {
    return _tzhour;
  };

  timezone.prototype.getDate = function () {
    return _tzday.getDate();
  };

  timezone.prototype.getDay = function () {
    return _tzday.getDay();
  };

  timezone.prototype.getMonth = function () {
    return _tzday.getMonth();
  };

  timezone.prototype.getFullYear = function () {
    return _tzday.getFullYear();
  };
}
