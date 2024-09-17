import { AppStore } from "src/code/managers/store/app-store";
import { DetailsView } from "src/code/views/details/details";
import { PlayerDetailsService } from "src/code/views/player-view/player-details-service";

export class PlayerDetailsController {
  /**
   *  Create a new instance of __PlayerDetailsController__
   * @param {PlayerView} playerView PlayerView
   */
  constructor(playerView) {
    /**
     * @private
     * @type {PlayerView}
     */
    this._playerView = playerView;
  }

  /**
   * Recupera el JSON de un evento contra backend ("details")
   * @public
   * @name loadDetails
   * @param {Object|null} event Contenido/programa que queremos consultar
   * @returns {Promise<Object>} Devuelve el JSON con los datos
   */
  async loadDetails(event = null) {
    const currentProgram = this._playerView.getCurrentProgram();
    event = event !== null ? event : currentProgram;
    if (!event || Object.keys(event).length === 0) {
      this._playerView.set_datos_editoriales(null);
      throw new Error("loadDetails::error evento vacio");
    }

    // Eventos de sin multicast no llaman a details
    if (Object.keys(currentProgram).length > 0 && currentProgram?.isApplicationChannel()) {
      this._playerView.set_datos_editoriales(currentProgram);
      this.setDetails();
      return;
    }

    try {
      const response = await PlayerDetailsService.instance.callDetails(event);
      this._playerView.set_datos_editoriales(response);
      return response;
    } catch (error) {
      throw new Error("loadDetails::error Error al realizar callDetails");
    } finally {
      this.setDetails();
    }
  }

  async loadDetailsTemporal(event = null) {
    event = event !== null ? event : this._playerView.getCurrentProgram();
    if (!event || Object.keys(event).length === 0) {
      throw new Error("loadDetailsTemporal::error evento vacio");
    }
    const response = await PlayerDetailsService.instance.callDetails(event);
    this.setDetailsTemporal(response);
    return response;
  }

  setDetails() {
    /** @type {JQuery} */
    const wrap = this._playerView.opts.wrap;
    let detailWrap = wrap.find("#details-view");
    if (!detailWrap.length) {
      detailWrap = jQuery(String.raw`
        <div id="details-view" class="details-view"></div>
      `).appendTo(wrap);
    }
    this._playerView.opts.detailsWrap = detailWrap;

    this._playerView.opts.details = new DetailsView(this._playerView.opts.detailsWrap);
    this._playerView.opts.details.setPath("", "");
    this._playerView.opts.details.setPlayerMode();
    this._playerView.opts.details.setDatosEditoriales(this._playerView._datos_editoriales);
    this._playerView.opts.details.calculateStatus();
    this._playerView.opts.details.setEffectiveContent();
    if (
      this._playerView.opts.m360ParamsPlayer?.linkedDevice &&
      this._playerView.opts.m360ParamsPlayer?.ischangeM360Detail
    ) {
      this._playerView.loadM360DetailsContent();
      this._playerView.opts.m360ParamsPlayer = {};
    }
    // Seteamos variable global durante el player
    AppStore.home.set_details(this._playerView.opts.details);
  }

  /**
   * Éste método es utilizado si necesitamos una DetailsView temporal, que luego pueda ser llamada por un diálogo modal (por ejemplo)
   * Utilizado inicialmente en las grabaciones dentro del player desde la miniEPG
   * @param {Object} datos_editoriales
   */
  setDetailsTemporal(datos_editoriales) {
    this._playerView.opts.detailsTemporal = new DetailsView(jQuery("<div></div>"));
    this._playerView.opts.detailsTemporal.setPath("", "");
    this._playerView.opts.detailsTemporal.setPlayerMode();
    this._playerView.opts.detailsTemporal.setDatosEditoriales(datos_editoriales);
    this._playerView.opts.detailsTemporal.calculateStatus();
    this._playerView.opts.detailsTemporal.setEffectiveContent();
  }
}

/**
 * @typedef {import("./player-view").PlayerView} PlayerView
 */
