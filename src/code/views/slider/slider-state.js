// @ts-check

import { AppStore } from "src/code/managers/store/app-store";

let _instance;

const NOT_DEFINED = -1;

export class SliderState {
  #row = NOT_DEFINED;
  #col = NOT_DEFINED;

  /** @type {SliderState} */
  static get instance() {
    if (!_instance) {
      _instance = new SliderState();
    }
    return _instance;
  }

  get row() {
    return this.#row;
  }

  get col() {
    return this.#col;
  }

  /**
   * @param {import("./slider").SliderView} sliderView
   */
  save(sliderView) {
    if (!sliderView?.isHome) {
      return;
    }
    this.#row = sliderView.opts.activeSlider;

    this.#col = 0;
    const activeSlider = sliderView.opts.sliders[this.#row];
    if (activeSlider?.opts) {
      this.#col = activeSlider.opts.itemIndex;
    }
  }

  /**
   *
   * @param {import("./slider").SliderView} sliderView
   * @return {boolean} true si se restauro el home
   */
  restore(sliderView) {
    if (!sliderView?.isHome) {
      return false;
    }
    // Si restart home = false no se debe mantener el foco
    if (!AppStore.home.itMustKeepFocus()) {
      return false;
    }

    AppStore.home.setItMustKeepFocus(-1);
    if (this.row !== NOT_DEFINED) {
      const self = this;
      sliderView.active_slider(self.row);
      const slider = sliderView.opts.sliders[self.row];
      slider.sel_item(self.col);
      return true;
    }
    return false;
  }
}
