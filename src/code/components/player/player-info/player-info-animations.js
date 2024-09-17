import { AnimationsMng } from "src/code/managers/animations-mng";

export class PlayerInfoAnimations {
  constructor(playerInfoComponent) {
    /**
     * @type {import("./player-info").PlayerInfoComponent}
     */
    this.playerInfoComponent = playerInfoComponent;
  }

  /** @type {JQuery<HTMLElement>} */
  get iconDesc() {
    return this._getElement("icon_desc");
  }

  /** @type {JQuery<HTMLElement>} */
  get contentArrow() {
    return this._getElement("content_arrow");
  }

  /** @type {JQuery<HTMLElement>} */
  get contentDesc() {
    return this._getElement("content_desc");
  }

  /** @type {JQuery<HTMLElement>} */
  get progressBar() {
    return this._getElement("progress_bar");
  }

  /** @type {JQuery<HTMLElement>} */
  get programs() {
    return this._getElement("programs");
  }

  /** @type {JQuery<HTMLElement>} */
  get actionsWrap() {
    return this.playerInfoComponent.playerRef?.opts?.playerActionsComp?.opts?.wrap;
  }

  /**
   * Obtiene un elemento del componente
   * @param {string} elementKey elemento a obetene
   * @returns {JQuery<HTMLElement>}
   * @private
   */
  _getElement(elementKey) {
    return this.playerInfoComponent.opts.elems[elementKey];
  }

  /**
   * Animaciones de mostrar los controlles
   */
  async animateShowDescription() {
    const component = this.playerInfoComponent;
    const transform = AnimationsMng.instance.transform;

    this.contentArrow?.addClass("active");
    await transform(this.iconDesc, "rotate(180deg)");
    await transform(this.iconDesc, "translate3d(0px, 176px, 0px) rotate(180deg)");
    this.contentDesc?.css("opacity", 1);
    if (component.playerRef._mode === 0) {
      component.playerRef.opts.playerActionsDescComp.opts.wrap.css("opacity", 1);
      component.playerRef.activeComponent = component.playerRef.opts.playerActionsDescComp;
    } else {
      component.showPrograms();
    }
    this.contentArrow?.removeClass("active");

    if (component.playerRef._mode === 0) {
      await transform(this.progressBar, "translate3d(0px, 214px, 0px)");
    }

    await transform(this.actionsWrap, "translate3d(0px, 184px, 0px)");
  }

  /**
   * Animaciones de ocultar los controles
   */
  async animateHideDescription() {
    const transform = AnimationsMng.instance.transform;
    const $contentInfo = this._getElement("content_info");

    this.contentArrow?.addClass("active");
    this.contentDesc?.css("opacity", 0);
    await transform(this.iconDesc, "translate3d(0px, 184px, 0px) rotate(0deg)");
    await transform(this.iconDesc, "translate3d(0px, 0px, 0px) rotate(0deg)");
    this.contentArrow?.removeClass("active");
    await transform(this.progressBar, "translate3d(0px, 0px, 0px)");
    await transform(this.programs, "translate3d(0px, 0px, 0px)");
    await transform(this.actionsWrap, "translate3d(0px, 0px, 0px)");
    await transform($contentInfo, "translate3d(0px, 0px, 0px)");
  }
}
