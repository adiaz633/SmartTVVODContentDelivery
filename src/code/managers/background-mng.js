// @ts-check

import { appConfig } from "@appConfig";
import { AppStore } from "src/code/managers/store/app-store";

import { viewTypeNames } from "./view-mng";

let _instance = null;

export class BackgroundMng {
  /** @type {JQuery|null} */
  #img_pre_load;

  /**
   * Singleton of __BackgroundMng__
   * @type {BackgroundMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new BackgroundMng();
    }
    return _instance;
  }

  constructor() {
    /** @private */
    this.opts = {
      /**
       * @type {boolean}
       * @deprecated usar {@link reload_fanart} en vez
       */
      reload_fanart: false,
      /** @type {JQuery} */
      wrap: null,
      bgTimeout: null,
      imageSet: null, // Image present in scene
      /** @type {string|null} */
      imageLoading: null, // Image loading until set
      /** @type {JQuery} */
      $image: null,
      /** @type {JQuery} */
      $underlay: null,
      /** @type {JQuery} */
      $overlay: null,
      src_bg_default: "./images/server/images/mainmenu/mas_fondo.jpg",
      src_bg_black: "./images/server/images/mainmenu/black.jpg",
    };

    this.#img_pre_load = null;
    this.#init();
  }

  /**
   * True, si se debe recargar el fan art
   *
   * @return {boolean} The value of the 'reload_fanart' property.
   */
  get reload_fanart() {
    return this.opts.reload_fanart;
  }

  set reload_fanart(value) {
    this.opts.reload_fanart = value;
  }

  /**
   * @param {string} imageUrl
   * @param {boolean} [useTimeout = false]
   * @returns {void}
   */
  load_bg_image(imageUrl, useTimeout = false) {
    const buscador = document.querySelector(".search-wrap");
    const isBuscador = buscador?.classList.value.includes("active");
    if (isBuscador) {
      return;
    }
    this.opts.reload_fanart = false;
    if (!appConfig.SHOW_FANARTS) {
      return;
    }

    if (imageUrl === null) {
      this.set_bg_black();
    } else {
      if (imageUrl === this.opts.imageLoading && useTimeout) {
        this.focus_background();
      } else {
        this.#clearBgTimeout();
        if (imageUrl === this.opts.imageSet) {
          this.focus_background();
        } else {
          this.opts.imageLoading = imageUrl;
          this.blur_background();
          if (useTimeout) {
            this.opts.bgTimeout = setTimeout(() => {
              this.#load_bg_image_with_precatch(imageUrl);
            }, appConfig.SHOW_FANART_DELAY);
          } else {
            this.#load_bg_image_with_precatch(imageUrl);
          }
        }
      }
    }
  }

  hide_bg_image() {
    this.set_bg_black();
  }

  /**
   *
   * @param {JQuery} image_tag Imagen
   * @param {string} imageUrl url de la imagen
   */
  set_bg_image(image_tag, imageUrl) {
    const active = AppStore.home.elementActive();
    if (!AppStore.yPlayerCommon.backgroundMode()) {
      if (active === "player-view" && AppStore.yPlayerCommon.isPlaying()) {
        this.#clearBgTimeout();
        return;
      } /*else if (!AppStore.yPlayerCommon.isPlaying() && AppStore.yPlayerCommon.isAutoplay()) {
        this.#clearBgTimeout();
        this.focus_background();
        return;
      }*/
    }

    if (imageUrl === this.opts.imageLoading) {
      this.opts.imageSet = imageUrl;
      this.opts.imageLoading = null;
      this.opts.$image.empty();
      this.opts.$image.append(image_tag);
      this.show_full_background();
      this.focus_background();
    }
  }

  /**
   * @param {boolean} [useTimeout = false]
   */
  load_bg_default(useTimeout = false) {
    this.load_bg_image(this.opts.src_bg_default, useTimeout);
  }

  set_bg_default() {
    this.#set_bg(this.opts.src_bg_default);
  }

  set_bg_black() {
    this.#set_bg(this.opts.src_bg_black);
  }

  set_bg_invisible() {
    this.opts.wrap.css("display", "none");
  }

  blur_background() {
    this.opts.$image.removeClass("active");
  }

  focus_background() {
    this.opts.$image.addClass("active");
  }

  show_background() {
    this.opts.wrap.show();
  }

  show_black_background() {
    this.set_bg_black();
    this.show_full_background();
  }

  hide_background(/* contextView = undefined */) {
    //
    // Solo la vista de player o 3pa puede ocultar el background
    // TODO: se comenta por problemas con el popup de inactividad sobre una 3pa
    // if (contextView?.type !== viewTypeNames.PLAYER_VIEW && contextView?.type !== viewTypeNames.THIRD_PARTY_VIEW) {
    //   throw new Error("Solo la vista de player o 3pa puede ocultar el background");
    // }

    this.#clearBgTimeout();
    this.opts.wrap.hide();
    this.opts.imageSet = null;
    this.opts.imageLoading = null;
  }

  hide_full_background(contextView) {
    this.hide_background(contextView);
    this.opts.$underlay.hide();
    this.opts.$image.hide();
  }

  get_imageSet() {
    return this.opts.imageLoading ? this.opts.imageLoading : this.opts.imageSet;
  }

  get_background_image() {
    return this.opts.$image.css("background-image");
  }

  show_background_veil_only() {
    this.show_background();
    this.opts.$underlay.hide();
    this.opts.$image.hide();
  }

  show_full_background() {
    this.show_background();
    this.opts.$underlay.show();
    this.opts.$image.show();
  }

  /**
   * @param {string} imageUrl
   */
  #load_bg_image_with_precatch(imageUrl) {
    this.#cancel_bg_image_with_precatch();
    if (imageUrl) {
      const self = this;
      this.$img_pre_load = $("<img/>")
        .attr("src", imageUrl)
        .on("load", function () {
          $(this).remove();
          const $pre_img = $(this);
          self.set_bg_image($pre_img, imageUrl);
          self.#img_pre_load = null;
        })
        .on("error", function () {
          self.set_bg_default();
          $(this).remove();
          //self.cancel_bg_image_with_precatch();
        });
    }
  }

  #cancel_bg_image_with_precatch() {
    if (this.#img_pre_load) {
      this.#img_pre_load.attr("src", "");
      this.$img_pre_load = null;
    }
  }

  setEpgOverlay() {
    this.set_bg_black();
    this.show_full_background();
    this.opts.$underlay.addClass("clipped");
    this.opts.$overlay.addClass("epg");
    this.opts.$overlay.addClass("clipped");
    this.opts.$image.addClass("clipped");
    this.opts.$image.addClass("epg");
  }

  unsetEpgOverlay() {
    this.opts.$underlay.removeClass("clipped");
    this.opts.$overlay.removeClass("epg");
    this.opts.$overlay.removeClass("clipped");
    this.opts.$image.removeClass("clipped");
    this.opts.$image.removeClass("epg");
    this.set_bg_black();
    this.show_full_background();
  }

  #init() {
    const backgroundTemplate = String.raw`
    <div id="global_background" class="slider-body-bg">
      <div class="background-underlay"></div>
      <div class="bg_image"></div>
      <div class="background-overlay"></div>
    </div>
    `;

    const backgroundElement = $("#global_background");
    if (!backgroundElement.length) {
      this.opts.wrap = jQuery(backgroundTemplate).prependTo("body");
    } else {
      this.opts.wrap = backgroundElement;
    }
    this.opts.$underlay = $(".background-underlay");
    this.opts.$overlay = $(".background-overlay");
    this.opts.$image = $(".bg_image");
  }

  #clearBgTimeout() {
    this.opts.imageLoading = null;
    if (this.opts.bgTimeout) {
      clearTimeout(this.opts.bgTimeout);
      this.opts.bgTimeout = null;
    }
  }

  #set_bg(url) {
    this.#clearBgTimeout();
    const $img = $(String.raw`<img src=${url} alt="background" />`);
    this.opts.$image.empty();
    this.opts.$image.append($img);
    this.opts.imageSet = null;
    this.opts.imageLoading = null;
    this.focus_background();
  }
}
