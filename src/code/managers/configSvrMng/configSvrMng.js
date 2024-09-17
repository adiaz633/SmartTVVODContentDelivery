import { getAjaxQuery } from "src/code/js/lib";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvMain";

import { BackendMng } from "../backend/backend-mng";

/* #region DEFINICIONES */

/* #endregion */

/**
 * @private
 * @type {configSvrMng};
 */
let _instance = null;

/**
 * @private
 * @method
 * @param {String} id_carrusel
 * @returns {Object}
 */
const getPromo = (id_carrusel) => {
  return (
    _instance._promos?.Portada?.Carrusel?.find((promo) => {
      return promo["@id_carrusel"] === id_carrusel;
    }) || null
  );
};

/**
 * Clase Manager configurador
 * @class
 */
export class configSvrMng {
  constructor(config) {
    this._json_config = config;
    this._promos = {};
  }

  /**
   * @type {configSvrMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new configSvrMng();
    }
    return _instance;
  }

  get config() {
    return this._json_config;
  }

  set config(json) {
    this._json_config = json;
  }

  getJsonConfig() {
    return this._json_config;
  }

  /**
   *
   * @method
   * @async
   */
  async loadPromos() {
    let response;
    const requestObj = {
      service: "tfgunir/config",
      endpoint: "promo_home",
    };

    try {
      response = await BackendMng.instance.request(requestObj);
      response.status = 200;
      this._promos = response;
    } catch (error) {
      response = error;
      this._promos = {};
    }
  }

  /**
   * Obtiene el valor de una promo
   * @method
   * @param {String} id_carrusel Identificador del carrusel en el WS endpoint
   * @returns {Object, null}
   */
  getPromo(id_carrusel) {
    return (
      this._promos?.Portada?.Carrusel?.find((promo) => {
        return promo["@id_carrusel"] === id_carrusel;
      }) || null
    );
  }

  getJsonConfigMods() {
    var json = null;
    if (this._json_config.VODSAMSUNG !== null && this._json_config.VODSAMSUNG !== undefined)
      json = this._json_config.VODSAMSUNG.Definicion_Modificador;
    else json = this._json_config.VOD.Definicion_Modificador;
    return json;
  }

  getSubmenuById(id) {
    for (var i in this._json_config.VOD.Submenu) {
      if (this._json_config.VOD.Submenu[i]["@id"] == id) return this._json_config.VOD.Submenu[i];
    }

    if (this._json_config.VOD.Submenu != null && this._json_config.VOD.Submenu["@id"] == id)
      return this._json_config.VOD.Submenu;

    for (var i in this._json_config.VOD.Submenu) {
      if (this._json_config.VOD.Submenu[i]["@id"] == id) return this._json_config.VOD.Submenu[i];
    }

    return null;
  }

  getConfigMenuNombre(section) {
    var i = 0;
    var exito = false;

    while (i < this._json_config.VOD.Submenu.length && !exito) {
      exito = this._json_config.VOD.Submenu[i]["@id"] == section;
      if (exito) return this._json_config.VOD.Submenu[i]["@nombre"];
      i++;
    }
    return section;
  }

  getConfigSubmenuNombre(section, subsection) {
    var i = 0;
    var exito = false;

    while (i < this._json_config.VOD.Submenu.length && !exito) {
      exito = this._json_config.VOD.Submenu[i]["@id"] == section;
      if (exito) {
        var j = 0;
        var exito2 = false;
        var json_section = this._json_config.VOD.Submenu[i];

        while (j < json_section.Submenu.length && !exito2) {
          exito2 = json_section.Submenu[j]["@id"] == subsection;
          if (exito2) {
            return json_section.Submenu[j]["@nombre"];
          }
          j++;
        }
        break;
      }
      i++;
    }
    return subsection;
  }

  // Map JSON config  @tipo
  mapTipo(config_type) {
    var tipo = "";
    if (config_type == "promo") tipo = "promo";
    else if (config_type == "carrusel_vertical") tipo = "movies";
    else if (config_type == "actors") tipo = "actors";
    else if (config_type == "services") tipo = "services";
    //TODO Cambiar esto al terminar tarea
    else if (config_type == "carrusel_horizontal") tipo = "series";
    //else if (config_type == "carrusel_horizontal") tipo = "nodes";
    else if (config_type == "carrusel_canales") tipo = "channels";
    else if (config_type == "carrusel_canales_uv") tipo = "carrusel_canales_orden_uv";
    else if (config_type == "carrusel_canales_orden_uv") tipo = "carrusel_canales_orden_uv";
    else if (config_type == "carrusel_canales_orden_mv") tipo = "carrusel_canales_orden_mv";
    else if (config_type == "coleccion_vertical") tipo = "coleccion_vertical";
    else if (config_type == "coleccion_horizontal") tipo = "coleccion_horizontal";
    else tipo = "movies";

    return tipo;
  }

  mapTipoPromo(promo_type) {
    var tipo = null;
    if (promo_type == "carrusel_promociones") tipo = "promo";
    else if (promo_type == "carrusel_nodos_destacados")
      //TODO cambiar este hardcoded
      tipo = "carousel-promos";
    else if (promo_type === "carrusel_multiple_horizontal") {
      tipo = "carrusel_multiple_horizontal";
    } else if (promo_type === "carrusel_multiple_vertical") {
      tipo = "carrusel_multiple_vertical";
    } else if (promo_type == "carrusel_nodos") tipo = "nodes";

    return tipo;
  }
  // Map JSON config Modulo
  mapModulo(modulo, parent) {
    var item = null;
    if (modulo["@tipo"] === "promo") {
      const promo = getPromo(modulo["@id_carrusel"]);
      if (!promo) {
        return null;
      }
      var typePromo = this.mapTipoPromo(promo["@tipo"]);
      if (!typePromo) {
        return null;
      }

      item = {
        type: typePromo,
        title: promo["@nombre"],
        colapsar: modulo["@colapsar"],
        enlace: null,
        childs: null,
        data: promo.Promocion,
        idCarrusel: modulo["@id_carrusel"],
      };
      if (modulo["@colapsar"]) {
        item.colapsar = modulo["@colapsar"];
      }
    } else if (modulo["@tipo"] === "carrusel_multiple_horizontal" || modulo["@tipo"] === "carrusel_multiple_vertical") {
      var datapromo = [];
      const promo = getPromo(modulo["@id_carrusel"]);
      if (promo) {
        datapromo = promo.Promocion;
      }
      item = {
        type: modulo["@tipo"],
        title: modulo["@nombre"],
        colapsar: modulo["@colapsar"],
        enlace: null,
        childs: null,
        data: datapromo,
        idCarrusel: modulo["@id_carrusel"],
        Carrusel: modulo.Carrusel,
        salto: modulo["@salto"],
      };
    } else {
      var type = this.mapTipo(modulo["@tipo"]);
      if (type) {
        // create array of items with ajax queries
        var query = getAjaxQuery(modulo["consulta"]);
        // enlaces
        var enlace = modulo["Enlace"];
        if (enlace) {
          enlace.type = "enlace";
          if (!this.enlaceOK(enlace)) enlace = null;
          else {
            enlace.migas = this.mapName(modulo);
            var submenu = this.getSubmenuById(enlace["@id"]);
            if (submenu) enlace.submenu_nombre = submenu["@nombre"];
          }
        }
        // child nodes
        var childs = this.mapEnlace(modulo, parent);
        if (childs && childs.type == "") childs = null;

        if (query) {
          item = {
            type,
            title: modulo["@nombre"],
            colapsar: modulo["@colapsar"],
            enlace,
            childs,
            query,
          };
        }
      }
    }

    return item;
  }

  enlaceOK(menuitem) {
    var result = true;
    var id = menuitem["@id"];

    if (
      id != null &&
      !menuitem.Modulo &&
      id != "TV-NOW" &&
      id != "TV-EPG" &&
      id != "Search" &&
      id != "Login" &&
      id != "Conf"
    ) {
      var submenu = this.getSubmenuById(id);
      result = submenu != null;
    }

    return result;
  }

  mapName(menuitem) {
    if (!menuitem) return "";
    var name = menuitem["@tag"];
    if (!name) {
      name = menuitem["@nombre"];
    }
    if (!name && menuitem.Modulo) {
      name = menuitem.Modulo["@nombre"];
    }

    return name;
  }

  // Map JSON config menu items
  mapEnlace(menuitem) {
    var result = {
      type: "",
      title: "",
      m: "",
      p: "",
      pin: "",
      migas: "",
      nombre: "",
      tooltip: ""
    };

    result.title = this.mapName(menuitem);
    result.migas = menuitem.migas;
    result.tooltip = menuitem["@tooltip"];
    result.m = menuitem["@M"];
    result.p = menuitem["@P"];
    result.pin = menuitem["@PIN"];
    result.nombre =
      menuitem.Enlace && menuitem.Enlace.submenu_nombre ? menuitem.Enlace.submenu_nombre : menuitem.submenu_nombre;
    result.nombre = result.nombre ? result.nombre : menuitem["@nombre"];

    var id = menuitem["@id"];

    if (id == "TV-EPG") {
      result.type = "scene";
      result.scene = "EpgScene";
    } else if (id == "Search") {
      result.type = "scene";
      result.scene = "BuscarScene";
    } else if (id == "Login") {
      result.type = "scene";
      result.scene = "PopLoginScene";
    } else if (id == "ConfOTT") {
      result.type = "scene";
      result.scene = "ConfigScene";
    } else if (id == "Conf") {
      result.type = "scene";
      result.scene = "SettingsScene";
    } else if (id == "ConfLocal") {
      result.type = "scene";
      result.scene = "SettingsLocalesScene";
    } else if (id == "Profiles") {
      result.type = "profiles";
      result.scene = "";

      if (AppStore.lastprofile.getUserProfile()) {
        //********* */
        const tplTitle = `<div class="profile-img icon">
            <div class="back-profile-menu">
              <div class="perfiles-tooltip home"><span>${AppStore.lastprofile.getUserProfile().name}</span></div>
            </div>
            <div class="bg-img"></div>
            <img class="user-img" src="${AppStore.lastprofile.getUserProfile().avatar}"/>
          </div>
            `;
        result.title = tplTitle;
      }
    } else if (id === "carrouselC2c") {
      result.type = "coleccion_horizontal";
      result.title = menuitem.name;
      result.migas = menuitem.name;
      result.nombre = menuitem.name;
      result.data = [];
      result.query = {
        type: "get",
        url: menuitem.links[0]["href"],
        headers: {},
        service_ref: "tfgunir/consultas",
        endpoint_ref: "consultar",
        status_query: "",
        first401: true,
        retries: 1,
        timeout: 8000,
      };
      result.opts = {
        title: menuitem.name,
        p: "ESTRENOS",
        m: "CINE",
        Modificador: [
          {
            "@type": "visible",
            "@id": "ordenacion",
            "@selected": "MA",
          },
        ],
      };
    } else {
      result.data = [];
      var configitem = menuitem;
      if (id != null && !configitem.Modulo) {
        // Find element in json config
        configitem = this.getSubmenuById(id);
      }

      if (configitem && configitem.Modulo) {
        if (!result.title)
          //(configitem['@nombre'])
          result.title = configitem["@nombre"];
        else if (configitem.Modulo["@nombre"]) result.title = configitem.Modulo["@nombre"];

        if (Array.isArray(configitem.Modulo)) {
          result.type = "slider";
          result.p = configitem["@P"];
          result.m = configitem["@M"];
          var has_brothers = configitem.Modulo.length > 1;
          for (var i in configitem.Modulo) {
            if (has_brothers && configitem.Modulo[i]["@tipo"]) {
              configitem.Modulo[i]["@tipo"] = configitem.Modulo[i]["@tipo"].replace("coleccion", "carrusel");
            }
            var item = this.mapModulo(configitem.Modulo[i], configitem);
            if (item != null) result.data.push(item);
          }
        } else if (Array.isArray(configitem.Modulo.Modulo)) {
          result.type = "slider";
          var has_brothers = configitem.Modulo.Modulo.length > 1;
          for (var i in configitem.Modulo.Modulo) {
            if (has_brothers)
              configitem.Modulo.Modulo[i]["@tipo"] = configitem.Modulo.Modulo[i]["@tipo"].replace(
                "coleccion",
                "carrusel"
              );
            var item = this.mapModulo(configitem.Modulo.Modulo[i], configitem);
            if (item != null) result.data.push(item);
          }
        } else {
          result.type = "coleccion_horizontal";
          if (configitem.Modulo["@tipo"]) result.type = configitem.Modulo["@tipo"];

          var consulta = configitem.Modulo.consulta ? configitem.Modulo.consulta : configitem.Modulo["consulta"];
          result.query = getAjaxQuery(consulta);

          result.opts = {
            title: result.title,
            p: configitem["@P"],
            m: configitem["@M"],
            pin: result.pin,
            Modificador: configitem.Modulo.Modificador,
          };
        }
      }
    }
    return result;
  }

  // replace {} variables
  parseUrl(url, doBastionado) {
    if (url == null || url.length == 0) return "";
    var index2 = -1;
    var index = url.indexOf("{");
    var urlres = "";
    while (index > 0) {
      urlres += url.substring(index2 + 1, index);
      var index2 = url.indexOf("}", index);
      var str = url.substring(index + 1, index2).toLowerCase();
      if (str == "nmi") urlres += AppStore.preferences.getFiltroNivelMoral(); //OK
      else if (str === "iskidprofile" || str === "iskids") urlres += AppStore.preferences.getFiltroIsKidProfile(); //OK
      else if (str === "agerating") urlres += ControlParentalMng.instance.getUserAgeRating(); //OK
      else if (str == "true/false") urlres += AppStore.preferences.getFiltroClasificado(); //OK
      else if (str == "codpersona")
        urlres += AppStore.login.getOferta() == null ? "" : AppStore.login.getOferta().cod_persona; // Storage de Login
      else if (str == "codoferta")
        urlres += AppStore.login.getOferta() == null ? "" : AppStore.login.getOferta().cod_oferta; // Storage de Login
      else if (str == "mediaplayerid") urlres += AppStore.playReady.getPlayReadyId(); // OK
      else if (str == "deviceid") urlres += AppStore.device.getDevUID(); // Storage de device
      else if (str == "profile") urlres += AppStore.login.getProfile(); // Storage de Profile
      else if (str == "profileid") urlres += AppStore.lastprofile.getUserProfileID(); // Storage de Profile
      else if (str == "origin") urlres += AppStore.login.getOrigin(); // Storage de Login
      else if (str == "accountnumber") urlres += AppStore.login.getAccountNumber(); // Storage de Login
      else if (str == "accountid") urlres += AppStore.login.getAccountNumber(); // Storage de Login
      else if (str == "cod_usuario_cifrado") urlres += AppStore.login.getCodUsuarioCifrado(); // Storage de Login
      else if (str == "devicetype") urlres += AppStore.appStaticInfo.getDeviceClass(); // OK
      else if (str == "pid") urlres += AppStore.profile.get_pid(); // Storage de Profile
      else if (str == "devicecode") urlres += AppStore.appStaticInfo.getDeviceCode(); // OK
      else if (str == "sessionid") urlres += AppStore.yPlayerCommon.getSessionID(); // OK
      //FIXME: Sustituirlo como referencia a la vista activa
      /*
      else if (str == "texto" && $.searchView)
        urlres += $.searchView.get_phrase(); // Derivar a ViewMng o que sea un custom
      else if (str == "texto" && searchView) urlres += searchView.get_phrase(); // Derivar a ViewMng o que sea un custom
      */ else if (str == "demarcation") urlres += AppStore.profile.getDemarcation(); // Storage de Profile
      else if (str == "clientsegment") urlres += AppStore.profile.getClientSegment(); // Storage de Profile
      else if (str == "tvrights") urlres += AppStore.profile.getPaquete(); // Storage de Profile
      else if (str == "manufacturername-modelname")
        urlres += AppStore.device.getManufacturer() + "-" + AppStore.device.getDevModel(); // OK
      else if (str == "contents") urlres += PlayMng.instance.playerView.get_content_type(); // OK
      else if (str == "contentid") urlres += AppStore.yPlayerCommon.getContentId(); // OK
      else if (str == "advcontents") urlres += PlayMng.instance.playerView.get_content_type_publi(); // OK
      else if (str == "advcontentid") urlres += AppStore.yPlayerCommon.getContentIdPubli(); // OK
      else if (str == "suscripcion") urlres += AppStore.profile.get_suscripcion(); // Storage de Profile
      else if (str == "filterquality") urlres += AppStore.HdmiMng.getLineQualityFilter();
      else if (str == "linequality") urlres += Main.getLineQuality(); //
      else if (str == "promosegment") urlres += AppStore.profile.get_promosegment(); // Storage de Profile
      else if (str == "network") urlres += AppStore.profile.get_network(); // Storage de Profile
      else if (str == "linearsubscription") {
        if (!AppStore.login.isAnonimousUser())
          urlres += AppStore.profile.get_linearSubscription(); // Storage de Profile
        else urlres += "";
      } else if (str == "vodsubscription") {
        if (!AppStore.login.isAnonimousUser()) urlres += AppStore.profile.get_vodSubscription(); // Storage de Profile
        else urlres += "";
      } else if (str == "channel") {
        if (PlayMng.instance.playerView._channel) {
          urlres += PlayMng.instance.playerView._channel.CodCadenaTv; // OK
        } else {
          urlres += "";
        }
      } else {
        urlres += "{" + str + "}";
      }

      index = url.indexOf("{", index2);
    }
    urlres += url.substring(index2 + 1, url.length);
    if (doBastionado) {
      urlres = this.bastionado(urlres);
    }
    return urlres;
  }

  /**
   *
   * @param {*} url
   * @returns
   */
  bastionado(url) {
    var indQuestion = url.indexOf("?");
    if (indQuestion == -1) return url;

    var queryString = url.substring(0, indQuestion + 1);
    var queryParams = url.substring(indQuestion + 1, url.length);

    var pixelReport = false;
    // Query string check

    var index = queryString.indexOf("{");
    while (index > 0) {
      pixelReport = true;
      var index2 = queryString.indexOf("}", index);

      queryString = queryString.substring(0, index) + queryString.substring(index2 + 1, queryString.length);
      index = queryString.indexOf("{");
    }

    // Query parameters check
    var result = queryString;
    var vars = queryParams.split("&");
    var firstVar = true;
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair.length == 2) {
        if (
          pair[1] != "" &&
          pair[1] != null &&
          pair[1] != "null" &&
          pair[1] != "undefined" &&
          pair[1].indexOf("{") == -1
        ) {
          if (firstVar) {
            result += pair[0] + "=" + pair[1];
            firstVar = false;
          } else {
            result += "&" + pair[0] + "=" + pair[1];
          }
        } else {
          pixelReport = true;
        }
      }
    }


    return result;
  }
}
