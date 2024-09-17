// @ts-check

import "@newPath/components/carousel/actors.css";
import "@newPath/components/carousel/channels.css";
import "@newPath/components/carousel/movies.css";
import "@newPath/components/carousel/series.css";
import "@newPath/components/carousel/services.css";
import "@newPath/components/carousel/thematic.css";
import "@newPath/components/carousel/nodes.css";
import "@newPath/components/carousel/nodes-vertical.css";

import { appConfig } from "@appConfig";
import { EventBus } from "src/code/js/alterbus";
import { content_status } from "src/code/js/content_status";
import {
  getBackground,
  getBackgroundEnlace,
  getImage,
  getProgress,
  htmlActorsInfoLine,
  htmlInfoLine,
  remove_htmlInfoLine_hide_elements,
} from "src/code/js/lib";
import { lockAnnotation } from "src/code/js/mutex";
import { SECOND } from "src/code/js/time-utils";
import { AutocolapseMng } from "src/code/managers/autocolapse-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";


import { KeyMng } from "src/code/managers/key-mng";

import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { isNil } from "src/code/predicates";

import { EventEmitter } from "events";

import { CarouselBase } from "../carousel-base";


/**@type {String} Identificador de la clase css para colocar elementos con opacidad (deshabilitados) */
const CSS_DISABLE_ELEM = "disabled";

/**
 * Operativa que controla la opacidad de la calle de canales y la capa "No disponible"
 * @private
 * @param {Carousel} carousel Objeto global de carrusel
 * @param {boolean} allow Determina si el elemento está permitido (true) en la evaluación de su acceso por nivel moral
 */
const operationParentalChannelSlider = (carousel, allow) => {

};

export class Carousel extends CarouselBase {
  /**
   * @param {Record<string, any>} opts
   */
  constructor(opts) {
    super();
    this.opts = {
      wrap: jQuery(`[data-slider="${opts.type}"]`),
      data: [],
      status_data: [],
      /** @type {Record<string, string>} */
      tpl: {
        thumb: String.raw`
          <div class="item" data-item-index="##id##">
            <div class="item-wrap pointer">
              <div class="img-wrap">
                <img class="img img-skeleton" src="##imgsrc##">
                <div class="item-indicator"><img src="./images/new/complete-diagonal.png"></div>
              </div>
            </div>
            <div class="item-text"></div>
          </div>
        `,
        progress: String.raw`
          <div class="progress-bar">
            <div class="progress-bar-back">
              <div class="progress-bar-progress" style="width:##progress##%;"></div>
            </div>
          </div>
        `,
      },
      /** @type {string | null} */
      type: null,
      itemIndex: 0,
      has_enlace: false,
      timer_play: null,
      /** @type {HTMLElement | null} */
      items: null,
      count: null,
      firstMove: false,
      refreshing: false,
      images_src: null,
      extras_mode: false,
      /** @type {Record<string, any>[]} */
      elems: [],
      isSkeleton: true,
      firstTime: true,
      isCircular: true,
      isEmpty: false,
      itemsWidth: 0,
      visibleItems: 0,
      titleWidth: 0,
      activateTimeout: null,
      descriptionTimeout: null,
      textosTimeout: null,
      activateChannelsInterval: null,
      isEpisodioFicha: false,
      itemsDesc: null,
      episodeButton: null,
      withFocus: true,
      descendente: false,
      isMultiple: false,
      withoutContent: false,
      fromPlayer: false,
      popupComp: null,
      homeWrap: null,
      pinBlockedWrap: null,
      pinKbCompWrap: null,
      parentSliderWrap: null,
      showFanart: true,
      channel: null,
      currentAutoplayProgram: false,
      isActivation: false,
      isMoving: null,
      hideTitle: null,
      query: null,
      consulta: null,
      preload: null,
      colapsar: null,
      ...opts,
      /** @type {EventEmitter} */
      events: new EventEmitter(),
      /** @type {EventBus} */
      eventBus: new EventBus(this),
      /** @type {Record<string, string>} */
      enlace: null,
      /** @type {{Texto: string} | null} */
      emptyMessage: null,
      /** @type {Number} */
      totalEpisodios: 0,
      player: undefined,
      // /** @type {KeyboardModalComponent} */
      // pinKbComp: undefined,
    };

    this.opts.count = {
      current: this.opts.wrap[0].querySelector(".current"),
      total: this.opts.wrap[0].querySelector(".total"),
    };


    this.move = lockAnnotation(this.move.bind(this));
    this.updateDimensions();
    this.bind_items();
  }

  /*
   * create items
   */
  bind_items() {
    const { opts } = this;

    if (!opts.wrap.length) {
      return false;
    }
    if (this.opts.type === "nodes") {
      this.opts.isCircular = true;
    }
    // cleanup & create items wrap
    let itemsClass = "items";
    if (this.opts.extras_mode) itemsClass = itemsClass += " extras";
    if (this.opts.isMultiple) itemsClass = itemsClass += " multiple";

    // eslint-disable-next-line prefer-destructuring
    opts.items = jQuery(String.raw`<div />`)
      .appendTo(opts.wrap)
      .addClass(itemsClass)[0];
    const self = this;
    opts.items.addEventListener("transitionend", (event) => {
    });
    opts.items.style.transitionDuration = "0s";

    this.updateSkeleton();
    if (this.opts.isMultiple) {
      const countElements = jQuery.parseHTML(String.raw`
        <div class="slider-count-multiple hideCount">
          <span class="current">0</span>de<span class="total">0</span>
        </div>
      `);
      const element = countElements.filter((node) => node.nodeType === Node.ELEMENT_NODE)[0];
      this.opts.wrap[0].insertAdjacentElement("afterbegin", /** @type {Element} */ (element));
    }

    // create description wrapper
    opts.itemsDesc = jQuery(String.raw`<div />`)
      .appendTo(opts.wrap)
      .addClass("items-desc");
    if (this.opts.isEpisodioFicha) {
      opts.episodeButton = jQuery(String.raw`<div class="episode-button"></div>`).appendTo(opts.wrap);
    }
    this.opts.parentSliderWrap = this.opts.wrap[0].parentNode.querySelector(".slider-wrap");
  }


  updateSkeleton(withLogo = true) {
    const { opts } = this;
    this.opts.isSkeleton = true;
    const nItemsSkeleton = this.opts.visibleItems;
    let imgSkeleton = "";
    if (withLogo) {
      // @ts-ignore
      imgSkeleton = `${AppStore.wsData._SRV_RECURSOS}images/mainmenu/logo_skeleton.svg`;
    }
    this.opts.elems = [];
    for (let i = 0; i < nItemsSkeleton; i++) {
      const newItemHtml = opts.tpl.thumb.replace(/##id##/g, `${i}`).replace(/##imgsrc##/g, imgSkeleton);

      const newItem = jQuery(newItemHtml).appendTo(this.opts.items);
      let [itemIndicator] = newItem.find(".item-indicator");
      if (this.opts.type !== "series") {
        itemIndicator.innerHTML = "";
        itemIndicator = null;
      }
      const elem = {
        $item: newItem,
        itemWrap: newItem.find(".item-wrap")[0],
        itemText: newItem.find(".item-text")[0],
        $imgWrap: newItem.find(".img-wrap"),
        img: newItem.find(".img")[0],
        itemIndicator,
        enlace: false,
      };
      this.opts.elems.push(elem);
    }
  }



  getPosition(index) {
    let position = index - this.opts.itemIndex + 2;
    if (position < 0 || position >= this.opts.visibleItems) {
      position = null;
    }
    return position;
  }

  updateDimensions() {
  }

  updateProgress(position, index) {
    if (this.opts.data[index].shortcut?.progress) {
      this.opts.elems[position].$imgWrap.find(".progress-bar").remove();
      const progressHtml = this.opts.tpl.progress.replace(/##progress##/g, this.opts.data[index].shortcut?.progress);
      this.opts.elems[position].$imgWrap.append(progressHtml);
      this.opts.data[index] ? this.update_metadata() : false;
    } else {
      this.opts.elems[position].$imgWrap.find(".progress-bar").remove();
    }
  }



  move(index, firstMove, refreshing) {
    if (this.opts.isMoving !== null) {
      if (this.opts.isMoving === index) {
        this.opts.events.once("endMoveCarousel", (index) => {
          this.move(index, firstMove, refreshing);
        });
      }
      return;
    }
    const { opts } = this;

    opts.isMoving = index;



    this.opts.firstMove = firstMove;
  }

  async getCurrentProgramEPG(channel) {

  }

  async update_metadata() {
    const { opts } = this;
    const index = this.getCurrentItem().attr("data-item-index");
    if (index >= 0 && opts.data[index] && opts.data[index].type != "enlace") {
      if (opts.type === "series" || opts.type === "movies" || opts.type === "services") {
        const statusSelectedItem = opts.status_data[index];
        const selectedItem = opts.data[index];

        const htmlContents = htmlInfoLine(selectedItem, statusSelectedItem, this.opts.isEpisodioFicha);
        opts.itemsDesc.html(htmlContents);
        remove_htmlInfoLine_hide_elements(opts.itemsDesc);
        if (opts.itemsDesc[0].querySelector(".item-info-icons")?.childElementCount === 0)
          opts.itemsDesc[0].querySelector(".item-info-icons").remove();
      } else if (opts.type === "channels") {

        this.opts.itemsDesc.find(".item-progress").css("opacity", 1);
        this.opts.itemsDesc.find(".item-description").css("opacity", 0);
      } else if (this.opts.type === "actors" || this.opts.type === "thematic") {
        const htmlContents = htmlActorsInfoLine(this.opts.data[index]);
        opts.itemsDesc.html(htmlContents);
        if (this.opts.type === "actors") {
          if (!this.opts.data[index].character || this.opts.data[index].character === null) {
            this.opts.data[index].character = "";
          }
          const personajeContainer =
            document.querySelectorAll(".info-personaje")[document.querySelectorAll(".info-personaje").length - 1];
          personajeContainer.innerHTML = this.opts.data[index].character;
        }

        remove_htmlInfoLine_hide_elements(opts.itemsDesc);
        this.opts.itemsDesc.find(".item-progress").css("opacity", 0);
        this.opts.itemsDesc.find(".item-description").css("opacity", 0);
      }
    }
  }

  startActivateItem(index, refreshing) {
    this.stopTimeouts();
    if (
      this.opts.extras_mode ||
      (this.opts.data[index] !== undefined && this.opts.data[index].shortcut && this.opts.data[index].shortcut?.empty)
    ) {
      BackgroundMng.instance.focus_background();
      return;
    }
    this.#startShowDescription(index, refreshing);
  }

  #startShowDescription(index, refreshing) {
    if (this.opts.data.length && this.opts.type != "thematic") {
      if (this.opts.type !== "nodes") {
        const $this = this;
        $this.opts.activateTimeout = setTimeout(() => {

          $this.opts.descriptionTimeout = setTimeout(() => {

          }, appConfig.MS_DESC_MOSTRAR);
        }, appConfig.MS_DESC_ESPERA);
      }
    }
  }

  stopTimeouts() {
    if (this.opts.activateTimeout) {
      clearTimeout(this.opts.activateTimeout);
      this.opts.activateTimeout = null;
    }
    if (this.opts.descriptionTimeout) {
      clearTimeout(this.opts.descriptionTimeout);
      this.opts.descriptionTimeout = null;
    }
    if (this.opts.activateChannelsInterval) {
      clearInterval(this.opts.activateChannelsInterval);
      this.opts.activateChannelsInterval = null;
    }
    if (this.opts.textosTimeout) {
      clearTimeout(this.opts.textosTimeout);
      this.opts.textosTimeout = null;
    }

    if (this.opts.type === "channels") {
      operationParentalChannelSlider(this, true);
    }
  }

  stopActivateItem(refreshing) {
    this.stopTimeouts();
    if (!refreshing && !this.opts.isMultiple) {
      AutocolapseMng.instance.autocolapse_stop();
    }
  }

  channelSliderUpdate() {
    if (this.opts.type === "channels") {
      operationParentalChannelSlider(this, true);
      if (this.opts.activateChannelsInterval) {
        clearInterval(this.opts.activateChannelsInterval);
        this.opts.activateChannelsInterval = null;
      }
    }
  }

  sel_item(pIndex = -1, pWithMove = undefined, withFocus = undefined, descendente = undefined) {
    const withMove = pWithMove === undefined ? true : pWithMove;
    this.opts.withFocus = withFocus === undefined ? true : withFocus;
    this.opts.descendente = descendente;

    // init index
    let index = pIndex;


    this.unfocus();

    if (withMove) {
      this.sel_item_move(index);
    }
  }

  /**
   * mover al item seleccionado
   * @param {Number} index
   * @param {Boolean} isActivation proviene de una activacion de slider en vez de movimiento lateral
   */
  sel_item_move(index, isActivation = undefined) {
    this.opts.isActivation = isActivation || false;
    this.stopActivateItem(this.opts.refreshing);

    if (!this.opts.refreshing) {
      this.move(index, false, this.opts.refreshing);
    } else {
      this.opts.firstMove = false;
      this.endMove(index, this.opts.refreshing);
    }
  }

  isActive() {
    //debug.alert('  name calle ' + this.opts.wrap.parent().find('h2').text());

    const parentClass = this.opts.wrap.parent().attr("class");
    if (parentClass.indexOf("active") >= 0) {
      return true;
    }
    return false;
  }

  async endMove(index, refreshing) {
    this.opts.itemIndex = index;
    await AutoplayMng.instance.contentChanged(`${this.opts.type}`);

    const { opts } = this;

    this.loadFanart();

    if (this.isActive()) {
      // Start description animation
      this.startActivateItem(index, refreshing);
    }

    // count
    let count = this.opts.itemIndex;
    if (!opts.has_enlace) {
      count++;
    }
    if (opts.count.current) opts.count.current.textContent = count;
    if (this.opts.isMultiple) {
      const [wrap] = this.opts.wrap;
      const [element] = wrap.querySelectorAll("span.current");
    }

    if (this.opts.type === "channels" && !this.opts.isSkeleton && ViewMng.instance.lastView?.type !== "player-view") {
      // Evaluamos su nivel moral
      const channel = this.opts.data[index];
      if (channel?.type !== "enlace") {
        const program = await this.getCurrentProgramEPG(channel);
      }
    }
    this.opts.isMoving = null;
    this.opts.events.emit("endMoveCarousel", index);
  }

  unfocus() {
    if (this.opts.elems[2]) {
      this.opts.elems[2].$item.removeClass("focused");
    }
  }

  getCurrentItem() {
    return this.opts.elems[2].$item;
  }

  loadFanart() {
    const item = this.opts.data[this.opts.itemIndex];
    if (this.opts.type === "channels") {
      this.#clearBackground(item);
    }
    this.#setBackground(item);
  }

  /**
   * @param {{type: string}} item
   */
  #clearBackground(item) {
    if (item.type === "enlace") {
      BackgroundMng.instance.load_bg_default(false);
      BackgroundMng.instance.show_full_background();
    } else if (!AppStore.yPlayerCommon.isPlaying()) {
      BackgroundMng.instance.set_bg_black();
    }
  }

  /**
   * @param {{DatosEditoriales: {Imagenes: {id: ?, uri: string}[]}}} item
   */
  #setBackground(item) {
    if (!this.opts.showFanart) {
      return;
    }

    let image = null;
    if (ViewMng.instance.lastView?.type === "slider") {
      if (this.opts.type === "nodes") {
        image = this.get_bg_image(this.opts.itemIndex);
      } else {
        image = getImage(item?.DatosEditoriales, "fanart");
      }
      if (image) {
        BackgroundMng.instance.load_bg_image(image, true);
      } else if (this.opts.type !== "channels") {
        BackgroundMng.instance.load_bg_default(true);
      }
    } else {
      BackgroundMng.instance.reload_fanart = true;
    }
  }

  get_bg_image(index) {
    if (!this.opts.showFanart) {
      return;
    }

    const optData = this.opts.data[index];
    if (isNil(optData)) {
      return;
    }
    if (optData.type == "enlace") {
      return getBackgroundEnlace(optData);
    } else if (this.opts.type === "channels" && !this.opts.isSkeleton) {
      return getImage(optData, "fanart");
    } else if (this.opts.type === "nodes") {
      return optData["@img_fanart"];
    } else {
      return getBackground(optData);
    }
  }

  get_id(index) {
    if (index == 0 && this.opts.has_enlace) return -1; // Enlace selected

    if (!this.opts.data || !this.opts.data[index]) return -1;

    if (this.opts.type === "channels") {
      return this.opts.data[index].CodCadenaTv;
    } else if (!this.opts.data[index].DatosEditoriales) {
      return index;
    }
    return this.opts.data[index].DatosEditoriales.Id;
  }

  getType() {
    return this.opts.type;
  }


  /*
   * get activated item index
   */
  get_index() {
    return this.opts.itemIndex;
  }

  /*
   * start slider
   */
  init(index, pWithMove = undefined, pWithFocus = undefined) {
    this.addSlidersItemsActive();
    const withMove = pWithMove === undefined ? true : pWithMove;
    const withFocus = pWithFocus === undefined ? true : pWithFocus;


    this.sel_item(index, withMove, withFocus);
    if (!this.opts.isMultiple) {
      this.opts.wrap.find(".slider-count").show();
      this.opts.wrap.find(".slider-count, .slider-count-multiple").removeClass("hideCount");
    } else {
      this.opts.wrap.find(".slider-count, .slider-count-multiple").addClass("hideCount");
    }
  }

  /*
   * destroy slider
   */
  destroy() {
    this.removeSlidersItemsActive();
    const [wrap] = this.opts.wrap;
    this.stopActivateItem(false);
    wrap.classList.remove("active");
    if (!this.opts.fromPlayer) {
      /** @type {HTMLElement} */
      const element = wrap.querySelector(".items-desc");
      element.style.transition = "none";
      element.classList.remove("active");
    }
    /** @type {HTMLElement} */
    const count = wrap.querySelector(".slider-count");
    if (count) count.style.display = "none";

    for (let i = 0; i < this.opts.elems.length; i++) {
      const [item] = this.opts.elems[i].$item;
      item.classList.remove("focused");
      item.style.transition = "none";
      item.classList.remove("active");
    }
  }
}
