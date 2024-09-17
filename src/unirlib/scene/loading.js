import { appConfig } from "@appConfig";
import { LoaderMng } from "src/code/managers/loader-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { googleAnalytics } from "@unirlib/server/googleAnalytics";
import { debug } from "@unirlib/utils/debug";

export const loading = function () {
  this._status = 0;
  this._idHTML = "#loadingdata";

  var origenscene = "";
  var targetscene = "";
  var is_mainmenu = true;

  loading.prototype.setHTMLid = function (id) {
    this._idHTML = id;
  };

  loading.prototype.setScene = function (sc) {
    origenscene = sc;
  };

  loading.prototype.setTargetScene = function (target) {
    targetscene = target;
  };

  loading.prototype.getTargetScene = function () {
    return targetscene;
  };

  loading.prototype.getScene = function () {
    return origenscene;
  };

  loading.prototype.get_is_mainmenu_scene_change = function () {
    return is_mainmenu;
  };

  loading.prototype.set_is_mainmenu_scene_change = function (is) {
    is_mainmenu = is;
    debug.alert("loading.prototype.set_is_mainmenu_scene_change: is_mainmenu: " + is_mainmenu);
  };

  loading.prototype.isActive = function () {
    return this._status == 1;
  };

  loading.prototype.free = function () {
    this.stop();
  };

  var _key = "";
  var _sceneDiv = "";
  loading.prototype.start = function (key) {
    debug.alert(
      "loading.prototype.start -> Procedure Key: " +
        key +
        " from _idHTML: " +
        this._idHTML +
        " of scene: " +
        origenscene
    );

    if (!AppStore.appStaticInfo.checkNetworkConnection()) {
      debug.alert("loading.prototype.start -----> NO HAY CONEXION A INTERNET");
      AppStore.errors.showError(origenscene, origenscene, "general", "E_Gen_3", false);
    } else {
      this._status = 1;
      _key = key;
      _sceneDiv = this._idHTML;
      var loadingDiv = document.getElementById(this._idHTML);
      if (loadingDiv && !AppStore.yPlayerCommon.isAutoplay()) {
        LoaderMng.instance.show_loader();
      }

      debug.alert("loading.prototype.start loading Procedure... : " + _key + " from _idHTML: " + this._idHTML);
      //loading.Procedure();
      window.setTimeout(this.Procedure, 500);
    }
  };

  loading.prototype.Procedure = function () {
    debug.alert("loading.Procedure key: " + _key);
    debug.alert("loading.Procedure _idHTML: " + _sceneDiv);
    switch (_sceneDiv) {
      case "loadingdataLogin":
        if (_key == "login") AppStore.sceneManager.get("PopLoginScene").login();
        else if (_key == "playready") AppStore.sceneManager.get("PopLoginScene").link();
        else if (_key == "activa") AppStore.sceneManager.get("PopLoginScene").link_activa();
        break;
      case "loadingdataOferta":
        if (_key == "activa") AppStore.sceneManager.get("PopLoginScene").link_activa();
        else AppStore.sceneManager.get("PopOfertaScene").link();
        break;
      case "loadingdataLogout":
        if (_key == "logout") AppStore.sceneManager.get("PopLogoutScene").logout();
        break;
      case "loadingdataVOD":
        if (_key == "enter") AppStore.sceneManager.get("VODScene").forwardSubmenu();
        else if (_key == "return") AppStore.sceneManager.get("VODScene").backSubmenu();
        else if (_key == "reload") AppStore.sceneManager.get("VODScene").reloadScene();
        else if (_key == "filtering") AppStore.sceneManager.get("VODScene").reloadCarousel();
        break;
      case "loadingdataVODList":
        if (_key == "filtering") AppStore.sceneManager.get("VODlistScene").reloadCarousel();
        break;
      case "loadingdataBuscar":
        if (_key == "reloadScene") AppStore.sceneManager.get("BuscarScene")._busqueda.reloadScene();
        break;
      case "loadingdataPago":
        if (_key == "enter") AppStore.sceneManager.get("PopPagoScene").enterButton();
        if (_key == "cupon") AppStore.sceneManager.get("PopPagoScene").enviaCupon();
        break;
      case "loadingdataCargo":
        if (_key == "enter") AppStore.sceneManager.get("PopCargoFacturaScene").enter();
        if (_key == "cupon") AppStore.sceneManager.get("PopCargoFacturaScene").enviaCupon();
        break;
      case "loadingdataModoPago":
        if (_key == "cupon") AppStore.sceneManager.get("PopModoPagoScene").enviaCupon();
        if (_key == "instant") AppStore.sceneManager.get("PopModoPagoScene").instantPurchase();
        break;
      case "loadingdataConfig":
        if (_key == "refresh") AppStore.sceneManager.get("ConfigScene").refresh();
        break;
      case "loadingdataConfirm":
        if (_key == "parental") AppStore.sceneManager.get("PopConfirmarScene").confirmar_parental();
        else if (_key == "ficha") AppStore.sceneManager.get("PopConfirmarScene").confirmar_ficha();
        else if (_key == "home") AppStore.sceneManager.get("PopConfirmarScene").confirmar_home();
        else if (_key == "modo_adultos") AppStore.sceneManager.get("PopConfirmarScene").confirmar_modo_adulto();
        else if (_key == "modo_kids") AppStore.sceneManager.get("PopConfirmarScene").confirmar_modo_kids();
        else if (_key == "episodios") AppStore.sceneManager.get("PopConfirmarScene").confirmar_episodios();
        else if (_key == "suscripcion") AppStore.sceneManager.get("PopConfirmarScene").confirmar_suscripcion();
        else if (_key == "reactivacion") AppStore.sceneManager.get("PopConfirmarScene").reactivacion();
        else if (_key == "purchase_password")
          AppStore.sceneManager.get("PopConfirmarScene").confirmar_purchase_password();
        break;
      case "loadingdataEPG":
        if (appConfig.EPG_OLD) {
          if (_key == "RF") AppStore.sceneManager.get("EpgScene")._epg_control.refreshEPG("forward");
          else if (_key == "RB") AppStore.sceneManager.get("EpgScene")._epg_control.refreshEPG("backward");
          else if (_key == "generateEPGBody") AppStore.sceneManager.get("EpgScene")._epg_control.generateEPGBody();
        }
        break;
      case "loadingdataCupon":
        if (_key == "cupon") AppStore.sceneManager.get("PopCuponScene").enviaCupon();
        else if (_key == "instant") AppStore.sceneManager.get("PopCuponScene").instantPurchase();
        break;

      case "loadingdataCompras":
        if (_key == "enter") AppStore.sceneManager.get("ComprasScene").forwardSubmenu();
        else if (_key == "return") AppStore.sceneManager.get("ComprasScene").backSubmenu();
        else if (_key == "reload") AppStore.sceneManager.get("ComprasScene").reloadScene();
        else if (_key == "filtering") AppStore.sceneManager.get("ComprasScene").reloadCarousel();
        break;
      case "loadingdataHome":
        if (_key == "activa") AppStore.sceneManager.get("PopLoginScene").link_activa();
        if (_key == "enterCarousel") AppStore.sceneManager.get("HomeScene").forwardSubmenu();
        if (_key == "filtering") AppStore.sceneManager.get("HomeScene").reloadCarousel();
        break;
      case "loadingdataSheet":
        if (_key == "enterCarousel") AppStore.sceneManager.get("FichaScene").forwardSubmenu();
        if (_key == "suscribir") AppStore.sceneManager.get("FichaScene").get_ficha().suscribir();
        break;
      case "loadingdataFichaSerie":
        if (_key == "enterCarousel") AppStore.sceneManager.get("SerieScene").forwardSubmenu();
        if (_key == "suscribir") AppStore.sceneManager.get("SerieScene").get_ficha().suscribir();
        break;
    }
  };

  loading.prototype.stop = function () {
    this._status = 0;
    debug.alert(
      "loading.prototype.stop LOADING --> " +
        this._idHTML +
        ", origenscene --> " +
        origenscene +
        ", targetscene --> " +
        targetscene
    );

    LoaderMng.instance.hide_loader();

    debug.alert("loading.prototype.stop LOADING END");
  };

  loading.prototype.finish = function () {
    debug.alert(
      "loading.prototype.finish LOADING --> " +
        this._idHTML +
        ", origenscene --> " +
        origenscene +
        ", targetscene --> " +
        targetscene
    );
    this.stop();
    if (origenscene != null && origenscene != "") {
      googleAnalytics.gaTrack(origenscene);
    }
  };

  loading.prototype.startLoadingScene = function () {
    debug.alert("loading.prototype.startLoadingScene...");
    if (!AppStore.appStaticInfo.checkNetworkConnection()) {
      debug.alert("loading.prototype.startLoadingScene --> NO HAY CONEXION A INTERNET");
      AppStore.errors.showError(origenscene, origenscene, "general", "E_Gen_3", false);
    } else {
      debug.alert("loading.prototype.startLoadingScene --> " + this._idHTML + ", origenscene --> " + origenscene);
      var origen_scene_obj = AppStore.sceneManager.get(origenscene);
      if (origen_scene_obj._main_menu._itemActual != 8 && this._idHTML && this._idHTML != "") {
        LoaderMng.instance.show_loader();
      }

      window.setTimeout("loading.OnLoad()", 500);
    }
  };

  loading.OnLoad = function () {
    debug.alert("loading.OnLoad: is_mainmenu: " + is_mainmenu);
    debug.alert("loading.OnLoad: origenscene: " + origenscene);

    if (is_mainmenu) {
      targetscene = AppStore.sceneManager.get(origenscene)._main_menu.getTargetScene();
      debug.alert("loading.OnLoad: targetscene: " + targetscene);
      AppStore.sceneManager.get(origenscene)._main_menu.exec_menu_command();
    } else {
      AppStore.sceneManager.hide(origenscene);
      debug.alert("loading.OnLoad: targetscene: " + targetscene);
      AppStore.sceneManager.show(targetscene);
      AppStore.sceneManager.focus(targetscene);
    }
  };
};
