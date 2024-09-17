export const fileutils = function () {
  fileutils.prototype.readJSON = function (filename) {
    var result = JSON.parse(localStorage.getItem(filename));
    return result;
  };

  fileutils.prototype.saveJSON = function (filename, jsondata) {
    localStorage.setItem(filename, JSON.stringify(jsondata));
  };

  fileutils.prototype.deleteJSON = function (filename) {
    localStorage.removeItem(filename);
  };

  fileutils.prototype.removeAllJSON = function () {
    localStorage.clear();
  };

  fileutils.prototype.isItemAvailable = function (filename) {
    return localStorage.getItem(filename) !== null;
  };
};
