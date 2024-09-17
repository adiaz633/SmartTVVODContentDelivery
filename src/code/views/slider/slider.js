"use strict";

import { appConfig } from "@appConfig";
import { Carousel } from "src/code/components/carousel/carousel";
import { CarouselMultiple } from "@newPath/components/carousel-multiple/carousel-multiple";
import { CarouselPromos } from "@newPath/components/carousel-promos/carousel-promos";
import { Menu } from "src/code/components/menu/menu";
import { Promo } from "@newPath/components/promo/promo";
import { promoAvailables, watchVod } from "@newPath/components/promo/promo-actions.js";
import { Tabs } from "src/code/components/tabs/tabs";
import { Temas } from "src/code/components/temas/temas";
import { KeyboardModalComponent } from "@newPath/components/users/keyboardModal";
import { Users } from "@newPath/components/users/users";
import { EventBus } from "src/code/js/alterbus";
import { Mutex } from "src/code/js/mutex";
import { TpaMng } from "@newPath/managers/3pa-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { ChannelsMng } from "@newPath/managers/channels-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { EnablersMng } from "@newPath/managers/enablers-mng";
import { EpMng } from "@newPath/managers/ep-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { MagicMng } from "@newPath/managers/magic-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { PromoMng } from "@newPath/managers/promo-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { viewTypeNames } from "src/code/managers/view-mng/view-type-names";
import { Main } from "@tvMain";
import { ykeys } from "@unirlib/scene/ykeys";
import { googleAnalytics } from "@unirlib/server/googleAnalytics";
import { debug } from "@unirlib/utils/debug";

import { SliderViewActivator } from "./slider-activator";
import { SliderKeys } from "./slider-keys";
import { getElementTotalHeight, getFirstSliderByType, getFirstSliderNotEmpty } from "./sliders-utils";

const _classes = [
  { name: "promo", class: Promo },
  { name: "menu", class: Menu },
  { name: "carousel", class: Carousel },
  { name: "carousel-promos", class: CarouselPromos },
  { name: "carousel-promos-vertical", class: CarouselPromos },
  { name: "carousel-promos-vertical-n", class: CarouselPromos },
  { name: "carrusel_multiple_horizontal", class: CarouselMultiple },
  { name: "carrusel_multiple_vertical", class: CarouselMultiple },
  { name: "temas", class: Temas },
  { name: "tabs", class: Tabs },
  { name: "users", class: Users },
];

const dividirArray = (arr, size) => {
  const resultado = [];
  for (let i = 0; i < arr.length; i += size) {
    const dividido = arr.slice(i, i + size);
    resultado.push(dividido);
  }
  return resultado;
};

let indiceIntervalo = 0;

const callesUserProfiles = [];

let maxCalleUserProfiles = 0;

const inicializarCalleUserProfiles = (opts) => {
  // Nos quedamos con cualquier elemento de avatar que no tenga state = 0
  opts.slidersData.map((avatar) => {
    avatar.data = avatar.data.filter((elem) => elem.state !== 0 || elem.id === 0);
  });

  opts.slidersData = opts.slidersData.filter((elem) => {
    return elem.data.length > 0;
  });
  const indiceParticion = Math.floor(opts.slidersData.length / 5);
  const dataSet = dividirArray(opts.slidersData, indiceParticion);

  dataSet.forEach((elemento, indice) => {
    let min = 0;
    let max = 0;
    if (indice === 0) {
      min = 0;
      max = elemento.length;
    } else {
      min = callesUserProfiles[indice - 1].max;
      max = min + elemento.length;
    }
    callesUserProfiles.push({ min, max });
  });
};

export class SliderView extends SliderKeys {
  /**
   *
   * @param {JQuery<HTMLElement> | HTMLElement} wrap Contenedor
   * @param {boolean} isHome true si es el home
   * @param {boolean} isUserProfiles true si es el user profiles
   * @param {boolean} showFanart true si se debe mostrar fanart en background
   */
  constructor(wrap, isHome, isUserProfiles, showFanart = true) {
    super(wrap);
    this.type = viewTypeNames.SLIDER_VIEW;
    this.opts = {
      wrap,
      isHome,
      isUserProfiles,
      showFanart,
      title: "",
      migas: "",
      slidersWrap: null,
      slidersData: [],
      orig_data: [],
      tpl: {
        // template
        item: String.raw`
          <div class="slider-item ##type##" data-item-index="##id##">
            <h2 class="slider-title">##title##</h2>
            <div class="slider-wrap no-display" data-slider="##type##">
              <div class="slider-count"><span class="current">0</span>de<span class="total">0</span></div>
            </div>
          </div>
        `,
      },

      // status variables
      activeElem: null,
      activeSlider: 0, // start slider in first time
      /** @type {import("../../components/carousel/carousel").Carousel[]} */
      sliders: [], // slider object
      activeSliderItem: [], // active item index in each sliders
      loading_more: false,
      n_loads: 0,
      min_i: 0,
      max_i: 0,
      refreshing: false,
      elems: {}, // jquery cache selectors,
      skeletonTimeout: null,
      _is_expanded_view_mode: false,
      pin: false,
      prevComponent: null,
      activeComponent: null,
      oginalActiveComponent: null,
      canUseDial: true,
      backFromPlayer: false,
      checkEnablers: false,
    };

    /** @private */
    this._mutex = new Mutex();

    this.opts.eventBus = new EventBus(this);

    const self = this;

    AppStore.channelsMng.on("CHANNEL_LIST_CHANGED", async () => {
      this.refresh_channels();
    });

    this.opts.eventBus.on("keyboard-emit", (parent, valor) => {
      self.opts.canUseDial = true;
      self.hideKeyboardModal();
      if (valor === "pinblocked") {
        self.activeComponent = self.opts.originalActiveComponent;
        ViewMng.instance.showPopup("crear_pin_blocked");
      } else {
        const activeSlider = self._getActiveSlider();
        const itemData = activeSlider.opts.data[activeSlider.opts.itemIndex];

        BackgroundMng.instance.hide_bg_image();
        self.opts.sliders[0].animate_stop();
        AppStore.home.sliders_new(itemData);
        if (!activeSlider.opts.isSkeleton) {
          self.removeClass("active");
        }
      }
    });

    if (isHome) {
      // Si se viene de una navegacion de ir a hom
      // apuntar a la lupa
      ViewMng.instance.on("navigate", (to) => {
        if (to === "HomeScene") {
          this._gotoHomeSliderItem();
        }
      });
    }

    ViewMng.instance.on("transition", (from, to) => {
      // registrar vuelta desde player
      if (to === this && from?.type === viewTypeNames.PLAYER_VIEW) {
        this.opts.backFromPlayer = true;
      } else this.opts.backFromPlayer = false;
    });

    /** @private */
    this._activator = new SliderViewActivator(this);

    /** @private @constant */
    this.SLIDER_COLLAPSE = {
      series: { moveTop: 210, colapsedClass: "colapsed-series" }, //105 , de 165 a 146
      nodes: { moveTop: 259, colapsedClass: "colapsed-series" }, //105 , de 165 a 146
      movies: { moveTop: 171, colapsedClass: "colapsed-movies" }, //42, tal cual
      channels: { moveTop: 232, colapsedClass: "colapsed-channels" }, //168, 218 tal cual, se vuelve en ticket 16849 a 168
      carrusel_multiple_horizontal: { moveTop: 144, colapsedClass: "colapsed-promos" }, //105, de 119 a 144
      carrusel_multiple_vertical: { moveTop: 144, colapsedClass: "colapsed-promos" }, //105, de 119 a 144
      "carousel-promos": { moveTop: 195, colapsedClass: "colapsed-promos" }, //105, de 119 a 131
      "carousel-promos-vertical": { moveTop: 195, colapsedClass: "colapsed-promos" }, //105, de 119 a 131
    };
  }

  get canBeDestroyed() {
    return !this.opts.isHome;
  }

  get isHome() {
    return this.opts.isHome;
  }

  /**
   * Devuelve true si el slider actual es el primero no vacio
   * de la lista
   */
  get isFirstSlide() {
    const firstSliderIndex = this.get_first_non_empty_slider_index();
    const currentSliderIndex = this.opts.activeSlider;
    return firstSliderIndex === currentSliderIndex;
  }

  async init(activeElem) {
    this.opts.sliders = [];
    this.opts.activeSliderItem = [];
    this.opts.slidersData = [];
    this.opts.orig_data = [];
    this.opts.elems = {};
    this.opts.activeElem = activeElem;

    if (this.opts.isHome) this.opts.activeSlider = 1;
    else this.opts.activeSlider = 0;

    this.opts.title = activeElem.nombre ? activeElem.nombre : activeElem.title;
    this.opts.subtitle = activeElem.subtitle ? activeElem.subtitle : "";
    this.opts.migas = activeElem.migas;
    this.opts.pin = activeElem.pin;

    for (let i = 0; i < activeElem.data.length; i++) {
      if (!activeElem.data[i] || Object.keys(activeElem.data[i]).length === 0) {
        continue;
      }
      // Guardamos propiedad showFanart para cada carousel para controlar el background.
      activeElem.data[i].showFanart = this.opts.showFanart;
      // Habilitados por defecto en inicio
      activeElem.data[i].isEnabled = true;
      // Hacemos copia en caso de promo
      if (
        activeElem.data[i].type === "promo" ||
        activeElem.data[i].type === "carousel-promos" ||
        activeElem.data[i].type === "carousel-promos-vertical" ||
        activeElem.data[i].type === "carousel-promos-vertical-n" ||
        activeElem.data[i].type === "nodes"
      ) {
        const copyJson = JSON.parse(JSON.stringify(activeElem.data[i]));
        copyJson.data = await promoAvailables(copyJson.data);
        this.opts.slidersData.push(copyJson);
      } else {
        this.opts.slidersData.push(activeElem.data[i]);
      }
      this.opts.orig_data.push(activeElem.data[i]);
    }

    googleAnalytics.setVODSection(activeElem.m, activeElem.p);
    AppStore.tfnAnalytics.setVODSection(activeElem.m, activeElem.p);

    if (this.opts.isUserProfiles) {
      inicializarCalleUserProfiles(this.opts);
    }
    this.start_view();

    this.opts.wrap.addClass("active");
  }

  async refreshEnablers() {
    const { slidersData, sliders } = this.opts;
    for (let i = 0; i < slidersData.length; i++) {
      if (slidersData[i].type === "menu") {
        sliders[i].checkEnabledItems();
      }
      const enabled = await EnablersMng.instance.getEnablerIsAvailable(slidersData[i].habilitador);
      if (!enabled) {
        this.removeSlider(i);
      } else if (enabled && sliders[i].opts?.data?.length) {
        this.addSlider(i);
      }
      slidersData[i].isEnabled = enabled;
    }
  }

  getSectionRef() {
    let sectionRef = null;
    if (this.opts?.activeElem && this.opts?.activeElem?.p?.toUpperCase() === "SECCION" && this.opts?.activeElem?.m) {
      sectionRef = this.opts.activeElem?.m.toUpperCase();
    }
    return sectionRef;
  }

  restartTimeoutHide() {
    const carousel = this.opts.sliders[this.opts.activeSlider];
    if (carousel && carousel instanceof Carousel) {
      carousel.channelSliderUpdate();
    }
  }

  /**
   *
   */
  startBillboard() {
    if (!this.isHome) {
      return;
    }
    if (this.opts.activeSlider == 1) {
      // TODO: Mover esto al componente en particular
      // console.warn(`slider._startBillboard: Start Billboard`);
      const menuActive = document.querySelectorAll(".slider-item.menu")[0];
      menuActive?.classList.add("active");
      this.opts.sliders[0]?.animate_start();
    } else {
      this.opts.sliders[0]?.animate_stop();
    }
  }

  stopBillboard() {
    // Stop promos if animated
    if (this.opts.sliders && this.opts.sliders.length > 0) {
      this.opts.sliders[0]?.animate_stop();
    }
  }

  get_title() {
    const { title } = this.opts;
    return title;
  }

  /*
   * Start slider view
   */
  start_view() {
    const $this = this;
    const { opts } = $this;
    const { wrap } = opts;

    // Remove container
    const $sliderItems = wrap.find(".slider-items").remove();
    for (let i = 0; i < $sliderItems.length; i++) {
      $sliderItems.eq(i).remove();
    }

    // click item
    if (Main.isEmulator()) {
      wrap.on("click", ".slider-item .item", function (e) {
        if (!AppStore.appStaticInfo.isAndroidTV()) {
          e.preventDefault();

          const item = $(this);
          const itemIndex = Number(item.attr("data-item-index"));
          const slider = item.parents(".slider-item");
          const sliderIndex = slider.index();

          let changeSlider = false;
          if (!slider.hasClass("active")) {
            changeSlider = true;
            $this.active_slider(sliderIndex);
          }

          if (!item.hasClass("active")) {
            $this.opts.sliders[sliderIndex].sel_item(itemIndex);
          } else {
            if (!changeSlider) {
              KeyMng.instance.runKeyAction(ykeys.VK_ENTER, true); // Enter
            }
          }
        }
      });
    }
    this.bind_header();

    this.opts.slidersWrap = jQuery("<div>").appendTo(this.opts.wrap).addClass("slider-items");

    if (this.opts.isUserProfiles) {
      this.opts.slidersWrapContentUsers = jQuery("<div>")
        .appendTo(this.opts.slidersWrap)
        .addClass("slider-items-content");
      this.opts.elems[".slider-items-content"] = this.opts.wrap.find(".slider-items-content");
      this.opts.elems[".slider-items"] = this.opts.wrap.find(".slider-items");
      this.load_users();
    } else {
      this.opts.elems[".slider-items"] = this.opts.wrap.find(".slider-items");
      this.skeletonInitial();
    }
  }

  /*
   * Bind Header
   * TODO: Sacar a un archivo de componentes
   */
  bind_header() {
    let tpl_header = "";
    if (this.opts.isHome) {
      tpl_header =
        '\
				<div class="main-header header-main">\
				<div class="left-area">\
				</div>\
					<div class="right-area">\
						<div class="current-time">##date##</div>\
            <div class="main-logo"><img src="##logo##" alt="Logo"></div>\
					</div>\
				</div>\
				';

      this.opts.wrap.find(".main-header").remove();
    } else {
      if (!this.opts.isUserProfiles) {
        tpl_header = `
        <div class="app-header">
          <div class="header-title">
            <span class="title">##title##</span>
          </div>
          <div class="header-info">
            <div class="current-time">##date##</div>
            <div class="logo-min"><img src="##logo##"></div>
          </div>
        </div>
        `;
        this.remove_header();
      } else {
        tpl_header = `
        <div class="app-header">
          <div class="header-title">
            <p class="title">##title##</p>
            <p class="txt2">##subtitle##</p>
          </div>
        </div>
        `;
        this.remove_header();
      }
    }

    const title = AppStore.home.get_migas() + this.get_title();

    const dateObj = new Date();
    let logo = "./images/new/Home.png";
    if (!AppStore.login.isAnonimousUser()) {
      if (AppStore.login.getProfile() === "NODTH") logo = "./images/new/tfgunir-logo-1P.png";
    }

    if (!this.opts.isHome && !this.opts.isUserProfiles) {
      logo = "./images/new/tfgunir_logo_ficha.png";

      googleAnalytics.gaTrack("VODScene");
    }

    if (!this.opts.isUserProfiles) {
      tpl_header = tpl_header
        .replace(/##title##/g, title)
        .replace(/##logo##/g, logo)
        .replace(/##date##/g, dateObj.format_date("D n h:i").toLowerCase());
    } else {
      tpl_header = tpl_header.replace(/##title##/g, this.opts.title);
      tpl_header = tpl_header.replace(/##subtitle##/g, this.opts.subtitle);
    }

    jQuery(tpl_header).appendTo(this.opts.wrap);
  }

  /**
   * Elimina el elemento con id "app-header" de la SliderView
   */
  remove_header() {
    this.opts.wrap.find(".app-header").remove();
  }

  isSliderViewPlayer() {
    const homewrap = document.getElementById("homewrap");
    const playerSliders = homewrap.querySelector("#slider-view-player");
    return playerSliders;
  }

  /**
   * Elimina del DOM y del ViewMng la vista de slider-view-player si existe
   */
  async checkPlayerSliders() {
    const playerSliders = this.isSliderViewPlayer();
    if (playerSliders) {
      const isPipActive = PlayMng.instance.playerView.isPipActive();
      const closedByTimer = PlayMng.instance.playerView.opts.sugerenciasClosedByTimer;
      const backToPlayer = KeyMng.instance.lastKeyCode === ykeys.VK_BACK || closedByTimer;
      // Si hay PiP activo y no estamos ocultando los sliders para volver al player, paramos PiP
      if (isPipActive && !backToPlayer) await PlayMng.instance.playerView.setPipStandby();
      await ViewMng.instance.popFirstByType(viewTypeNames.SLIDER_VIEW);
      playerSliders.remove();
    }
  }

  load_users() {
    const { min } = callesUserProfiles[indiceIntervalo];
    const { max } = callesUserProfiles[indiceIntervalo];
    maxCalleUserProfiles = max;
    const activeSlider = min === 0 ? 0 : min - 1;
    this.append_users(min, max);
    this.active_slider(activeSlider);
    this.opts.loading_more = false;

    debug.alert(`END load page. N sliders = ${this.opts.sliders.length}`);

    LoaderMng.instance.hide_loader();
  }

  findIndex(id) {
    const s = this.opts.activeSlider;
    for (let i = 0; i < this.opts.sliders[s].opts.data.length; i++) {
      const item = this.opts.sliders[s].opts.data[i];
      if (item && item.type != "enlace") {
        if (id == this.opts.sliders[s].get_id(i)) {
          return i;
        }
      }
    }
    return -1;
  }

  refresh_channels() {
    const { slidersData } = this.opts;
    const indexSlider = slidersData.findIndex((data) => data.type === "channels");
    //const itemIndex = carousel.opts.itemIndex;
    //const channel = carousel.opts.data[itemIndex];
    if (indexSlider != -1) {
      const carousel = this.opts.sliders[indexSlider];
      const wasEmpty = carousel.opts.isEmpty;
      this.moveFirstTime(indexSlider);
      this.setChannelsUV(indexSlider);
      const { itemIndex } = carousel.opts;
      carousel.refresh({ data: this.opts.slidersData[indexSlider].data, index: itemIndex });
      carousel.refresh_end();
      carousel.opts.isSkeleton = false;
      this.refreshImages(indexSlider);
      if (wasEmpty) {
        this.addSlider(indexSlider);
      }
    }
  }

  setChannelsUV(i, orig_type) {
    try {
      this.opts.slidersData[i].type = "channels";
      this.opts.slidersData[i].orig_type = orig_type;
      const channelsUV = ChannelsMng.instance.getLastChannelsUV(orig_type);
      if (channelsUV.length) {
        this.opts.slidersData[i].data = channelsUV;
        if (this.opts.slidersData[i].enlace?.type == "enlace") {
          this.opts.slidersData[i].data.unshift(this.opts.slidersData[i].enlace);
        }
      } else {
        this.opts.slidersData[i].data = [];
        this.removeSlider(i);
      }
    } catch (e) {
      this.opts.slidersData[i].data = [];
      debug.alert(`setChannelsUV error !!!: ${e.toString()}`);
    }
  }

  setChannels(i) {
    try {
      this.opts.slidersData[i].type = "channels";
      const n_MaxChannels = ChannelsMng.instance.getNumMaxChannels();
      let channels = this.opts.slidersData[i].data;
      if (channels.length > n_MaxChannels) {
        channels = channels.slice(0, n_MaxChannels);
      }
      const enlace = [];
      if (this.opts.slidersData[i].data[0].type === "enlace") enlace.push(this.opts.slidersData[i].data[0]);
      const channelsDvbipi = ChannelsMng.instance.setChannels(channels);
      if (channelsDvbipi.length) {
        this.opts.slidersData[i].data = [...enlace, ...channelsDvbipi];
      } else {
        this.opts.slidersData[i].data = [];
        this.setVisible(i, false);
        this.removeSlider(i);
      }
    } catch (e) {
      this.opts.slidersData[i].data = [];
      debug.alert(`setChannels error !!!: ${e.toString()}`);
    }
  }

  create_carousel(index, type, title) {
    for (let c = 0; c < _classes.length; c++) {
      const name_element = "name";
      const class_element = "class";
      const classType = type == "nodes" ? "carousel" : type;

      if (_classes[c][name_element] === classType) {
        const wrap = this.opts.sliders[index].opts.wrap;
        wrap.empty();
        wrap.prevObject.addClass(type);
        wrap.attr({ "data-slider": type });
        if (type == "nodes") {
          wrap.prevObject.prepend(`<h2 class="slider-title">${title}</h2>`);
        }
        this.opts.sliders[index] = new _classes[c][class_element](this.opts.slidersData[index]);
        break;
      }
    }
  }

  /*
   * Add new sliders to scene
   */
  append_users(min_i, max_i) {
    const { opts } = this;
    const slidersWrap = this.opts.slidersWrapContentUsers;

    let index = min_i;
    let i;
    for (i = min_i; i < max_i; i++) {
      let nitems = 0;
      if (opts.slidersData[i] && opts.slidersData[i].data && opts.slidersData[i].data.length > 0) {
        nitems = opts.slidersData[i].data.length;
      }

      let empty = false;
      if (
        nitems === 0 ||
        (nitems === 1 && opts.slidersData[i].data[0].type === "enlace") ||
        !$.isArray(opts.slidersData[i].data)
      ) {
        empty = true;
      }

      if (!empty) {
        // Check max size
        if (
          this.opts.slidersData[i].type === "series" ||
          this.opts.slidersData[i].type === "movies" ||
          this.opts.slidersData[i].type === "nodes"
        ) {
          // Check min to remove enlace
          if (opts.slidersData[i].enlace && opts.slidersData[i].enlace["@min"]) {
            const amin = Number(opts.slidersData[i].enlace["@min"]);
            if (amin > 1 && opts.slidersData[i].totalCount <= amin) {
              opts.slidersData[i].enlace = null;
            }
          }

          let nMaxItems = appConfig.N_MAX_CARRUSEL;
          if (opts.slidersData[i].enlace) {
            nMaxItems++;
          }

          if (nitems > nMaxItems) {
            this.opts.slidersData[i].data = this.opts.slidersData[i].data.slice(0, nMaxItems);
          }
        }

        // check carrusel_canales_orden_uv storage
        this.opts.slidersData[i].orig_type = this.opts.slidersData[i].type;
        switch (this.opts.slidersData[i].type) {
          case "carrusel_canales_orden_uv":
          case "carrusel_canales_orden_mv":
            this.setChannelsUV(i, this.opts.slidersData[i].type);
            break;
          case "channels":
            this.setChannels(i);
            break;
        }

        const $slider = jQuery(
          opts.tpl.item
            .replace(/##type##/g, opts.slidersData[i].type)
            .replace(/##id##/g, index)
            .replace(/##title##/g, opts.slidersData[i].title)
            .replace(/no-display/g, "")
        ).appendTo(slidersWrap);

        if (!opts.slidersData[i].title) {
          if (opts.slidersData[i].type === "menu") $slider.find(".slider-title").remove();
          else $slider.find(".slider-title").empty();
        }
        if (opts.slidersData[i].type === "promo") {
          $slider.find(".slider-title").remove();
          $slider.find(".slider-count").remove();
        } else if (opts.isUserProfiles) {
          $slider.find(".slider-count").remove();
        }

        // Add first item called enlace
        if (opts.slidersData[i].enlace && opts.slidersData[i].data[0].type !== "enlace") {
          opts.slidersData[i].data.splice(0, 0, opts.slidersData[i].enlace);
        }

        opts.slidersData[i].wrap = $slider.find("[data-slider]");
        let carouselType = this.opts.slidersData[i].type;
        if (
          carouselType === "series" ||
          carouselType === "movies" ||
          carouselType === "channels" ||
          carouselType === "actors" ||
          carouselType === "services" ||
          carouselType === "thematic" ||
          carouselType === "nodes"
        ) {
          carouselType = "carousel";
        }
        for (let c = 0; c < _classes.length; c++) {
          const name_element = "name";
          const class_element = "class";
          if (_classes[c][name_element] === carouselType) {
            opts.sliders[i] = new _classes[c][class_element](opts.slidersData[i]);
            break;
          }
        }

        opts.activeSliderItem[i] = 0;

        index++;
        this.opts.slidersData[i].mark_to_delete = false;
      } else {
        // Mark to delete
        this.opts.slidersData[i].mark_to_delete = true;
      }
    }

    // clean empty sliders
    for (i = this.opts.slidersData.length - 1; i >= 0; i--) {
      if (this.opts.slidersData[i].mark_to_delete) {
        this.opts.slidersData.splice(i, 1);
        this.opts.sliders.splice(i, 1);
        this.opts.activeSliderItem.splice(i, 1);
      }
    }

    this.opts.elems[".slider-item"] = this.opts.wrap.find(".slider-item");
    this.opts.elems[".slider-items"] = this.opts.wrap.find(".slider-items");
  }

  /**
   * Devuelve la posicion del slider que debe activarse
   * @param {Number} sliderIndex indice del slider activo
   * @returns {Number} posicion
   */
  getActiveSliderItemPosition(sliderIndex) {
    const slider = this.opts.sliders[sliderIndex];
    let itemPosition = this.opts.activeSliderItem[sliderIndex];

    if (this.opts.backFromPlayer && slider instanceof Carousel && slider.opts.type === "channels") {
      // encuentra posicion del canal en el carrusel de canales al volver de player
      const lastPlayedChannel = PlayMng.instance.safeLastPlayedChannel;
      if (lastPlayedChannel) {
        const channelPostion = slider.getChannelItemIndex(lastPlayedChannel.channelId);
        if (channelPostion > -1) {
          itemPosition = channelPostion;
        }
      }
    }

    return itemPosition;
  }

  changeSpeedTranslate() {
    let newTransition = "";
    let seconds = 0.6;
    if (KeyMng.instance.kdPressingFast()) {
      // + speed
      seconds = appConfig.MS_MOVE_VERTICAL_RAPIDO / 1000;
    } else {
      // - speed
      seconds = appConfig.MS_MOVE_VERTICAL / 1000;
    }

    newTransition = `transform ${seconds}s ease-out`;
    //console.log('changeSpeedTranslate: ' + newTransition);
    let $sliderElemWrap;
    if (this.opts.isUserProfiles) {
      $sliderElemWrap = this.opts.elems[".slider-items-content"];
    } else {
      $sliderElemWrap = this.opts.elems[".slider-items"];
    }
    $sliderElemWrap[0].style.transition = newTransition;
  }

  /**
   * activa carrusel del slider
   * @param {Number} $sliderIndex indice del carrusel a activar
   */
  async activate_element($sliderIndex) {
    const $sliders = this.opts.sliders;
    let $sliderElemWrap;
    if (this.opts.isUserProfiles) {
      $sliderElemWrap = this.opts.elems[".slider-items-content"];
    } else {
      $sliderElemWrap = this.opts.elems[".slider-items"];
    }
    this.changeSpeedTranslate();

    const $sliderElem = this.opts.elems[".slider-item"];
    //const $activeSliderItem = this.opts.activeSliderItem;
    let currentMoveTop = 0;

    let moveTop = this.opts.isUserProfiles ? 0 : 0;

    if (this.opts.isHome && $sliders[0] instanceof Promo && $sliderIndex <= 1) {
      if ($sliderIndex === 0) {
        moveTop = 139;
      }
      if ($sliderIndex === 1) {
        moveTop = 237;
      }
    } else {
      for (let i = 0; i < $sliderIndex; i++) {
        if (i === 0 && $sliders[i] instanceof Promo) {
          moveTop += 237;
        } else {
          if (!$sliders[i].opts.isEmpty) {
            const element = $sliderElem.get(i);
            const addTop = getElementTotalHeight(element);
            if ($sliders[i] instanceof Menu) {
              moveTop += addTop + 39;
            } else {
              moveTop += addTop;
            }
          }
        }
      }
      if (
        $sliders[$sliderIndex] instanceof CarouselPromos &&
        ($sliders[$sliderIndex].opts.type === "carousel-promos-vertical" ||
          $sliders[$sliderIndex].opts.type === "carousel-promos-vertical-n")
      ) {
        moveTop += 288;
      }
    }

    if (moveTop !== 0) {
      KeyMng.instance.kdStartAnimation();
    }

    function transitionCallback() {
      $sliders[$sliderIndex].sel_item_move(
        this.getActiveSliderItemPosition($sliderIndex),
        this.opts.activeSlider === $sliderIndex
      );
      const transitionTime = this.opts.sliders[this.opts.activeSlider] instanceof Users ? 5 : 50;
      setTimeout(() => {
        KeyMng.instance.kdEndAnimation();
      }, transitionTime);
    }

    await this.verticalTranslateSlider($sliderElemWrap[0], -moveTop, false, transitionCallback.bind(this));

    currentMoveTop = this.getSlidersVerticalDisplacement();
    //avoid adding an additional movement if moved already
    this.unset_expanded_view_mode(currentMoveTop + moveTop === 0);
  }

  /**
   * desplaza verticalmente la vista de slider
   * @param {HTMLElement} slider slider objetivo
   * @param {Number} translateHeight altura en pixels
   * @param {Function} callback
   * @returns {Promise}
   */
  async verticalTranslateSlider(slider, translateHeight, additiveMode, callback) {
    const marginTimeMs = 50;
    let setHeight = 0;
    let resolved = false;
    let transitionTimeout = null;
    let unlock = null;
    function transitionHandler(event) {
      if (!resolved && event?.propertyName === "transform") {
        if (transitionTimeout) {
          clearTimeout(transitionTimeout);
          transitionTimeout = null;
        }
        if (event?.type === "transitionend") {
          slider.removeEventListener("transitionend", transitionHandler);
          resolved = true;
          if (callback) callback(translateHeight);
          if (unlock) unlock();
          return;
        }
      }
    }
    setHeight = this.getSlidersVerticalDisplacement();
    if (setHeight === translateHeight) {
      if (callback) callback(translateHeight);
      return null;
    } else {
      console.warn("verticalTranslateSlider", additiveMode, setHeight, translateHeight);
      slider.style.transform = `translate3d(0px, ${
        additiveMode ? setHeight + translateHeight : translateHeight
      }px, 0px)`;
      unlock = await this._mutex.acquire();
      try {
        slider.addEventListener("transitionend", transitionHandler);
        const transitionDuration = parseFloat(window.getComputedStyle(slider).transitionDuration) * 1000;
        if (transitionDuration > 0) {
          transitionTimeout = setTimeout(() => {
            if (!resolved) {
              slider.removeEventListener("transitionend", transitionHandler);
              resolved = true;
              if (callback) callback(translateHeight);
              if (unlock) unlock();
              return;
            }
          }, transitionDuration + marginTimeMs);
        }
      } catch {
        if (unlock) unlock();
      }
    }
  }

  /**
   * Acciones antes de pasar al anterior slider
   */
  beforePrevSlider() {
    const $activeSlider = this.opts.activeSlider,
      $sliders = this.opts.sliders;
    let prevSlider = null;

    for (let i = this.opts.activeSlider - 1; i >= 0; i--) {
      if (!$sliders[i].opts.isEmpty) {
        prevSlider = $sliders[i];
        break;
      }
    }

    if ($sliders[$activeSlider] instanceof Carousel && $sliders[$activeSlider].opts.hideTitle) {
      $sliders[$activeSlider].hideTitle();
    }

    if ($sliders[$activeSlider] instanceof CarouselMultiple) {
      $sliders[$activeSlider].cachedDataUpdate(false);
    }

    if ($sliders[$activeSlider - 1] instanceof Promo) {
      this.opts.sliders[$activeSlider - 1].focusOnButton();
    }

    if (prevSlider && prevSlider instanceof CarouselMultiple) {
      prevSlider.cachedDataUpdate(true);
    }
  }

  /**
   * Get index of previous non empty slider
   * @returns {Number} index
   */
  prevSliderIndex() {
    const $sliders = this.opts.sliders,
      $activeSlider = this.opts.activeSlider;
    let result = $activeSlider - 1;

    while (result > 0 && $sliders[result].opts.isEmpty) {
      // Check if marked to show
      if (this.opts.slidersData[result].mark_to_show) {
        debug.alert("slider mark_to_show");
        this.opts.slidersData[result].mark_to_show = false;
        this.show(result);
      } else {
        result--;
      }
    }

    if (result === 0 && $sliders[result].opts.isEmpty) {
      return -1;
    }

    return result;
  }

  /**
   * Acciones antes de pasar al siguiente slider
   */
  beforeNextSlider() {
    const $sliders = this.opts.sliders,
      $activeSlider = this.opts.activeSlider;
    let nextSlider = null;

    for (let i = $activeSlider + 1; i <= $sliders.length - 1; i++) {
      if (!$sliders[i].opts.isEmpty || !$sliders[i].opts.data.length) {
        nextSlider = $sliders[i];
        break;
      }
    }

    if ($sliders[$activeSlider] instanceof CarouselMultiple) {
      $sliders[$activeSlider].cachedDataUpdate(false);
    }

    //Borramos Posible autoplay Billboard
    if ($sliders[$activeSlider] instanceof Promo) {
      $sliders[$activeSlider].stopTimeoutAutoplay();
      $sliders[$activeSlider].focusOnButton(false);
    }

    if (nextSlider && nextSlider instanceof CarouselMultiple) {
      nextSlider.cachedDataUpdate(true);
      nextSlider.checkJump();
    }
  }

  /**
   * Get index of next non empty slider
   * @returns {Number} index
   */
  nextSliderIndex() {
    const $sliders = this.opts.sliders,
      $activeSlider = this.opts.activeSlider;
    let result = $activeSlider + 1;

    if ($activeSlider === $sliders.length - 1) {
      return -1;
    }
    while (result < $sliders.length - 1 && $sliders[result].opts.isEmpty) {
      result++;
    }
    if (result === $sliders.length - 1 && $sliders[result].opts.isEmpty) {
      return -1;
    }
    return result;
  }

  /**
   * @private
   */
  _onActivateSliderInHome(newSliderIndex) {
    if (this.opts.isHome) {
      const homeSliderElem = AppStore.home.getHomeSliderElem();

      homeSliderElem.removeClass("focus-bg");
      const { promoIndex, promo, refreshFanArt } = PromoMng;
      switch (newSliderIndex) {
        case promoIndex:
          refreshFanArt();
          MagicMng.instance.hide_magic_up();
          homeSliderElem.addClass("focus-bg");
          break;

        case promoIndex + 1:
          refreshFanArt();
          promo?.animate_start();
          break;

        default:
          promo?.animate_stop();
          break;
      }
    }
  }

  /*
   * Active slider
   */
  async active_slider($sliderIndex, _start) {
    let wasActive = false;

    if (this.opts.activeSlider === $sliderIndex) {
      wasActive = true;
    }

    const $this = this;
    const $sliders = this.opts.sliders;
    const $activeSlider = this.opts.activeSlider;
    const $activeSliderItem = this.opts.activeSliderItem;
    const $sliderElem = this.opts.elems[".slider-item"];

    if ($sliderIndex > -1 && $sliderIndex < $sliders.length) {
      if (this.opts.slidersData[$sliderIndex].mark_to_hide) {
        debug.alert("slider mark_to_hide");
        this.opts.slidersData[$sliderIndex].mark_to_hide = false;
        this.hide($sliderIndex);
        $sliderIndex--;
      }

      const preIndex = $activeSliderItem[$activeSlider];
      $activeSliderItem[$activeSlider] = $sliders[$activeSlider] ? $sliders[$activeSlider].get_index() : -1;
      $activeSliderItem[$activeSlider] =
        $activeSliderItem[$activeSlider] > -1 ? $activeSliderItem[$activeSlider] : preIndex;

      // destroy active and autoplay stop
      if ($activeSlider < $sliders.length) {
        $sliders[$activeSlider].destroy(wasActive);
        $sliderElem[$activeSlider].classList.remove("active");
      }

      // debug.alert('init slider ' + $sliderIndex + ' ' + $activeSliderItem[$sliderIndex]);
      $sliderElem[$sliderIndex].classList.add("active");
      if (_start === "backAutoplayPromo") {
        return;
      } else {
        AutoplayMng.instance.autoplay_stop(true);
      }

      $sliders[$sliderIndex].init($activeSliderItem[$sliderIndex], false);
      await this.activate_element($sliderIndex);

      // show counter active slider
      /*if ($activeSlider < $sliders.length) {
        $sliderElem.eq($activeSlider).find(".slider-count").hide();
      }
      if ($sliders[$sliderIndex].opts.isSkeleton) {
        $sliderElem.eq($sliderIndex).find(".slider-count").hide();
      } else {
        $sliderElem.eq($sliderIndex).find(".slider-count").show();
      }*/

      // reset activated slider index
      this.opts.activeSlider = $sliderIndex;
      this.checkVisibility();

      // Base class
      const { type } = this.opts.slidersData[$sliderIndex];
      if (type === "promo" || type === "menu") {
        this.opts.wrap.removeClass("base");
      } else {
        this.opts.wrap.addClass("base");
      }

      if (type === "channels") {
        AutoplayMng.instance.setPromo(true);
        AutoplayMng.instance.autoplay_stop(true);
      }

      this._onActivateSliderInHome($sliderIndex);

      MagicMng.instance.check_magic(this.isLastRow(), this.isFirstRow());
      if (
        this.opts.sliders[$sliderIndex].opts.type === "menu" &&
        this.opts.sliders[$sliderIndex + 1].opts.type === "channels"
      ) {
        this.opts.sliders[$sliderIndex + 1].opts.wrap[0].parentNode.querySelector(".slider-title").style.display =
          "block";
      }

      if (!this.opts.isUserProfiles) {
        if (this.opts.skeletonTimeout) {
          clearTimeout(this.opts.skeletonTimeout);
          this.opts.skeletonTimeout = null;
        }

        this.opts.skeletonTimeout = setTimeout(() => {
          $this.checkSkeleton();
        }, 800);
      } else {
        // En los sliders de usuarios comprobamos si llegamos al final del intervalo
        if ($sliderIndex === maxCalleUserProfiles - 1 && indiceIntervalo < callesUserProfiles.length - 1) {
          indiceIntervalo += 1;
          this.load_users();
        }
      }
    } else {
      AppStore.home.play_sound_end();
    }

    if (!_start) {
      this.startBillboard();
    }

    if (Array.isArray(this.opts.slidersData) && this.opts.slidersData.length) {
      const nextPosition = 1;
      const nextPositionMenu = this.opts.slidersData.findIndex((data) => data.type === "menu") + nextPosition;
      const channelsPosition = this.opts.slidersData.findIndex((data) => data.type === "channels");
      if (channelsPosition !== $sliderIndex && nextPositionMenu === channelsPosition) {
        this.opts.sliders[channelsPosition]?.hideTitle();
      }
    }
    return;
  }

  get_first_non_empty_slider_index() {
    //  TODO: se deberia tener un sliders HOME y otro sliders para separar los
    //  TODO: comportamientos de las vistas de mejor manera
    if (this.opts.isHome) {
      return getFirstSliderByType(this.opts.slidersData, "menu");
    }
    return getFirstSliderNotEmpty(this.opts.slidersData);
  }

  checkVisibility() {
    const $sliderElem = this.opts.elems[".slider-item"];
    const $sliderIndex = this.opts.activeSlider;

    // For initial sliders show one extra slider
    let extraNoHide = 0;
    if ($sliderIndex < 2 || AppStore.home.getUserProfilesWrap()) extraNoHide = 1;

    // Hide above
    let nEmpty = 0;
    let overlay = false;
    for (let i = 0; i < $sliderElem.length; i++) {
      if (i >= $sliderIndex && i <= $sliderIndex + 1 + extraNoHide + nEmpty) {
        if (this.opts.sliders[i].opts.isEmpty) {
          nEmpty++;
          this.hide(i);
        } else {
          overlay = i !== $sliderIndex;

          // No overlay del menu ni debajo del menu
          if (this.opts.isHome && (i === 1 || (this.opts.activeSlider === 1 && i === 2 + nEmpty))) {
            overlay = false;
          }

          this.setVisible(i, true, overlay);
          if (this.opts.sliders[i].opts.firstTime && this.opts.slidersData[i].type === "promo") {
            //this.opts.sliders[i].init();
            this.opts.sliders[i].opts.firstTime = false;
            this.opts.sliders[i].focusOnButton();
          }
        }
      } else {
        this.setVisible(i, false, overlay);
      }
    }

    if ($sliderIndex === 1) {
      if (this.opts.sliders[0] instanceof Promo) {
        this.opts.sliders[0].focusOnButton(false);
        this.setVisible(0, true, false);
      }
    }
  }

  refreshImages(index) {
    const { type } = this.opts.slidersData[index];
    if (type === "promo") {
      this.opts.sliders[index].init(0);
    } else {
      if (this.isVisible(index)) {
        if (appConfig.REMOVE_IMG_DOM) {
          this.showImages(index);
        }
      }
    }
  }

  showImages(index) {
    const { type } = this.opts.slidersData[index];
    if (
      !this.opts.sliders[index].opts.isSkeleton &&
      (type === "series" ||
        type === "movies" ||
        type === "channels" ||
        type === "actors" ||
        type === "services" ||
        type === "carrusel_canales_orden_uv" ||
        type === "carrusel_canales_orden_mv" ||
        type === "thematic")
    ) {
      this.opts.sliders[index].setVisible();
    }
  }

  hideImages(index, wrap) {
    if (!wrap) {
      wrap = this.opts.elems[".slider-item"].eq(index).find(".slider-wrap")[0];
    }

    const { type } = this.opts.slidersData[index];
    if (
      !this.opts.sliders[index].opts.isSkeleton &&
      (type === "series" ||
        type === "movies" ||
        type === "channels" ||
        type === "actors" ||
        type === "services" ||
        type === "thematic" ||
        type === "nodes")
    ) {
      const itemWraps = wrap.querySelectorAll(".item-wrap");
      for (let j = 0; j < itemWraps.length; j++) {
        const imgWrap = itemWraps[j].querySelector(".img-wrap");
        imgWrap.querySelector("img").remove();
      }
    }
  }

  isVisible(index) {
    const $item = this.opts.elems[".slider-item"].eq(index);
    return !$item.hasClass("unvisible");
  }

  setOverlay(slider, wrap, withOverlay) {
    const itemWraps = wrap.querySelectorAll(".item-wrap");
    const hasLeftOverlay = slider instanceof Carousel;

    for (let j = 0; j < itemWraps.length; j++) {
      if (withOverlay) {
        itemWraps[j].classList.add("overlay-50");
      } else {
        if (!hasLeftOverlay || (hasLeftOverlay && j > 1)) itemWraps[j].classList.remove("overlay-50");
      }
    }
  }

  setVisible(index, visible, withOverlay) {
    const item = this.opts.elems[".slider-item"].eq(index)[0];
    const wrap = item.querySelector(".slider-wrap");
    if (this.opts.sliders[index].opts?.elems?.length === 0) {
      visible = false;
    }

    if (visible) {
      item.classList.remove("unvisible");
      item.classList.remove("no-display");
      wrap.classList.remove("no-display");
      this.setOverlay(this.opts.sliders[index], wrap, withOverlay);

      if (appConfig.REMOVE_IMG_DOM) {
        this.showImages(index);
      }
    } else {
      if (index < this.opts.activeSlider) {
        if (!item.classList.contains("unvisible")) {
          item.classList.add("unvisible");
        }
      } else {
        if (!item.classList.contains("no-display")) {
          item.classList.add("no-display");
        }
      }
      if (!this.opts.isUserProfiles) {
        if (!wrap.classList.contains("no-display")) {
          wrap.classList.add("no-display");
        }
      }
      if (
        !wrap.classList.contains("no-display") &&
        !(this.opts.sliders[this.opts.activeSlider] instanceof CarouselPromos)
      ) {
        wrap.classList.add("no-display");
      }

      if (appConfig.REMOVE_IMG_DOM) {
        this.hideImages(index, wrap);
      }
    }

    // Quitamos la clase no-display en los sliders de perfiles para recoger el alto correcto de las calles en el movimiento
    // vertical
    if (this.opts.sliders[this.opts.activeSlider] instanceof Users) {
      wrap.classList.remove("no-display");
    }
  }

  moveFirstTime($idx) {
    if (this.opts.sliders[$idx].opts.firstTime) {
      if (this.opts.slidersData[$idx].type !== "promo") {
        if (this.opts.slidersData[$idx].data?.length > 0 && this.opts.slidersData[$idx].data[0].type == "enlace") {
          this.opts.activeSliderItem[$idx] = 1;
          this.opts.sliders[$idx].opts.itemIndex = 1;
        } else {
          this.opts.activeSliderItem[$idx] = 0;
          this.opts.sliders[$idx].opts.itemIndex = 0;
        }
        this.opts.sliders[$idx].opts.firstTime = false;
      }
    }
  }

  skeletonInitial() {
    let ocultByRating = false;
    for (let i = 0; i < this.opts.slidersData.length; i++) {
      if (this.opts.slidersData[i]) this.opts.slidersData[i]["idRow"] = `idRow_${i}`;
      //Compara ageRating
      if (
        this.opts.slidersData[i].ageRating_min &&
        !ControlParentalMng.instance.isAgeRatingAllowed(this.opts.slidersData[i].ageRating_min)
      ) {
        ocultByRating = true;
      }
      let { type } = this.opts.slidersData[i];
      if (i === 0 && (type !== "promo" || !this.opts.isHome)) {
        this.opts.elems[".slider-items"].addClass("nopromo");
      }
      if (type === "carrusel_canales_orden_uv" || type === "carrusel_canales_orden_mv") {
        this.opts.slidersData[i].orig_type = type;
        type = "channels";
        this.opts.slidersData[i].type = type;
      }

      let title = "";
      // if (this.opts.slidersData[i].title && this.opts.slidersData[i].title.indexOf('{')===-1){
      title = this.opts.slidersData[i].title;
      // }

      const $slider = jQuery(
        this.opts.tpl.item
          .replace(/##type##/g, type)
          .replace(/##id##/g, i)
          .replace(/##title##/g, title)
      ).appendTo(this.opts.slidersWrap);
      if (type === "menu") {
        $slider.find(".slider-title").remove();
        $slider.find(".slider-count").remove();
      } else {
        if (!title) {
          $slider.find(".slider-title").empty();
        }
        if (type === "promo" || this.opts.isUserProfiles) {
          $slider.find(".slider-title").remove();
          $slider.find(".slider-count").remove();
        }
      }
      if (type === "channels" && this.opts.slidersData[i + 1]) {
        const prevSliderType = this.opts.slidersData[i - 1]?.type;
        if (prevSliderType && prevSliderType === "menu") {
          this.opts.slidersData[i].hideTitle = true;
        }
      }
      this.opts.slidersData[i].wrap = $slider.find("[data-slider]");
      this.opts.slidersData[i].startWithSkeleton = true;
      if (type === "carrusel_multiple_horizontal" || type === "carrusel_multiple_vertical") {
        if (title?.length) {
          $slider[0].classList.add("title-on");
        }
        this.opts.slidersData[i].idxSlider = i;
      }
      if (
        type === "series" ||
        type === "movies" ||
        type === "channels" ||
        type === "actors" ||
        type === "services" ||
        type === "thematic" ||
        type === "nodes"
      ) {
        type = "carousel";
      }
      if (type === "promo" || type === "carousel-promos" || type === "carousel-promos-vertical") {
        this.opts.slidersData[i].startWithSkeleton = false;
      }
      if (this.opts.slidersData[i].type === "menu" && this.opts.isHome) {
        this.opts.slidersData[i].isHome = true;
      }

      for (let c = 0; c < _classes.length; c++) {
        const elemento_nombre = "name";
        const elemento_clase = "class";
        if (_classes[c][elemento_nombre] === type) {
          this.opts.sliders[i] = new _classes[c][elemento_clase](this.opts.slidersData[i]);
          break;
        }
      }
      if (
        type != "menu" &&
        type != "carousel-promos" &&
        type != "carousel-promos-vertical" &&
        type != "promo" &&
        (type != "carrusel_multiple_horizontal" || type != "carrusel_multiple_vertical")
      ) {
        this.opts.sliders[i].opts.isSkeleton = true;
      }

      /*if (type === "menu") {
        this.opts.sliders[i].opts.events.on("menuItemClick", this.onMenuItemClick.bind(this));
      }*/

      this.opts.activeSliderItem[i] = 0;
      if (ocultByRating) {
        this.opts.sliders[i].opts.withoutContent = true;
        ocultByRating = false;
      }
    }
    this.opts.elems[".slider-item"] = this.opts.wrap.find(".slider-item");

    this.checkVisibility();
    this.checkSkeleton();

    if (this.opts.isHome) {
      const promo_boot_focus = AppStore.home.initial_setup();
      if (promo_boot_focus) {
        this.active_slider(0, true);
      } else {
        this.active_slider(1);
      }
    } else {
      const activate = this.opts.sliders.findIndex((slider) => {
        return slider.opts.isEmpty !== true;
      });
      this.active_slider(activate);
    }
    LoaderMng.instance.hide_loader();
  }

  checkSkeleton() {
    // Check to remove skeleton next and prev N_SLIDERS_LOADED
    for (let i = 0; i <= 2 * appConfig.N_SLIDERS_LOADED; i++) {
      // pos: to start for current slider
      let pos = -1;
      if (i <= appConfig.N_SLIDERS_LOADED) {
        pos = this.opts.activeSlider + i;
      } else {
        pos = this.opts.activeSlider - (i - appConfig.N_SLIDERS_LOADED);
      }

      if (pos < 0 || pos >= this.opts.slidersData.length) {
        continue;
      }
      if (this.opts.sliders[pos].opts.isEmpty) {
        continue;
      }

      let { type } = this.opts.slidersData[pos];
      if (type === "carrusel_canales_orden_uv" || type === "carrusel_canales_orden_mv") {
        this.opts.slidersData[pos].orig_type = type;
        type = "channels";
      }
      if (
        type === "series" ||
        type === "movies" ||
        type === "channels" ||
        type === "promo" ||
        type === "actors" ||
        type === "services" ||
        type === "thematic"
      ) {
        if (!this.opts.sliders[pos].opts.data || this.opts.sliders[pos].opts.data.length === 0) {
          if (
            pos > this.opts.activeSlider - appConfig.N_SLIDERS_LOADED &&
            pos <= this.opts.activeSlider + appConfig.N_SLIDERS_LOADED
          ) {
            if (!this.opts.sliders[pos].opts.refreshing) {
              // debug.alert("remove skeleton " + pos + " " + this.opts.slidersData[pos].query.url);
              this.opts.sliders[pos].opts.refreshing = true;
              if (this.opts.slidersData[pos].consulta) {
                AppStore.home.refresh_calle_consulta(this, pos, this.opts.slidersData[pos].consulta);
              } else AppStore.home.refresh_calle(this, pos, this.opts.slidersData[pos].query);
            }
          }
        }
      } else if (type === "nodes") {
        AppStore.home.refreshSlider(this, pos, this.opts.sliders[pos].opts.data);
      }
    }
  }

  destroy() {
    if (!this.canBeDestroyed) {
      return;
    }

    //
    //  Antes de destruir la vista de slider limpiar la data
    //
    let i;
    for (i = 0; i < this.opts.slidersData.length; i++) {
      this.opts.slidersData[i].data = [];
    }

    super.destroy();

    // this.opts.wrap.removeClass("active");
    this.remove_error_msg();

    this.opts.wrap.empty();
    this.opts.slidersWrap = null;

    for (i = 0; i < this.opts.sliders.length; i++) {
      this.opts.sliders[i].destroy();
    }

    this.opts.activeSlider = 0; // start slider in first time
    this.opts.sliders = []; // slider class object
    this.opts.slidersData = []; // slider data
    this.opts.activeSliderItem = []; // active item index in each sliders

    this.opts.min_i = 0;
    this.opts.max_i = 0;
    this.n_loads = 0;

    return this;
  }

  remove($idx) {
    this.opts.slidersData.splice($idx, 1);
    this.opts.sliders.splice($idx, 1);
    this.opts.activeSliderItem.splice($idx, 1);

    this.opts.elems[".slider-item"].eq($idx).remove();

    this.opts.elems[".slider-item"] = this.opts.wrap.find(".slider-item");
  }

  hide($idx) {
    this.opts.sliders[$idx].opts.isEmpty = true;
    this.opts.elems[".slider-item"].eq($idx).css("display", "none");
  }

  show($idx) {
    this.opts.sliders[$idx].opts.isEmpty = false;
    this.opts.elems[".slider-item"].eq($idx).css("display", "block");
  }

  /**
   * procesa el fallo de carga de datos de un slider
   * @param {Number} $idx indice
   */
  loadFailed($idx) {
    const { sliders } = this.opts;
    const sliderFailed = sliders[$idx];

    if (sliderFailed && sliderFailed instanceof CarouselMultiple) {
      sliderFailed.loadFail();
    } else {
      this.removeSlider($idx);
    }
  }

  /**
   * quita el slider de la vista de sliders
   * @param {Number} $idx indice
   */

  removeSlider($idx) {
    const $sliders = this.opts.sliders;
    const $activeSliderItem = this.opts.activeSliderItem;

    if ($idx >= this.opts.activeSlider) {
      this.hide($idx);

      // Check how affects to active slider
      if ($idx > this.opts.activeSlider) {
        // Nothing because removed is below
        if ($idx === this.opts.activeSlider + 1 || $idx === this.opts.activeSlider + 2) {
          // Just check visibility of next 2
          this.checkVisibility();
        }
      } else if ($idx === this.opts.activeSlider) {
        const next_slider = this.nextSliderIndex();
        if (next_slider !== -1) {
          this.active_slider(next_slider);
          // End move to show description
          $sliders[next_slider].endMove($activeSliderItem[next_slider]);
        } else {
          const prev_slider = this.prevSliderIndex();
          if (prev_slider !== -1) {
            this.active_slider(prev_slider);
            // End move to show description
            $sliders[prev_slider].endMove($activeSliderItem[prev_slider]);
          }
        }
      }
    } else if ($idx < this.opts.activeSlider) {
      this.opts.slidersData[$idx].mark_to_hide = true;
    }
  }

  /**
   * agrega slider a la vista de sliders
   * @param {Number} $idx indice
   */
  addSlider($idx) {
    if ($idx >= this.opts.activeSlider) {
      this.show($idx);

      debug.alert(`addSlider ${$idx}`);

      // Check how affects to active slider
      if ($idx > this.opts.activeSlider) {
        // Nothing because removed is below
        if ($idx === this.opts.activeSlider + 1 || $idx === this.opts.activeSlider + 2) {
          // Just check visibility of next 2
          this.checkVisibility();
        }
      }
    } else if ($idx < this.opts.activeSlider) {
      this.opts.slidersData[$idx].mark_to_show = true;
    }
  }

  isLastRow() {
    return this.opts.activeSlider === this.opts.sliders.length - 1;
  }

  isFirstRow() {
    return this.opts.activeSlider === 0;
  }

  is_empty() {
    return this.opts.sliders.length === 0;
  }

  add_error_msg() {
    debug.alert("add_error_msg");
    const error_msg =
      "<div class='msg_error' id='slider_msg_error'><div class='ent'>{{ent}}</div><div class='det'>{{det}}</div></div>";
    const error = AppStore.errors.getError("VOD", "I_VOD_2");
    const $error = $(error_msg.replace("{{ent}}", error.Titulo).replace("{{det}}", error.Cuerpo));
    $error.appendTo(this.opts.wrap);
  }

  remove_error_msg() {
    debug.alert("remove_error_msg");
    $("#slider_msg_error").remove();
  }

  get_data_item_index(index) {
    const item = this.opts.sliders[index];
    return Number(item.attr("data-item-index"));
  }

  /**
   * Obtiene el slider en la posicion {@link index}
   * @param {number} index
   */
  get_slider(index) {
    return this.opts.sliders[index];
  }

  /**
   * Obtiene el Slider activo
   */
  get_active_slider() {
    return this.get_slider(this.opts.activeSlider);
  }

  /**
   * sets expanded view mode
   */
  set_expanded_view_mode() {
    debug.alert("set_expanded_view_mode");
    const slider_activo = this.opts.wrap.hasClass("active");
    if (!this.opts._is_expanded_view_mode && slider_activo) {
      const sliderType = this.opts.sliders[this.opts.activeSlider]?.getType() || "";
      let colapsedClass = "";
      if (this.SLIDER_COLLAPSE[sliderType]) {
        colapsedClass = this.SLIDER_COLLAPSE[sliderType].colapsedClass;
        this.opts.wrap[0].classList.add(colapsedClass);
      }
      this.move_expanded_view_mode(this.opts.activeSlider, "set");
      this.opts._is_expanded_view_mode = true;
    }
    debug.alert("set_expanded_view_mode END");
  }

  /**
   * unsets expanded view mode
   * @param {Boolean} move is move needed
   */
  unset_expanded_view_mode(move = true) {
    if (this.opts._is_expanded_view_mode) {
      if (move === true) {
        this.move_expanded_view_mode(this.opts.activeSlider, "unset");
      }
      this.removeCollapsedClasses(this.opts.wrap[0]);
      this.opts._is_expanded_view_mode = false;
    }
  }

  /**
   * sets collapsed slider height
   * @param {Number} $sliderIndex
   * @param {String} set
   */
  move_expanded_view_mode($sliderIndex, set) {
    const $sliders = this.opts.sliders;
    const $sliderElemWrap = this.opts.elems[".slider-items"];
    const $sliderElems = this.opts.elems[".slider-item"];
    this.changeSpeedTranslate();

    let moveTop = 0;
    const sliderType = $sliders[$sliderIndex].getType();

    if (this.SLIDER_COLLAPSE[sliderType]) {
      moveTop = this.SLIDER_COLLAPSE[sliderType].moveTop;
      const activeElem = $sliderElems[$sliderIndex];
      const title = activeElem.querySelector(".slider-title");
      const titleHeight = getElementTotalHeight(title);
      moveTop = moveTop - titleHeight;
    } else {
      return;
    }

    if (set !== "set") {
      moveTop = -moveTop;
    }

    debug.alert(`${set} moveTop ${moveTop}`);
    this.verticalTranslateSlider($sliderElemWrap[0], moveTop, true);
  }

  /**
   * remove colapsed classes from elem
   * @param {HTMLElement} element
   */
  removeCollapsedClasses(element) {
    if (element instanceof HTMLElement) {
      const classes = Array.from(element.classList);
      classes.forEach((className) => {
        if (className.startsWith("colapsed-")) {
          element.classList.remove(className);
        }
      });
    }
  }

  /** gets the sliders transform style applied on the y axis */
  getSlidersVerticalDisplacement() {
    const sliderElem = this.opts.elems[".slider-items"][0];
    const transform = window.getComputedStyle(sliderElem).getPropertyValue("transform");
    const matrixTransform = transform.replace(/[^0-9\-.,]/g, "").split(",");
    const num1 = Number(matrixTransform[5]);
    const num2 = Number(matrixTransform[13]);
    return !isNaN(num1) ? num1 : !isNaN(num2) ? num2 : null;
  }

  /***************/
  /* GRABACIONES */
  /***************/
  get recordableComponent() {
    return this.opts.sliders[this.opts.activeSlider];
  }

  getActiveProgram() {
    try {
      const control = this.recordableComponent;
      const status = control.opts.status_data[control.opts.itemIndex];
      const fuente = status?.get_contenido();
      return fuente;
    } catch (error) {
      return null;
    }
  }

  async sendAudience(itemData, audType) {
    const { type, scene, m, p, nombre, migas, submenu_nombre, title, partnerCode, menuTitle } = itemData;
    const destmne = nombre || m;
    const destpage = scene || p;
    const isEnlace = type === "enlace";
    const { col, row } = itemData || 0;

    if (audType === "enlace") {
      const sec = isEnlace && migas ? { sec: migas || menuTitle || nombre } : { sec: menuTitle || nombre };
      const sendACT = isEnlace ? (this.opts.isHome ? "ck_more" : "ck_more-01") : "ck_menu-02";
      const sendAUD = isEnlace ? "carousels" : "menu";
      const _isHome = ViewMng.instance?.active;
      if (sendACT === "ck_menu-02" && itemData.data)
        AppStore.tfnAnalytics.audience_navigation("menu", "view-01", {
          sec: itemData?.data[0].title,
          col,
          row,
        });
      AppStore.tfnAnalytics.audience_navigation(sendAUD, sendACT, {
        destmne,
        destpage,
        col,
        row,
        ...sec,
        isHome: _isHome?.opts?.isHome,
        viewType: _isHome?.type,
      });
      if (isEnlace) {
        AppStore.tfnAnalytics.audience_navigation(sendAUD, "viewMore", {
          pg: submenu_nombre || migas,
          ...sec,
          col,
          row,
          isHome: _isHome?.opts?.isHome,
          viewType: _isHome?.type,
        });
      }
    } else if (audType === "ep") {
      const epartner = partnerCode;
      let pdevid = " ";
      if (epartner === "netflix") {
        const epInfo = await Main.getAppInfo(epartner);
        pdevid = epInfo.deviceId;
      }
      AppStore.tfnAnalytics.audience_navigation(
        "menu",
        "ck_menu-01",
        {
          sec: title,
          col,
          row,
          ep: true,
          destmne: "ExternalPartnerApp",
          destpage: itemData.shortcut,
          nodeid: itemData.id,
          pdevid,
          epartner,
        },
        itemData
      );
    }
  }

  async onMenuItemClick(itemData) {
    BackgroundMng.instance.hide_bg_image();
    if (this.opts.sliders[0] instanceof Promo) {
      this.opts.sliders[0].animate_stop();
    }
    const { type, scene } = itemData;

    if (!["SettingsScene", "ConfigScene", "SettingsLocalesScene"].includes(scene) && type !== "ep") {
      this.sendAudience(itemData, "enlace");
    } else if (type === "ep") {
      this.sendAudience(itemData, "ep");
    }
    switch (type) {
      case "coleccion_horizontal":
      case "coleccion_vertical":
        AppStore.home.load_grid({
          ...itemData,
          type,
        });
        break;
      case "slider":
        AppStore.home.sliders_new(itemData);
        break;
      case "profiles":
        ViewMng.instance.navigateTo("ProfileScene");
        break;
      case "scene":
        ViewMng.instance.navigateTo(scene);
        break;
      case "enlace":
        this._getActiveSlider().click(type);
        break;
      case "ep":
        EpMng.instance.launchEPFromItem(itemData);
        break;
      case "3pa":
        TpaMng.instance.launch3paFromItem(itemData);
        break;
    }
  }

  /**
   * Instacia el popUp de control parental
   */
  showKeyboard(keyboard) {
    this.opts.textKbCompWrap = document.getElementById("homewrap");
    this.opts.textKbCompWrap.insertAdjacentHTML(
      "beforeend",
      String.raw`<div id="settings-keyboard-comp" class="settings-keyboard-comp"></div>`
    );
    this.opts.elems["keyboard"] = this.opts.textKbCompWrap.lastChild;
    this.opts.keyboardModal = new KeyboardModalComponent(this.opts.elems["keyboard"], this.opts.eventBus);
    this.opts.prevComponent = this;
    this.opts.originalActiveComponent = this;
    this.activeComponent = this.opts.keyboardModal;
    this.opts.canUseDial = false;
    this.opts.keyboardModal.init(keyboard);
  }

  /**
   * Destruye el popUp de control parental
   */
  hideKeyboardModal() {
    if (this.opts.elems["keyboard"]) {
      this.opts.textKbCompWrap.removeChild(this.opts.elems["keyboard"]);
      this.opts.elems["keyboard"] = null;
      this.opts.activeComponent = this.opts.originalActiveComponent;
      this.opts.canUseDial = true;
    }
  }

  get canUseDial() {
    return this.opts.canUseDial;
  }

  /**
   * Se ubica en el primer elemento del slider activo
   * de la vista
   * @private
   */
  _gotoHomeSliderItem() {
    const firstSliderIndex = this.get_first_non_empty_slider_index();
    if (this.opts.activeSlider !== firstSliderIndex) {
      this.active_slider(firstSliderIndex);
    }

    const slider = this._getActiveSlider();
    slider.sel_item(0);
  }

  watchRental() {
    watchVod();
  }

  checkRefreshPreload() {
    this.opts.sliders.forEach((slider) => {
      if (slider instanceof Carousel || slider instanceof CarouselMultiple) {
        slider.preloadData();
      }
    });
  }
}
