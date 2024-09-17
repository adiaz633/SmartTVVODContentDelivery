// @ts-check

import { appConfig } from "@appConfig";
import { ModalMng } from "src/code/managers/modal-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { VolumeMng } from "src/code/managers/volume-mng";
import { Main } from "@tvMain";
import { debug } from "@unirlib/utils/debug";
import i18next from "i18next";

const NO_DISPONIBLE = "NO DISPONIBLE";

/**
 * Factory para construir funciones de error
 *
 * @param {"getError" | "getErrorByCode"} getErrorFunctionName - Función para obtener el error
 * @param {boolean} [useTextReplacement]  True si se ejecutan las funciones de substitución de texto si están disponibles
 * @return {ShowErrorMsgFunction}
 */
const errorFunctionFactory = (getErrorFunctionName, useTextReplacement = true) => {
  return function (origen, _fin, section, id, _doAction, targetText, replaceText) {
    const replacement = `${replaceText}`;
    /** @type {ErrorInfo} */
    let errorDefinition = this[`${getErrorFunctionName}`].call(this, section, id);
    if (!errorDefinition) {
      errorDefinition = /** @type {ErrorInfo} */ (this.getError("general", "E_Gen_1"));
    }
    const popupDefs = {
      id,
      class: "popup",
      text: errorDefinition.Titulo,
      description: errorDefinition.Cuerpo,
      okButton: errorDefinition?.Bot_OK || "",
    };

    if (errorDefinition.Autocierre) {
      popupDefs.progress = {
        type: "button",
        time: appConfig.MS_AUTOCIERRE,
        index: 0,
      };
    }

    if (useTextReplacement && targetText?.length) {
      if (replacement?.length) {
        popupDefs.description = popupDefs.description.replace(targetText, replacement);
      } else {
        popupDefs.description = targetText;
      }
    }

    ModalMng.instance.showPopup(popupDefs, origen);
    return this;
  };
};

/**
 * Clase para el manejo de errores
 */
export class AppError {
  #id = "";
  #fatal = false;
  #cod_error = "";
  /** @type {ErrorTooltip} */
  #tooltips = null;
  #tooltips_section = null;
  #tooltips_section_errorId = null;

  constructor() {
    this.showError = errorFunctionFactory("getError", false).bind(this);
    this.showErrorText = errorFunctionFactory("getError").bind(this);
    this.showErrorTextReplace = errorFunctionFactory("getError").bind(this);
  }

  /**
   * @type {ShowErrorMsgFunction}
   */
  showError() {
    return this;
  }

  /**
   * @type {ShowErrorMsgFunction}
   */
  showErrorText() {
    return this;
  }

  /**
   * @type {ShowErrorMsgFunction}
   */
  showErrorTextReplace() {
    return this;
  }

  /**
   * @param {string} section
   * @param {string} id
   * @returns {ErrorType}
   */
  getErrorNative(section, id) {
    return this.getError(section, id);
  }

  /**
   * @param {string} section
   * @param {string} id
   * @returns {ErrorType}
   */
  getError(section, id) {
    const errorDef = this.buscar_error(section, id);
    this.#id = id;
    this.#setErrorValues(/** @type {ErrorInfo} */ (errorDef));
    return errorDef;
  }

  getCodError() {
    return `${this.#id} (${this.#cod_error})`;
  }

  getFatal() {
    return this.#fatal;
  }

  get_texto_blackout() {
    return i18next.t("texto_blackout", NO_DISPONIBLE);
  }

  /**
   * @param {string} section
   * @param {string} id
   * @returns {ErrorType}
   */
  buscar_error(section, id) {
    const str = `errors.${section}.${id}`;
    const msg = i18next.t(str, { returnObjects: true });
    if (!msg) {
      return {
        Titulo: "Servicio temporalmente no disponible",
        Cuerpo: "Lo sentimos, el servicio está temporalmente no disponible. Inténtalo más tarde. Gracias.",
      };
    }

    return msg;
  }

  async showErrorConfig() {
    await this.showErrorAsync("carga", "E_Carga_1");
  }

  async showErrorConfigGraphics() {
    await this.showErrorAsync("carga", "E_Carga_1");
  }

  async showErrorServices() {
    this.#fatal = true;
    await ModalMng.instance.showPopup("servicio_no_disponible");
  }

  async showErrorServiceDirectory() {
    this.#fatal = true;
    await VolumeMng.instance.hide();
    await ModalMng.instance.showPopup("directorio_servicio_no_disponible");
  }

  /**
   * @param {BaseView} [origen]
   * @param {string} [_fin]
   * @param {string} [text]
   * @param {string} [description]
   */
  showErrorMsg(origen, _fin, text, description) {
    this.#fatal = false;
    ModalMng.instance.showPopup({ text, description }, origen);
  }

  showErrorFirmware() {
    this.#fatal = true;
    ModalMng.instance.showPopup("firmware_no_actualizado");
  }

  showErrorNetwork() {
    this.#fatal = false;
    ModalMng.instance.showPopup("error_de_conexion");
  }

  /**
   * @type {ShowErrorMsgFunction}
   */
  showErrorPlay(origen, fin, section, id, doAction) {
    if (!AppStore.yPlayerCommon.isAutoplay()) {
      this.showError(origen, fin, section, id, doAction);
    }
    return this;
  }

  hideError() {
    ModalMng.instance.hidePopup();
  }

  showErrorBack(idHTML, divId, seccion, id) {
    let errorInfo = this.getError(seccion, id);
    if (!errorInfo) errorInfo = this.getError("general", "E_Gen_1");
    if (typeof errorInfo === "string") {
      errorInfo = {
        Titulo: errorInfo,
        Cuerpo: "",
      };
    }

    if (errorInfo) {
      const info = /** @type {ErrorInfo} */ (errorInfo);
      const sec = document.createElement("div");
      sec.className = divId;
      sec.id = divId;
      document.getElementById(idHTML).appendChild(sec);

      let newP = document.createElement("p");
      newP.className = "vacio";
      Main.putInnerHTML(newP, info.Titulo);
      sec.appendChild(newP);

      newP = document.createElement("p");
      newP.className = "sugerencia";
      Main.putInnerHTML(newP, info.Cuerpo);
      sec.appendChild(newP);
    }
  }

  /**
   * @deprecated
   */
  generateAuxErrorScene(/** @type {String} */ key) {
    debug.alert(`error.prototype.generateAuxErrorScene ${key}`);
    const content = String.raw`
      <div class="screen popupscene" id="errorscreen">
        <div class="popup">
          <div class="text">
            <p id="titulo_error" class="titulo"></p>
            <p id="desc_error" class="descripcion"></p>
          </div>
          <div class="buttons">
            <div id="button_continuar" class="button active">
              <span class="button-text">Salir</span>
            </div>
          </div>
        </div>
      </div>
    `;
    const html_id = `Scene${key}`;
    $(`#${html_id}`).html(content);

    const item = document.getElementById("titulo_error");
    Main.putInnerHTML(item, "Error de conexión");
    const item2 = document.getElementById("desc_error");
    Main.putInnerHTML(
      item2,
      "No hay conexión con el servidor. Revisa tu conexión a Internet o inténtalo más tarde. Gracias."
    );

    this.#fatal = true;
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  getTooltip(key) {
    this.#tooltips_section = this.#tooltips_section ?? "Ficha";
    this.#tooltips_section_errorId = this.#tooltips_section_errorId ? this.#tooltips_section_errorId : "I_FIC_1";
    if (!this.#tooltips) {
      const errorInfo = this.buscar_error(this.#tooltips_section, this.#tooltips_section_errorId);
      this.#tooltips = /** @type {ErrorTooltip} */ (errorInfo);
    }
    const tooltip = this.#tooltips[key];
    return tooltip;
  }

  /**
   * @param {string} section
   */
  setTooltipSection(section) {
    if (this.#tooltips_section !== section) {
      this.#tooltips_section = section;
      this.#tooltips = null;
    }
  }

  /**
   * @param {string} errorId
   */
  setTooltipSectionErrorId(errorId) {
    if (this.#tooltips_section_errorId !== errorId) {
      this.#tooltips_section_errorId = errorId;
      this.#tooltips = null;
    }
  }

  /**
   * @param {string} section
   * @param {string} id
   * @returns {Promise<any>}
   */
  async showErrorAsync(section, id) {
    let errorType = this.getError(section, id);
    if (typeof errorType === "string") {
      errorType = {
        Titulo: errorType,
        Cuerpo: errorType,
        Autocierre: false,
      };
    }
    const errorInfo = /** @type {ErrorInfo} */ (errorType);
    const popupDefs = {
      id,
      class: "popup",
      text: errorInfo.Titulo,
      description: errorInfo.Cuerpo,
    };
    if (errorInfo.Autocierre) {
      popupDefs.progress = {
        type: "button",
        time: appConfig.MS_AUTOCIERRE,
        index: 0,
      };
    }

    return ModalMng.instance.showPopup(popupDefs);
  }

  //  ----------
  //  Private
  //  ----------

  /**
   * Establecer los valores del error
   * @param {ErrorInfo} error - Error info
   */
  #setErrorValues(error) {
    if (error) {
      this.#id = error.id;
      this.#cod_error = error.Cod_error ?? "";
      this.#fatal = error.Fatal !== undefined ? error.Fatal === true : true;
    }
  }
}

export const error = AppError;

/**
 * @callback ShowErrorMsgFunction
 * @this {AppError}
 * @param {BaseView | null} [origen]
 * @param {any} [fin] notused
 * @param {any} [section]
 * @param {any} [id]
 * @param {any} [doAction] not used
 * @param {string} [targetText]
 * @param {string|number} [replaceText]
 * @returns {AppError}
 */

/**
 * @typedef {{[key: string]: any}} AdditionalInfo
 */

/**
 * @typedef ErrorDialogInfo
 * @property {string} [Cod_error]
 * @property {string} [Titulo]
 * @property {string} [Cuerpo]
 * @property {string} [Nombre]
 * @property {boolean} [Autocierre]
 * @property {boolean} [Fatal]
 */

/** @typedef {ErrorDialogInfo & AdditionalInfo} ErrorInfo */

/**
 * @typedef ErrorTooltip
 * @property {string} [tooltip]
 * @property {string} [tooltip_right]
 * @property {string} [Texto]
 */

/**
 * @typedef { (string | ErrorInfo | ErrorTooltip) & Record<string, any>  } ErrorType
 */

/**
 * @typedef {import("src/code/views/base-view").BaseView} BaseView
 */
