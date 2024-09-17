// @ts-check

import "./html/overlay.css";

import { PlayMng } from "src/code/managers/play-mng";
import { ViewMng, viewTypeNames } from "src/code/managers/view-mng";
import { EpgViewEventNames } from "@newPath/views/epg/epg-constants";
import { yPlayerCommon } from "@unirlib/server/yPlayerCommon";

import { BaseMng } from "../base-mng";
import { DialMng } from "../dial-mng";
import { ANY_VIEW, HOME_VIEW } from "./constants";
import { after } from "./macros";
import { transitionsRules } from "./transitions-rules";

let _instance;

/**
 * Maneja las transiciones entre vistas principalmente las que reproducen
 * video (EPG y player) para que no se manifiesten saltos inesperados
 */
export class ViewTransitionMng extends BaseMng {
  /**
   * Singleton de {@link ViewTransitionMng}
   * @type {ViewTransitionMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new ViewTransitionMng(transitionsRules);
    }
    return _instance;
  }

  /**
   * Tiempo en MS para activar la transicion
   */
  transitionMs = 0;

  /**
   * Elemento donde se ancla el overlay
   * @type {string}
   */
  #rootSelector = "html";

  /** @type {string} */
  #componentId = "view-transition-overlay";

  /** @type {string} */
  // @ts-ignore
  #componentTemplate = require("./html/overlay.html");

  /** @type {boolean}  */
  #isShown = false;

  /** @type {NodeJS.Timeout | undefined} */
  #timeout = undefined;

  /**
   * @type {number | undefined}
   * @summary Se esperan 11 segundos que es lo que tarda la publi en salir
   * para los demas casos no deberia llegar a este timeout
   */
  #timeoutMs = 11_000;

  /** @type {string[]} */
  #beforeCommands = [];

  /** @type {string[]} */
  #afterCommands = [];

  /** @type {TransitionRules} */
  #transitions;

  /**
   *
   * @param {TransitionRules} transitions
   */
  constructor(transitions) {
    super("TransitionMng");
    this.#transitions = transitions;
  }

  /**
   * Devuelve true si se esta mostrando el overlay
   */
  get isShown() {
    return this.#isShown;
  }

  /**
   * Obtiene las reglas de la transicion
   */
  get transitions() {
    return this.#transitions;
  }

  /**
   * Inicializa las escuchas de eventos
   */
  init() {
    if (!this.isEnabled) return;

    DialMng.instance.on("channelOk", this.#onDialChannelOk.bind(this));

    PlayMng.instance.on("player_AdRequest", this.showTransition.bind(this));
    PlayMng.instance.on("player_firstFrameOnDisplay", this.#onFirstFrameOnDisplay.bind(this));
    PlayMng.instance.on("player_PlayerChanged", this.#onPlayerChanged.bind(this));

    // Esto es un evento custom
    // @ts-ignore
    ViewMng.instance.on(EpgViewEventNames.epgOnPlayCommand, this.#onEpgPlayCommand.bind(this));
    ViewMng.instance.on("transition", this.#onTransition.bind(this));
    ViewMng.instance.on("beforeActivate", this.#onBeforeActivate.bind(this));
    ViewMng.instance.on("activate", this.#onActivate.bind(this));
    ViewMng.instance.onReady(this.#onViewReady.bind(this));
  }

  /**
   * Componente asociado
   *
   * @protected
   * @return {HTMLElement}
   */
  getComponent() {
    return document.getElementById(this.#componentId);
  }

  /**
   * Muestra un overlay
   *
   * @returns {Promise<void>}
   */
  async showTransition() {
    const ZERO_MS = 0;
    if (this.isShown || !this.isEnabled) {
      return;
    }
    this.#isShown = true;
    this.#insertTemplate();
    if (this.transitionMs === ZERO_MS) {
      this.#activateOverlay();
    } else {
      setTimeout(() => {
        this.#activateOverlay();
      }, this.transitionMs);
    }
  }

  /**
   * Muestra la transicion si en la epg el canal actual es el
   * canal de background
   *
   * @param {BaseView} from Origen de la transicion
   * @param {BaseView} to Destino de la transicion
   */
  showTransitionIfNotBackgroundChannel(from, to) {
    const view = [from, to].find((itemView) => itemView?.type === viewTypeNames.EPG_VIEW);
    if (asEpgView(view)?.currentChannelIsBackground) {
      return;
    }
    this.showTransition();
  }

  /**
   * Si el contenido que se esta reproduciendo no ha cambiado
   * hacer un show
   * @param {BaseView} from Vista origen de la transicion
   */
  showTransitionIfContentChanged(from) {
    const contentChanged = yPlayerCommon.contentChanged || DialMng.instance.dialChanged;
    const isChannelSlider = isSourceChannelSlider(asSliderView(from));
    if (!contentChanged || isChannelSlider) {
      return;
    }
    this.showTransition();
  }

  /**
   * Si la vista activa es slider-view y es la vista de sliders de similares del player,
   * no mostramos transición, en caso contrario lo haremos si ha cambiado el conteido
   * para mantener el caso general
   *
   * @param {BaseView} from Vista origen de la transicion
   */
  showTransitionIfNotPlayerSliders(from) {
    if (from.type === viewTypeNames.SLIDER_VIEW && asSliderView(from).isSliderViewPlayer()) {
      return;
    }
    this.showTransitionIfContentChanged(from);
  }

  /**
   * Si estamos en player-view y está el slider de sugerencias(slider-view) no hacemos transición,
   * en cualquier otro caso si haremos transición
   *
   * @param {BaseView} from Vista origen de la transicion
   */
  showTransitionIfNotSimilars(from) {
    if (from.type === viewTypeNames.PLAYER_VIEW && asPlayerView(from).opts.sliderSugerencias) {
      return;
    }
    this.showTransitionIfContentChanged(from);
  }

  /**
   * Cierra el overlay
   * @returns {void}
   */
  hideTransition() {
    clearTimeout(this.#timeout);
    this.#removeComponent();
    this.#timeout = undefined;
    this.#isShown = false;
  }
  async #onDialChannelOk() {
    if (ViewMng.instance.lastView?.type === viewTypeNames.EPG_VIEW) {
      return;
    }
    await this.showTransition();
  }

  /**
   * Se dispara cuando una vista ha indicado que esta lista
   */
  #onViewReady() {
    this.hideTransition();
  }

  /**
   * Se dispara cuando el {@link ViewMng} ejecuta una transicion
   *
   * @param {BaseView} from
   * @param {BaseView} to
   */
  #onTransition(from, to) {
    if (!this.#applyTransitionRules(from, to)) {
      this.#applyTransitionRules(undefined, to);
    }
  }

  /**
   * Se dispara cuando el {@link ViewMng} ejecuta una transicion
   *
   * @param {BaseView} from
   * @param {BaseView} to
   */
  #applyTransitionRules(from, to) {
    this.log(`rulesApply`, `* from: ${from?.type}`, `* to: ${to?.type}`);
    let ruleExists = false;
    let toKey = "NO DESTINATION";
    const fromKey = this.#getViewType(from);
    const destination = this.transitions[fromKey];
    if (destination) {
      toKey = this.#getViewType(to);
      const command = destination[toKey];
      if (command) {
        ruleExists = true;
        if (typeof command === "function") {
          if (command.name === after.name) {
            this.#afterCommands.push(command());
          } else {
            this.#beforeCommands.push(command());
          }
        } else {
          this.#runTransition(command, from, to);
        }
      }
    }
    return ruleExists;
  }

  /**
   * Obtiene el tipo de la vista y aplica alias
   *
   * @param {BaseView} [view] Vista
   */
  #getViewType(view) {
    if (!view) {
      return ANY_VIEW;
    }

    if (view.type === viewTypeNames.SLIDER_VIEW && asSliderView(view).isHome) {
      return HOME_VIEW;
    }
    return view.type;
  }

  /**
   * Se dispara cuando la epg ejecuta un PLAY
   *
   * @param {BaseView} view
   * @param {object} args
   */
  #onEpgPlayCommand(view, args) {
    if (args.isPastEmission) {
      this.showTransition();
    }
  }

  /**
   * Se dispara cuando el {@link ViewMng} ejecuta la accion previa a activar
   * una vista
   *
   * @param {string} viewType
   * @param {BaseView} view
   */
  #onBeforeActivate(viewType, view) {
    if (this.#beforeCommands.length) {
      this.#runTransition(this.#beforeCommands.shift(), view);
    }
  }

  /**
   * Se dispara cuando el {@link ViewMng} ejecuta la accion previa a activar
   * una vista
   *
   * @param {string} viewType
   * @param {BaseView} view
   */
  #onActivate(viewType, view) {
    if (this.#afterCommands.length) {
      this.#runTransition(this.#afterCommands.shift(), view);
    } else if (!this.#getIsViewDefined(viewType)) {
      this.hideTransition();
    }
  }

  /**
   * Verifica si una vista está en el mapa de transiciones
   *
   * @param {string} viewType Tipo de vista
   * @returns {boolean} true si la vista esta definida en el mapa de transiciones
   */
  #getIsViewDefined(viewType) {
    return Object.keys(this.transitions).includes(viewType);
  }

  /**
   * Ejecuta un comando de transicion entre vistas
   *
   * @param {string} command
   * @param {*} from
   * @param {*} [to]
   */
  #runTransition(command, from, to = undefined) {
    if (command && typeof this[`${command}`] === "function") {
      this[`${command}`](from, to);
    }
  }

  /**
   * inserta el HTML de la plantilla al elemento del DOM correspondiente
   */
  #insertTemplate() {
    document.querySelector(this.#rootSelector).insertAdjacentHTML("beforeend", this.#componentTemplate);
  }

  /**
   * Elimina el componente de html de overlay
   */
  #removeComponent() {
    this.getComponent()?.remove();
  }

  /**
   * Inicia el timeout para hacer autoclose
   */
  #startAutoclose() {
    if (this.#timeoutMs) {
      clearTimeout(this.#timeout);
      this.#timeout = setTimeout(() => {
        this.hideTransition();
      }, this.#timeoutMs);
    }
  }

  /**
   * Activa el overlay
   */
  #activateOverlay() {
    const component = this.getComponent();
    if (!component) {
      console.warn("viewTransitionMng._activateOverlay NO COMPONENT");
      return;
    }
    component.classList.add("view-transition-overlay--active");
    this.#startAutoclose();
  }

  /**
   * Se dispara cuando el player hace un first frame
   */
  #onFirstFrameOnDisplay() {
    if (ViewMng.instance.isPlayerActive()) {
      this.hideTransition();
    }
  }

  /**
   * Se dispara si en el playmng se hace un cambio de player
   */
  #onPlayerChanged() {
    if (ViewMng.instance.active.type !== viewTypeNames.DETAILS_VIEW) {
      this.showTransition();
    }
  }
}

/**
 * Comprueba si la vista slider de origen está en una calle de canales
 * @param {import("src/code/views/slider/slider").SliderView} from vista de origen
 * @returns {boolean}
 */
const isSourceChannelSlider = (from) => {
  let isChannels = false;
  if (from?.type === viewTypeNames.SLIDER_VIEW) {
    isChannels = !isNaN(from.opts.activeSlider) && from.opts.slidersData[from.opts.activeSlider]?.type == "channels";
  }
  return isChannels;
};

/**
 * Hace un cast artificial para tener las propiedades de un slider desde una vista base
 * @template {BaseView} T
 * @param {T} view
 * @returns {SliderView}
 */
const asSliderView = (view) => /** @type {?} */ (view);

/**
 * Hace un cast artificial para tener las propiedades de un EpgView desde una vista base
 * @template {BaseView} T
 * @param {T} view
 * @returns {EpgView}
 */
const asEpgView = (view) => /** @type {?} */ (view);

/**
 * Hace un cast artificial para tener las propiedades de un EpgView desde una vista base
 * @template {BaseView} T
 * @param {T} view
 * @returns {PlayerView}
 */
const asPlayerView = (view) => /** @type {?} */ (view);

/** @typedef {import("src/code/views/base-view").BaseView} BaseView */
/** @typedef {import("@newPath/views/epg/epg").EpgView} EpgView */
/** @typedef {import("src/code/views/player-view/player-view").PlayerView} PlayerView */
/** @typedef {import("src/code/views/slider/slider").SliderView} SliderView */

/**
 * Reglas de las transiciones
 * @typedef {Object.<string, undefined | Object.<string, keyof ViewTransitionMng  | function >>} TransitionRules
 */
