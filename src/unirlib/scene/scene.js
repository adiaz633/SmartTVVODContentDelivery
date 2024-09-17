/* esta clase se encarga de centralizar y contabilizar los cambios de escena,
de componente dentro de la navegacion de la escena asociada, en ella
se definen que escenas y elementos son accesibles y desde donde. */

export const scene = function () {
  this._key = "";
  this._instance = null;
  this._firstShow = true;

  scene.prototype.set_key = function (key) {
    this._key = key;
  };

  scene.prototype.get_key = function () {
    return this._key;
  };

  scene.prototype.set_instance = function (instance) {
    this._instance = instance;
  };

  scene.prototype.get_instance = function () {
    return this._instance;
  };

  scene.prototype.show = function () {
    if (this._firstShow) {
      this._instance.initialize();
      this._firstShow = false;
    }
    this._instance.handleShow();
  };

  scene.prototype.hide = function () {
    this._instance.handleHide();
  };

  scene.prototype.focus = function () {
    this._instance.handleFocus();
  };

  scene.prototype.blur = function () {
    this._instance.handleBlur();
  };

  scene.prototype.handleKeyDown = function (keyCode) {
    this._instance.handleKeyDown(keyCode);
  };

  scene.prototype.handleOnClick = function (srcId) {
    this._instance.handleOnClick(srcId);
  };

  scene.prototype.handleOnMouseOver = function (srcId) {
    this._instance.handleOnMouseOver(srcId);
  };

  scene.prototype.handleOnMouseOut = function (srcId) {
    this._instance.handleOnMouseOut(srcId);
  };

  scene.prototype.handleOnMouseWheel = function (delta) {};

  // TODO: EFECTOS EN EL SHOW (HTMLREADY)
  this._htmlId = "";
  scene.prototype.set_htmlId = function (id) {
    this._htmlId = id;
  };

  scene.prototype.hideElements = function () {
    var children = document.childNodes();
    var nchildren = children ? children.length : 0;
    for (var i = 0; i < nchildren; i++) {
      var child = children[i];
      if (child.id.search("loading") == -1) {
        $(child).css("opacity", 0);
      }
    }
  };

  scene.prototype.handleReady = function () {
    var children = document.childNodes();
    var nchildren = children ? children.length : 0;
    for (var i = 0; i < nchildren; i++) {
      var child = children[i];
      if (child.id.search("loading") == -1) {
        $(child).animate({ opacity: "1" }, { duration: "slow" });
      }
    }
  };
};
