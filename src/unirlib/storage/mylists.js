import { RecordingsApi } from "@newPath/apis/recordings-api";
import { RentalsApi } from "@newPath/apis/rentals-api";
import { bookmarking } from "@unirlib/server/bookmarking";
import { debug } from "@unirlib/utils/debug";

export const mylists = function () {
  /*
   * La clase genera la opcion de carga de los contenidos al principio de la aplicacion,
   * para despues mantener trabajar con los elementos en local a traves de los arrays.
   *
   * */

  /**************************************/
  /*						FAVORITES  							*/
  /**************************************/

  this._my_favorites_list = null;
  mylists.prototype.loadFavorites = function () {
    debug.alert("mylists.prototype.loadFavorites");
    var bmk = new bookmarking();
    return bmk.get_favoritos();
  };

  mylists.prototype.generarArrayFavorites = function (response) {
    debug.alert("mylists.prototype.generarArrayFavorites");
    this._my_favorites_list = new Array();
    if (response) {
      var json = null;
      try {
        json = JSON.parse(response);
        if (json) {
          this._my_favorites_list = new Array();
          var nIds = json.length;
          for (var i = 0; i < nIds; i++) this._my_favorites_list[i] = json[i];
        }
      } catch (e) {
        debug.alert("mylists.prototype.generarArrayFavorites ERROR: " + e.toString());
      }
    }
  };

  mylists.prototype.checkItemTypes = function (listItemType, itemType) {
    // Chequeamos que el itemtype es igual o de un nivel agrupador superior
    if (listItemType === itemType) return true;
    if (listItemType.includes("Live") && itemType.includes("Live")) {
      return true;
    }
    if (itemType === "Episode") return listItemType === "Season" || listItemType === "Series";
    else if (itemType === "Season") return listItemType === "Series";

    return false;
  };

  mylists.prototype.esta_favorito = function (id, itemType) {
    if (!this._my_favorites_list) return false;
    const self = this;
    const favorite = this._my_favorites_list.find(function (elem) {
      var esta = elem.id == id && self.checkItemTypes(elem.catalogItemType, itemType);
      return esta;
    });
    const esta = favorite !== undefined;
    console.warn(`esta_favorito=${esta} id=${id} itemType=${itemType}`);
    return esta;
  };

  mylists.prototype.get_favorito_index = function (id, itemType) {
    const self = this;
    const index = this._my_favorites_list.findIndex(function (elem) {
      var esta = elem.id == id && self.checkItemTypes(elem.catalogItemType, itemType);
      return esta;
    });
    return index;
  };

  mylists.prototype.add_favorito = function (accountId, profileId, link, is_recording) {
    debug.alert("mylists.prototype.add_favorito");
    const bmk = new bookmarking();
    return bmk.add_favorito(accountId, profileId, link, is_recording);
  };

  mylists.prototype.delete_favorito = function (accountId, profileId, link, is_recording) {
    debug.alert("mylists.prototype.saveFavorites");
    const bmk = new bookmarking();
    return bmk.delete_favorito(accountId, profileId, link, is_recording);
  };

  mylists.prototype.update_favorito_from_list = function (contentId, itemType) {
    debug.alert("mylists.prototype.update_favorito");
    if (!this.esta_favorito(contentId, itemType)) {
      const content = {
        id: contentId,
        catalogItemType: itemType,
        lastModified: new Date().toISOString(),
      };
      this._my_favorites_list.push(content);
    }
  };

  mylists.prototype.remove_favorito_from_list = function (contentId, itemType) {
    debug.alert("mylists.prototype.remove_favorito");
    if (this.esta_favorito(contentId, itemType)) {
      var index = this.get_favorito_index(contentId, itemType);
      this._my_favorites_list.splice(index, 1);
    }
  };

  mylists.prototype.removeFavorites = function () {
    debug.alert("mylists.prototype.removeFavorites");
    this._my_favorites_list = null;
    this._my_favorites_list = new Array();
  };

  /**********************************************/
  /*			     ViewingList/BOOKMARKING					*/
  /**********************************************/

  this._my_viewing_list = [];
  mylists.prototype.load_viewing_list = function () {
    debug.alert("mylists.prototype.load_trackinglists");
    var bmk = new bookmarking();
    return bmk.get_viewing_list();
  };

  mylists.prototype.generar_viewing_list = function (response) {
    debug.alert("mylists.prototype.generar_trackinglists... ");
    this._my_viewing_list = [];
    try {
      if (response) {
        var json = JSON.parse(response);
        if (json) this._my_viewing_list = json;
      }
    } catch (e) {
      debug.alert("mylists.prototype.generar_trackinglists... ERROR = " + e.toString());
    }
  };

  mylists.prototype.delete_viewing_content = function (id, link) {
    var bmk = new bookmarking();
    return bmk.delete_reproduccion(id, link);
  };

  mylists.prototype.get_viewing_elapsed_time = function (id, itemType) {
    const form = this.get_viewing_by_id(id, itemType);
    const elapsed_time = form ? form.timeElapsed : 0;
    return elapsed_time;
  };

  mylists.prototype.hay_viewing_activo = function (id, itemType) {
    const form = this.get_viewing_by_id(id, itemType);
    const hay_bookmark_activo = form && !form.isCompleted && form.timeElapsed;
    return hay_bookmark_activo;
  };

  mylists.prototype.hay_viewing_completado = function (id, itemType) {
    const form = this.get_viewing_by_id(id, itemType);
    const hay_bookmark_activo = form && form.isCompleted;
    return hay_bookmark_activo;
  };

  mylists.prototype.esta_viewing_list = function (id, itemType) {
    const viewing = this._my_viewing_list.find(function (elem) {
      var esta = elem.id == id && elem.catalogItemType == itemType;
      return esta;
    });
    const esta = viewing !== undefined;
    return esta;
  };

  mylists.prototype.get_viewing_index = function (id, itemType) {
    const index = this._my_viewing_list.findIndex(function (elem) {
      var esta = elem.id == id && elem.catalogItemType == itemType;
      return esta;
    });
    return index;
  };

  mylists.prototype.get_viewing_by_id = function (id, itemType) {
    const viewing = this._my_viewing_list.find(function (elem) {
      var esta = elem.id == id && elem.catalogItemType == itemType;
      return esta;
    });
    return viewing;
  };

  mylists.prototype.add_viewing_content = function (form) {
    if (!this.esta_viewing_list(form.id, form.catalogItemType)) {
      this._my_viewing_list.push(form);
    } else {
      this.update_viewinglist(form);
    }
  };

  mylists.prototype.update_viewinglist = function (form) {
    if (!this.esta_viewing_list(form.id, form.catalogItemType)) {
      this._my_viewing_list.push(form);
    } else {
      var form_from_list = this.get_viewing_by_id(form.id, form.catalogItemType);
      form_from_list.timeElapsed = form.timeElapsed;
      form_from_list.isCompleted = form.isCompleted;
      this.delete_viewinglist_content(form.id, form.catalogItemType);
      this._my_viewing_list.push(form_from_list);
    }
  };

  mylists.prototype.delete_viewinglist_content = function (id, item_type) {
    if (this.esta_viewing_list(id, item_type)) {
      var index = this.get_viewing_index(id, item_type);
      this._my_viewing_list.splice(index, 1);
    }
  };

  mylists.prototype.remove_viewinglist = function () {
    debug.alert("mylists.prototype.remove_viewinglist");
    this._my_viewing_list = null;
    this._my_viewing_list = new Array();
  };

  /* END ViewingList Management */

  /**************************************/
  /* BEGIN TrakingSeriesList Management */
  /**************************************/

  this._myTrackedSeriesList = [];
  mylists.prototype.load_trackinglists = function () {
    debug.alert("mylists.prototype.load_trackinglists");
    var bmk = new bookmarking();
    return bmk.get_tracking_lists();
  };

  mylists.prototype.generar_trackinglists = function (response) {
    debug.alert("mylists.prototype.generar_trackinglists... ");
    this._myTrackedSeriesList = [];
    try {
      if (response) {
        var json = JSON.parse(response);
        if (json) {
          this._myTrackedSeriesList = json;
        }
      }
    } catch (e) {
      debug.alert("mylists.prototype.generar_trackinglists... ERROR = " + e.toString());
    }
  };

  /**************************************/
  /* BEGIN TrackedSeriesList Management */
  /**************************************/

  mylists.prototype.deleteTrackedSerie = function (contentId) {
    var bmk = new bookmarking();
    return bmk.delete_tracked_serie(contentId);
  };

  mylists.prototype.estaTrackedSeriesList = function (contentId) {
    return this._myTrackedSeriesList?.findIndex((e) => e.id == contentId) != -1;
  };

  mylists.prototype.estaWatched = function (contentId) {
    return this._myTrackedSeriesList?.find((e) => e.id == contentId)?.watched;
  };

  mylists.prototype.getIndexOfTrackedSeries = function (contentId) {
    debug.alert("mylists.prototype.getIndexOfTrackedSeries... " + contentId);
    var nIds = this._myTrackedSeriesList ? this._myTrackedSeriesList.length : 0;
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myTrackedSeriesList[i].id == contentId;
      if (!exito) i++;
    }
    return i;
  };

  mylists.prototype.getTrackedSerieById = function (contentId) {
    //debug.alert('mylists.prototype.getTrackedSerieById... ' + contentId);
    var nIds = this._myTrackedSeriesList ? this._myTrackedSeriesList.length : 0;
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myTrackedSeriesList[i].id == contentId;
      if (!exito) i++;
    }
    var content = null;
    if (exito) content = this._myTrackedSeriesList[i];
    return content;
  };

  mylists.prototype.setTrackedSeriesList = function (content) {
    debug.alert("mylists.prototype.setTrackedSeriesList " + content);
    if (!this.estaTrackedSeriesList(content.id)) {
      if (!this._myTrackedSeriesList) this._myTrackedSeriesList = [];
    } else {
      this.deleteTrackedSeriesList(content.id);
    }
    this._myTrackedSeriesList.push(content);
  };

  mylists.prototype.getEpisodeLink = function (content) {
    var i = 0;
    var exito = false;
    var long = content.length;
    while (i < long && !exito) {
      var type = content[i] && content[i].type ? content[i].type : "";
      exito = type == "episode";
      if (!exito) i++;
    }
    var link = null;
    if (exito) link = content[i];
    return link;
  };

  mylists.prototype.deleteTrackedSeriesList = function (contentId) {
    debug.alert("mylists.prototype.deleteTrackedSeriesList " + contentId);
    if (this.estaTrackedSeriesList(contentId)) {
      var index = this.getIndexOfTrackedSeries(contentId);
      debug.alert("mylists.prototype.deleteTrackedSeriesList index " + index);
      this._myTrackedSeriesList.splice(index, 1);
    }
  };

  mylists.prototype.removeTrackedSeriesList = function () {
    debug.alert("mylists.prototype.removeTrackedSeriesList");
    this._myTrackedSeriesList = null;
    this._myTrackedSeriesList = new Array();
  };
  /* END TrackedSeries Management */

  /************************************************************/
  /*						GRABACIONES 						                      */
  /************************************************************/

  this._myRecordinglist = null;
  mylists.prototype.loadRecordinglist = function () {
    debug.alert("mylists.prototype.loadRecordinglist");
    return RecordingsApi.instance.get_recording_lists();
  };

  mylists.prototype.saveRecordinglistContent = function (params) {
    debug.alert("mylists.prototype.saveRecordinglistContent");
    return RecordingsApi.instance.post_individual_recording(params);
  };

  mylists.prototype.delRecordinglistContent = function (params) {
    debug.alert("mylists.prototype.delRecordinglistContent");
    return RecordingsApi.instance.delete_individual_recording(params);
  };

  mylists.prototype.getQuota = function (params) {
    return RecordingsApi.instance.check_quota_recording_lists(params);
  };

  mylists.prototype.generarArrayRecordinglist = function (response) {
    debug.alert("mylists.prototype.generarArrayRecordinglist");
    this._myRecordinglist = new Array();
    this._myScheduledSeasonslist = new Array();
    if (response) {
      var json = null;
      try {
        json = JSON.parse(response);
        if (json) {
          var nRecordings = json.recordings ? json.recordings.length : 0;
          for (var i = 0; i < nRecordings; i++) this._myRecordinglist[i] = json.recordings[i];

          var nScheduledSeasons = json.scheduledSeasons ? json.scheduledSeasons.length : 0;
          for (var i = 0; i < nScheduledSeasons; i++) this._myScheduledSeasonslist[i] = json.scheduledSeasons[i];
        }
      } catch (e) {
        debug.alert("mylists.prototype.generarArrayRecordinglist ERROR: " + e.toString());
      }
    }
  };

  mylists.prototype.numRecordinglist = function () {
    return this._myRecordinglist ? this._myRecordinglist.length : 0;
  };

  mylists.prototype.estaRecordinglist = function (showId) {
    var nIds = this.numRecordinglist();
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myRecordinglist[i].id == showId;
      i++;
    }
    return exito;
  };

  mylists.prototype.getIndexOfRecordinglist = function (showId) {
    debug.alert("mylists.prototype.getIndexOfRecordinglist... " + showId);
    var nIds = this.numRecordinglist();
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myRecordinglist[i].id == showId;
      if (!exito) i++;
    }
    var index = -1;
    if (exito) index = i;
    return index;
  };

  mylists.prototype.getRecordinglistContentById = function (showId) {
    debug.alert("mylists.prototype.getRecordinglistContentById... " + showId);
    var nIds = this.numRecordinglist();
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myRecordinglist[i].id == showId;
      if (!exito) i++;
    }
    var content = null;
    if (exito) content = this._myRecordinglist[i];
    return content;
  };

  mylists.prototype.pushContentRecordinglist = function (params) {
    debug.alert("mylists.prototype.pushContentRecordinglist");
    if (!this.estaRecordinglist(params.id)) {
      var content = { id: params.id, state: params.state };
      this._myRecordinglist.push(content);
    }
  };

  mylists.prototype.deleteRecordinglistContent = function (showId) {
    debug.alert("mylists.prototype.deleteRecordinglistContent " + showId);
    var index = this.getIndexOfRecordinglist(showId);
    if (index != -1) {
      this._myRecordinglist.splice(index, 1);
    }
  };

  mylists.prototype.removeRecordinglist = function () {
    debug.alert("mylists.prototype.remove_viewinglist");
    this._myRecordinglist = null;
    this._myRecordinglist = new Array();
  };

  /*
		myScheduledSeasonslist
	*/

  mylists.prototype.saveScheduledSeasonsContent = function (params) {
    debug.alert("mylists.prototype.saveRecordinglistContent");
    return RecordingsApi.instance.post_season_recording(params);
  };

  mylists.prototype.delScheduledSeasonsContent = function (id) {
    debug.alert("mylists.prototype.delScheduledSeasonsContent");
    return RecordingsApi.instance.delete_season_episodes_recording(id);
  };

  mylists.prototype.cancelScheduledSeasonsContent = function (id) {
    debug.alert("mylists.prototype.cancelScheduledSeasonsContent");
    return RecordingsApi.instance.cancel_season_recording(id);
  };

  mylists.prototype.borradoMultipleGrabaciones = function (listShowIds) {
    debug.alert("mylists.prototype.borradoMultipleGrabaciones");
    return RecordingsApi.instance.borrado_multiple_grabaciones(listShowIds);
  };

  mylists.prototype.estaScheduledSeasonslist = function (id) {
    var nIds = this._myScheduledSeasonslist ? this._myScheduledSeasonslist.length : 0;
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myScheduledSeasonslist[i].id == id;
      i++;
    }
    return exito;
  };

  mylists.prototype.getIndexOfScheduledSeasonslist = function (id) {
    debug.alert("mylists.prototype.getIndexOfRecordinglist... " + id);
    var nIds = this._myScheduledSeasonslist ? this._myScheduledSeasonslist.length : 0;
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myScheduledSeasonslist[i].id == id;
      if (!exito) i++;
    }
    var index = -1;
    if (exito) index = i;
    return index;
  };

  mylists.prototype.getScheduledSeasonslistContentById = function (id) {
    debug.alert("mylists.prototype.getRecordinglistContentById... " + id);
    var nIds = this._myScheduledSeasonslist ? this._myScheduledSeasonslist.length : 0;
    var exito = false;
    var i = 0;
    while (!exito && i < nIds) {
      exito = this._myScheduledSeasonslist[i].id == id;
      if (!exito) i++;
    }
    var content = null;
    if (exito) content = this._myScheduledSeasonslist[i];
    return content;
  };

  mylists.prototype.pushContentScheduledSeasonslist = function (id) {
    debug.alert("mylists.prototype.pushContentRecordinglist");
    if (!this.estaScheduledSeasonslist(id)) {
      var content = { id };
      this._myScheduledSeasonslist.push(content);
    }
  };

  mylists.prototype.deleteScheduledSeasonslistContent = function (id) {
    debug.alert("mylists.prototype.deleteRecordinglistContent " + id);
    var index = this.getIndexOfScheduledSeasonslist(id);
    if (index != -1) {
      this._myScheduledSeasonslist.splice(index, 1);
    }
  };

  mylists.prototype.removeScheduledSeasonslist = function () {
    debug.alert("mylists.prototype.remove_viewinglist");
    this._myScheduledSeasonslist = null;
    this._myScheduledSeasonslist = new Array();
  };

  mylists.prototype.getScheduledSeasonsCount = function () {
    return this._myScheduledSeasonslist.length;
  };

  /**************************************/
  /*						ALQUILER  							*/
  /**************************************/

  this._myRentalsList = null;
  this._rentalExpiration = null; // guarda el timestamp de expiración más próximo de un alquiler

  /**
   * Hace la petición a backend de alquileres, genera el array local,
   * lo ordena y guarda el valor de expiración más próxima
   */
  mylists.prototype.loadRentals = async function () {
    var rentalsResponse = await RentalsApi.instance.get_rentals_list();
    this.generateRentalsArray(rentalsResponse);
    this.orderRentalsArray();
    this.updateRentalExpiration();
  };

  /**
   * Genera el array de alquileres a partir de la respuesta del backend.
   * @param {Object} response respuesta de backend de la petición de rentals/ids.
   */
  mylists.prototype.generateRentalsArray = function (response) {
    debug.alert("mylists.prototype.generarArrayRentals", response);
    this._myRentalsList = new Array();
    if (response) {
      var arrayRentals = null;
      try {
        arrayRentals = JSON.parse(response);
        if (arrayRentals?.length > 0) {
          arrayRentals.forEach((rentalObj) => {
            this._myRentalsList.push(rentalObj);
          });
        }
      } catch (e) {
        debug.alert("mylists.prototype.generateArrayRentals ERROR: " + e.toString());
      }
    }
  };

  /**
   * Ordena por fecha de expiración(más próxima a más lejana) el array de alquileres local.
   */
  mylists.prototype.orderRentalsArray = function () {
    if (this._myRentalsList?.length > 0) {
      this._myRentalsList = this._myRentalsList.sort(function (a, b) {
        return a.expiryTimestamp - b.expiryTimestamp;
      });
    }
  };

  /**
   * Actualiza el array de alquileres local, comprobará los que han caducado y los eliminará.
   * Actualiza posteriormente la fecha de expiración más próxima.
   */
  mylists.prototype.updateRentalsArray = function () {
    if (this._myRentalsList?.length > 0) {
      this._myRentalsList = this._myRentalsList.filter(function (rental) {
        var now = new Date().getTime();
        return rental.expiryTimestamp > now;
      });
    }
    this.updateRentalExpiration();
  };

  /**
   * Actualiza el campo _rentalExpiration que guarda la expiración más próxima.
   * Correspondrá al primer elemento del array de alquileres, ya que se ha ordenado.
   */
  mylists.prototype.updateRentalExpiration = function () {
    if (this._myRentalsList?.length > 0) {
      this._rentalExpiration = this._myRentalsList[0]?.expiryTimestamp;
    } else {
      this._rentalExpiration = null;
    }
  };

  /**
   * Comprueba si algún alquiler almacenado en el array local ha caducado.
   * Si es así, se lanza el proceso de actualización local.
   * @returns {Boolean} true si algún alquiler ha expirado.
   */
  mylists.prototype.checkRentalsExpiration = function () {
    var hasExpired = false;
    if (this._myRentalsList?.length > 0) {
      var now = new Date().getTime();
      if (this._rentalExpiration && this._rentalExpiration <= now) {
        hasExpired = true;
        this.updateRentalsArray();
      }
    }
    return hasExpired;
  };

  /**
   * Comprueba si un contenido está alquilado.
   * @param {Object} id id del contenido a comprobar.
   * @returns {Boolean} true si está alquilado, false en otro caso.
   */
  mylists.prototype.isRented = function (id) {
    var isRented = false;
    if (this.findRental(id)) {
      isRented = true;
    }
    return isRented;
  };

  /**
   * Devuelve el objeto completo de un elemento alquilado buscandolo por id.
   * @param {Object} id id del contenido a buscar.
   * @returns {Object} elemento alquilado almacenado localmente.
   */
  mylists.prototype.findRental = function (id) {
    var rental = null;
    if (this._myRentalsList?.length > 0) {
      rental = this._myRentalsList.find((rentalObj) => {
        return parseInt(rentalObj.contentId) === parseInt(id);
      });
    }
    return rental;
  };

  /**
   * Añade un elemento al array de alquileres local.
   * @param {Object} rentalObj elemento a añadir al array de alquileres local.
   */
  mylists.prototype.addRental = function (rentalObj) {
    if (rentalObj && !this.isRented(rentalObj.contentId)) {
      this._myRentalsList.push(rentalObj);
    }
  };
};

/**
 * @typedef MyLists
 */
