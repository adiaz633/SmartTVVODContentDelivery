//@ts-check
import { BaseComponent } from "src/code/views/base-component";
import i18next from "i18next";

export class BackComponent extends BaseComponent {
  /**
   * constructor
   * @param {HTMLElement} wrap
   * @param {import ("../../js/alterbus").EventBus=} eventBus
   */
  constructor(wrap, eventBus) {
    super(wrap);
    this.opts = {
      eventBus,
      wrap, // contiene la referencia al wrapper donde se inserta el componente
      tpl: {
        back: `<div id="tv-back" class="tv-back hint">{{{Leyenda}}}</div>`,
        icon: `<span class="icon tv-back__icon"></span>`,
      },
      back: null,
      json: null,
    };
  }

  /**
   * Inicialización de componente back
   * @param {HTMLElement} wrap
   * @param {Object} json
   */
  init(wrap, json) {
    this.opts.wrap = wrap;
    this.opts.json = json;
  }

  /**
   * Destroy de componente back
   */
  destroy() {
    super.destroy();
    this.opts.wrap.remove();
    this.opts = null;
  }

  /**
   * Renderización de componetne con datos de etiquetas de texto
   */
  setText(leyenda) {
    var back_tpl = this.opts.tpl.back;
    this.opts.json.Leyenda = i18next.t(leyenda || this.opts.json.Leyenda).replace("[icon.back]", this.opts.tpl.icon);
    back_tpl = back_tpl.replace("{{{Leyenda}}}", this.opts.json.Leyenda);
    this.opts.wrap.innerHTML = back_tpl;
  }
}
