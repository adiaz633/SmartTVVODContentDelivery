import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { debug } from "@unirlib/utils/debug";

export const preferences = function () {
  this._fileName = "preferences.db";

  /* Esta es la lista de busquedas del usuario*/
  this._search_list = null; /* Elementos en lista para pasar al control de busqueda */
  this._json_searchlist = null; /* Json de las listas de busqueda*/

  /* Manejo de preferencias por usuario */
  this._preferencia = null; /* Es json */
  this._index_pref = -1;

  this._col_preferencias = new Array(); /* Es un array normal de json */
  this._json_preferences; /* Es el JSON de preferencias */

  preferences.prototype.deletePreferences = function () {
    AppStore.fileUtils.deleteJSON(this._fileName);
    this.newPreferencia();
    this.newFiltro();
    this._col_preferencias = new Array();
    this._json_preferences = null;
    this.readPreferences();
  };

  preferences.prototype.readPreferences = function () {
    this._json_preferences = AppStore.fileUtils.readJSON(this._fileName);
    debug.alert(
      "preferences.prototype.readPreferences FILENAME CARGADO: " +
        this._fileName +
        " " +
        JSON.stringify(this._json_preferences)
    );
    if (this._json_preferences && this._json_preferences.Preferences) this.generarArrayPreferencias();
    else {
      this.buildJSON();
      this._col_preferencias = new Array();
      this.newPreferencia();
    }
  };

  preferences.prototype.savePreferences = function () {
    debug.alert("preferences.prototype.savePreferences");
    this.buildJSON();
    debug.alert("preferences.prototype.savePreferences JSON => " + JSON.stringify(this._json_preferences));
    AppStore.fileUtils.saveJSON(this._fileName, this._json_preferences);
  };

  preferences.prototype.generarArrayPreferencias = function () {
    var prefs = this._json_preferences.Preferences;
    var nprefs = this._json_preferences.Preferences.length;
    for (var i = 0; i < nprefs; i++) this._col_preferencias[i] = prefs[i];
  };

  preferences.prototype.buildJSON = function () {
    this._json_preferences = { Preferences: this._col_preferencias };
  };

  preferences.prototype.newPreferencia = function () {
    this._preferencia = {
      User: null,
      SearchList: null,
      Config: {
        Timezone: 0,
        TimezoneOffset: 0,
        TimezoneManual: 0,
        HomezoneMsg: 0,
      },
      Filtro: {
        Nivel: this._default_nivel,
        Clasificado: this._default_clasificados,
        isKidProfile: this._default_iskidprofile,
      },
    };
  };

  preferences.prototype.newFiltro = function () {
    var filtro = {
      Filtro: {
        Nivel: this._default_nivel,
        Clasificado: this._default_clasificados,
      },
    };
    return filtro;
  };

  preferences.prototype.getPreferencia = function () {
    var index = 0;
    var exito = false;
    if (this._preferencia) {
      if (this._preferencia.User !== "ANONYMOUS") {
        this._col_preferencias = [];
        this._col_preferencias.push(this._preferencia);
        return true;
      }
    }
    var nprefs = this._col_preferencias.length;
    if (nprefs != 0) {
      while (!exito && index < nprefs) {
        exito = this._col_preferencias[index].User == this._user;
        if (!exito) index++;
      }
      if (exito) {
        this._index_pref = index;
        this._preferencia = this._col_preferencias[index];

        try {
          var valor_nivel_moral = this._preferencia.Filtro.Nivel;
          /*
           * Vamos a guardar el valor en vez del indice del nivel, asi seremos mas fuertes ante cambios
           * */
          debug.alert("preferences.prototype.getPreferencia valor_nivel_moral = " + valor_nivel_moral);
          if (!this.existeParametroValue(valor_nivel_moral)) {
            switch (valor_nivel_moral.toString()) {
              case "1":
              case "2":
              case "3":
              case "4":
              case "INF":
              case "TP":
              case "M7":
              case "M12":
                this._preferencia.Filtro.Nivel = this._modificador_kids.parametro[0]["@value"];
                this._preferencia.Filtro.Clasificado = false;
                break;
              case "5":
              case "M13":
                this._preferencia.Filtro.Nivel = this._modificador_kids.parametro[1]["@value"];
                this._preferencia.Filtro.Clasificado = false;
                break;
              case "6":
              case "M16":
                this._preferencia.Filtro.Nivel = this._modificador_kids.parametro[2]["@value"];
                this._preferencia.Filtro.Clasificado = false;
                break;
              case "7":
              case "M18":
                this._preferencia.Filtro.Nivel = "M18";
                this._preferencia.Filtro.Clasificado = true;
                break;
              case "8":
              case "X":
                this._preferencia.Filtro.Nivel = this._modificador_adultos.parametro[0]["@value"];
                this._preferencia.Filtro.Clasificado = true;
                break;
              default:
                this._preferencia.Filtro.Nivel = "M18";
                this._preferencia.Filtro.Clasificado = true;
                break;
            }
          }
        } catch (e) {
          debug.alert("preferences.prototype.getPreferencia ERROR = " + e.toString());
          this._preferencia = this.newFiltro();
        }
        debug.alert("preferences.prototype.getPreferencia POST valor_nivel_moral = " + this._preferencia.Filtro.Nivel);
      }
    }

    return exito;
  };

  preferences.prototype.cargarPreferenciaUsuario = function (usuario) {
    this.getConfigValues();
    var hay_usuario = false;
    if (usuario) {
      this._user = usuario;
      hay_usuario = this.getPreferencia();
      if (!hay_usuario) {
        this.newPreferencia();
        this._preferencia["User"] = usuario;
        this._search_list = null;
        this.insertPreferencia();
      }
    }

    return hay_usuario;
  };

  preferences.prototype.insertPreferencia = function () {
    if (!this.getPreferencia()) {
      this._col_preferencias[this._col_preferencias.length] = this._preferencia;
      this._index_pref = this._col_preferencias.length;
    } else {
      this._col_preferencias[this._index_pref] = this._preferencia;
    }
  };

  preferences.prototype.array2json_searchlist = function () {
    if (this._search_list != null) {
      var nitems = this._search_list.length;
      var str_json = "[";
      for (var i = 0; i < nitems - 1; i++) {
        str_json = str_json + '{"item"' + ':"' + String(this._search_list[i]) + '"' + "},";
      }
      str_json = str_json + '{"item"' + ':"' + this._search_list[i] + '"' + "}]";
      this._json_searchlist = JSON.parse(str_json);
    } else {
      this._json_searchlist = null;
    }
  };

  preferences.prototype.json2array_searchlist = function () {
    if (this._preferencia["SearchList"] != null) {
      this._search_list = new Array();
      var nitems = this._preferencia["SearchList"].length;
      for (var i = 0; i < nitems; i++) {
        this._search_list[i] = this._preferencia["SearchList"][i].item;
      }
    } else {
      this._search_list = null;
    }
  };

  preferences.prototype.setSearchList = function (list) {
    this._search_list = list;
    this.array2json_searchlist();
    this._preferencia["SearchList"] = this._json_searchlist;

    AppStore.preferences.savePreferences();
  };

  preferences.prototype.getSearchList = function () {
    this.json2array_searchlist();
    return this._search_list;
  };
  preferences.prototype.getUser = function () {
    return this._preferencia.User;
  };

  /* Acceso a los filtros de nivel moral y clasificado desde toda la aplicacion */
  preferences.prototype.setFiltroNivelMoral = function (filtro) {
    debug.alert("preferences.prototype.setFiltroNivelMoral PRE  -> " + JSON.stringify(this._preferencia));
    this._preferencia.Filtro.Nivel = filtro;
    this._col_preferencias[0].Filtro.Nivel = filtro;
    debug.alert("preferences.prototype.setFiltroNivelMoral POST -> " + JSON.stringify(this._preferencia));
  };

  preferences.prototype.setFiltroIsKidProfile = function (isKidProfile) {
    this._preferencia.Filtro.isKidProfile = isKidProfile;
    this._col_preferencias[0].Filtro.isKidProfile = isKidProfile;
  };

  preferences.prototype.setFiltroClasificado = function (filtro) {
    // Leer el filtro desde el fichero messages
    this._preferencia.Filtro.Clasificado = filtro;
    this._col_preferencias[0].Filtro.Clasificado = filtro;
  };

  preferences.prototype.getFiltroNivelMoral = function () {
    var filtro = "";
    if (this._preferencia && this._preferencia.Filtro) {
      filtro = this._preferencia.Filtro.Nivel;
    } else {
      filtro = this.newFiltro().Filtro.Nivel;
    }
    if (filtro == null) return "";
    return filtro.toString();
  };

  preferences.prototype.getFiltroIsKidProfile = function () {
    var filtro = false;
    if (this._preferencia && this._preferencia.Filtro) {
      filtro = this._preferencia.Filtro.isKidProfile;
    } else {
      filtro = this.newFiltro().Filtro.isKidProfile;
    }
    if (filtro == null) return false;
    return filtro;
  };

  preferences.prototype.getFiltroClasificado = function () {
    var filtro = "";
    if (this._preferencia && this._preferencia.Filtro) {
      filtro = this._preferencia.Filtro.Clasificado;
    } else {
      filtro = this.newFiltro().Filtro.Clasificado;
    }
    if (filtro == null) return "";
    return filtro.toString();
  };

  preferences.prototype.isDefaultFilter = function () {
    return this._default_nivel == this.getFiltroNivelMoral();
  };

  preferences.prototype.getConfTimezone = function () {
    var result = 0;
    if (this._preferencia && this._preferencia.Config && this._preferencia.Config.Timezone)
      result = this._preferencia.Config.Timezone;
    else result = 0;

    return result;
  };

  preferences.prototype.setConfTimezone = function (data) {
    if (!this._preferencia) {
      this.newPreferencia();
    }

    this._preferencia.Config.Timezone = data;
    this._col_preferencias[0].Config.Timezone = data;
  };

  preferences.prototype.getConfTimezoneOffset = function () {
    var result = 0;
    if (
      this._preferencia != null &&
      this._preferencia.Config != null &&
      this._preferencia.Config.TimezoneOffset != undefined
    )
      result = parseInt(this._preferencia.Config.TimezoneOffset);
    else result = 0;

    return result;
  };

  preferences.prototype.setConfTimezoneOffset = function (data) {
    this._preferencia.Config.TimezoneOffset = data;
    this._col_preferencias[0].Config.TimezoneOffset = data;
  };

  preferences.prototype.getConfTimezoneManual = function () {
    var result = false;
    if (
      this._preferencia != null &&
      this._preferencia.Config != null &&
      this._preferencia.Config.TimezoneManual != undefined
    )
      result = this._preferencia.Config.TimezoneManual;
    else result = false;

    return result;
  };

  preferences.prototype.setConfTimezoneManual = function (data) {
    this._preferencia.Config.TimezoneManual = data;
    this._col_preferencias[0].Config.TimezoneManual = data;
  };

  preferences.prototype.getConfHomezoneMsg = function () {
    var result = 0;
    if (
      this._preferencia != null &&
      this._preferencia.Config != null &&
      this._preferencia.Config.HomezoneMsg != undefined
    )
      result = this._preferencia.Config.HomezoneMsg;
    else result = 0;

    return result;
  };

  preferences.prototype.setConfHomezoneMsg = function (data) {
    this._preferencia.Config.HomezoneMsg = data;
    this._col_preferencias[0].Config.HomezoneMsg = data;
  };

  /*
   * Cojemos la configuracion de las preferencias de los valores por defecto del config.
   * */
  this._submenu_kids = null;
  this._submenu_adultos = null;
  this._modificador_kids = null;
  this._modificador_adultos = null;
  this._default_nivel = "M18";
  this._default_clasificados = false;
  this._default_iskidprofile = false;

  preferences.prototype.getConfigValues = function () {
    debug.alert("preferences.prototype.getConfigValues");
    const { VOD } = unirlib.getJsonConfig() ?? {};
    if (!VOD?.Submenu) return;

    var submenus = VOD.Submenu;
    if (!submenus) {
      return;
    }
    var i = 0;
    var exito = false;
    while (!exito && i < submenus.length) {
      exito = submenus[i]["@id"] == "Conf";
      if (!exito) i++;
    }

    this._submenu_config = submenus[i].Modulo;
    this._submenu_kids = this.getSubSeccion(this._submenu_config, "CKids");
    this._submenu_adultos = this.getSubSeccion(this._submenu_config, "CAdult");

    if (this._submenu_kids) {
      var default_estado = this.getEstadoInfo(this._submenu_kids, "Desactivo");
      this._default_nivel = this.getParametroValue(default_estado, "parentalRating");
      //this._default_clasificados = this.getParametroValue(default_estado, "showNonRated");
    }

    const perfilActivo = AppStore.lastprofile.get();
    const parentalRating = AppStore.errors.getErrorNative("ParentalRating", perfilActivo?.ageRating.toString());
    const clasificado = parentalRating?.showNonRated?.toLowerCase() === "true";
    this._default_clasificados = clasificado;
    //this._default_clasificados = this._modificador_kids = AppStore.wsData.getModificador("modo_ninos");
    if (
      this._modificador_kids &&
      this._modificador_kids.parametro &&
      this._modificador_kids.parametro.length === undefined
    )
      this._modificador_kids.parametro = [this._modificador_kids.parametro];

    this._modificador_adultos = AppStore.wsData.getModificador("modo_adulto");
    if (
      this._modificador_adultos &&
      this._modificador_adultos.parametro &&
      this._modificador_adultos.parametro.length === undefined
    )
      this._modificador_adultos.parametro = [this._modificador_adultos.parametro];
  };

  preferences.prototype.getSubSeccion = function (submenu, seccion) {
    if (!submenu) return null;
    var i = 0;
    var exito = false;
    while (!exito && i < submenu.length) {
      exito = submenu[i]["@id"] == seccion;
      if (!exito) i++;
    }
    var sec_json = null;
    if (exito) sec_json = submenu[i];
    return sec_json;
  };

  preferences.prototype.getEstadoInfo = function (submenu, estado) {
    debug.alert("preferences.prototype.getEstadoInfo " + estado);
    var i = 0;
    var exito = false;
    while (!exito && submenu && submenu.Modulo && i < submenu.Modulo.length) {
      exito = submenu.Modulo[i]["@estado"] == estado;
      if (!exito) i++;
    }
    var estado_json = null;
    if (exito) estado_json = submenu.Modulo[i];
    debug.alert("preferences.prototype.getEstadoInfo ESTADO: " + JSON.stringify(estado_json));
    return estado_json;
  };

  preferences.prototype.getParametroValue = function (estado, id) {
    debug.alert("preferences.prototype.getParametroValue " + id);
    var i = 0;
    var exito = false;
    while (!exito && estado && estado.parametro && i < estado.parametro.length) {
      exito = estado.parametro[i]["@id"] == id;
      if (!exito) i++;
    }
    var param_value = null;
    if (exito) param_value = estado.parametro[i]["@value"];
    debug.alert("preferences.prototype.getParametroValue VALUE: " + param_value);
    return param_value;
  };

  preferences.prototype.existeParametroValue = function (nmi) {
    var mods_adulto = AppStore.wsData.getModificador("modo_adulto");
    var mods_ninos = AppStore.wsData.getModificador("modo_ninos");

    var exito_mod_ninos = false;
    if (mods_ninos) {
      var parametro = mods_ninos.parametro;
      var i = 0;
      var exito = false;
      while (i < parametro.length && !exito) {
        exito = parametro[i]["@value"] == nmi;
        if (!exito) i++;
      }
      exito_mod_ninos = exito;
    }

    var exito_mod_adultos = false;
    if (mods_adulto && !exito_mod_ninos) {
      var parametro = mods_adulto.parametro;
      var i = 0;
      var exito = false;
      while (i < parametro.length && !exito) {
        exito = parametro[i]["@value"] == nmi;
        if (!exito) i++;
      }
      exito_mod_adultos = exito;
    }
    var existe = exito_mod_ninos || exito_mod_adultos;
    debug.alert("preferences.prototype.getParametroValue VALUE EXISTE: " + existe);
    return existe;
  };

  preferences.prototype.setDefaultFiltros = function () {
    debug.alert("preferences.prototype.getParametroValue Default Nivel: " + this._default_nivel);
    debug.alert("preferences.prototype.getParametroValue Default Clasi: " + this._default_clasificados);
    this.setFiltroNivelMoral(this._default_nivel);
    this.setFiltroClasificado(this._default_clasificados);
    this.setFiltroIsKidProfile(this._default_iskidprofile);
  };
};

/**
 * @typedef preferences
 * @property {(object)=>boolean} cargarPreferenciaUsuario
 * @property {()=>void} deletePreferences
 */
