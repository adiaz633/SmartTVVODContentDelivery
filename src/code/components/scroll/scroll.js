import { BaseComponent } from "src/code/views/base-component";

export class ScrollUtil extends BaseComponent {
  constructor(wrap, scrollParams, type) {
    super(wrap);
    this.opts = {
      wrap,
      type,
      total_items: scrollParams.total_items || -1,
      translate: scrollParams.translate || 0,
      default_translate_px: scrollParams.default_translate_px || 80,
    };
  }

  calculateTranslate(focused, _force) {
    const focusElement = this.opts.wrap.querySelector(".focus");
    let focusOffsetTop = 0;
    if (focusElement) {
      focusOffsetTop = focusElement.offsetTop;
      const wrapOffsetTop = this.opts.wrap.offsetTop;
      if ((focused < 2 || _force) && focusOffsetTop >= wrapOffsetTop) {
        focusOffsetTop -= wrapOffsetTop;
      }
      return focusOffsetTop;
    }
    return this.opts.translate;
  }

  goUp(focused, _force) {
    _force = _force || true;
    if (focused < this.opts.total_items && focused >= 0) {
      if (focused === 0) {
        this.opts.translate = 0;
        this.opts.wrap.removeAttribute("style");
      } else {
        this.opts.translate = this.opts.translate - this.opts.default_translate_px;
        const translate = this.calculateTranslate(focused, _force);
        var style = `transition: transform 0.3s ease-in-out; transform: translate3d(0px, -${translate}px, 0px)`;
        this.opts.wrap.setAttribute("style", style);
      }
    }
  }

  goDown(focused, _force) {
    _force = _force || true;
    let _start = 0;
    if (focused < this.opts.total_items - 1) {
      switch (this.opts.type) {
        case "linked_devices":
          _start = 2;
          break;
        case "stb_devices":
          _start = 1;
          break;
      }
    } else {
      _start = this.opts.total_items;
    }
    if (focused < this.opts.total_items && focused > _start) {
      this.opts.translate = this.opts.translate + this.opts.default_translate_px;
      const translate = this.calculateTranslate(focused, _force);
      var style = `transform: translate3d(0px, -${translate}px, 0px)`;
      this.opts.wrap.setAttribute("style", style);
    }
  }
}
