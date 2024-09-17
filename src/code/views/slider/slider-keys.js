import { throttleAnnotation } from "src/code/js/anotations";
import { audienceManager } from "@newPath/managers/audiences/audience-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { EpMng } from "@newPath/managers/ep-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { ShortcutsMng } from "@newPath/managers/shortcuts-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { BaseViewRecordingsKeys } from "src/code/views/base-view-recordings-keys";
import { Main } from "@tvlib/Main";

/**
 * Manejo de teclas del Slide con manejo de Grabaciones
 */
export class SliderKeys extends BaseViewRecordingsKeys {
  constructor(wrap) {
    super(wrap);

    //
    // Anotaciones
    //
    this.goEnter = throttleAnnotation(this.goEnter.bind(this), 300);
    this.queue = [];
    this.isExecuting = false;
  }

  /**
   * Devuelve true si es el HOME
   * @type {Boolean}
   * @override
   */
  get isHome() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Devuelve true si se está sobre la primera slide
   * @type {Boolean}
   * @override
   */
  get isFirstSlide() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Obtiene el índice de la Slide anterior no vacia
   *
   * @return {Number} -1 si no existe, positivo si existe
   */
  prev_slide() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Obtiene el índice de la Slide siguiente no vacia
   *
   * @return {Number} -1 si no existe, positivo si existe
   */
  next_slide() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Activa un slide
   *
   * @param {number} index Indice de la slide a activar
   */
  active_slider() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Obtiene el indice del primer slider de arriba a abajo que NO este vacío.
   *
   * @return {Number} -1 si no existe, positivo si existe
   */
  get_first_non_empty_slider_index() {
    throw new Error("SliderKeys: Must Implement");
  }

  /**
   * Destruye el popUp de control parental
   */
  hideKeyboardModal() {
    throw new Error("SliderKeys: Must Implement");
  }

  //  --------------------------------------------------------------------------
  //  Keys
  //  --------------------------------------------------------------------------

  /**
   * Si estas en el home y presionas la tecla MENU mostrar el canal que está
   * de fondo, si y solo si estas en la pantalla de Home
   */
  async onMenuPressedEvent() {
    let keyHandled = false;
    //
    //  Si no es el home ignorar el mostrar el canal inicial
    //
    if (this.isHome) {
      keyHandled = await this._executeBackOrHome(true);
    }
    return keyHandled;
  }

  async executeQueue() {
    if (this.isExecuting) {
      return;
    }
    this.isExecuting = true;
    while (this.queue.length > 0) {
      const func = this.queue.shift();
      await func(); // Aseguramos que 'this' sea correcto al llamar a la función
    }
    this.isExecuting = false;
  }

  goLeft() {
    //this._cleanFocused(300);
    //this._cleanFocused(2000);
    this.queue.push(this._goLeft.bind(this));
    this.executeQueue();
  }

  goRight() {
    //this._cleanFocused(300);
    //this._cleanFocused(2000);
    this.queue.push(this._goRight.bind(this));
    this.executeQueue();
  }

  goUp() {
    //this._cleanFocused(300);
    //this._cleanFocused(2000);
    this.queue.push(this._goUp.bind(this));
    this.executeQueue();
  }

  goDown() {
    //this._cleanFocused(300);
    //this._cleanFocused(2000);
    this.queue.push(this._goDown.bind(this));
    this.executeQueue();
  }

  gotoPreviousSlider() {
    //this._cleanSliders();
    setTimeout(() => {
      this.queue.push(this._gotoPreviousSlider.bind(this));
      this.executeQueue();
    }, 1000);
  }

  async _goUp() {
    const splashActive = LoaderMng.instance.isSplashActive();
    if (splashActive) return;
    if (this.isSliderViewPlayer()) {
      PlayMng.instance.playerView.restartTimeoutHideSugerencias();
    }
    const activeSlider = this._getActiveSlider();

    if (activeSlider.opts.type == "promo" && activeSlider.opts.wrap.find(".click").length) {
      return;
    }
    if (typeof activeSlider.canGoUp === "function" && activeSlider.canGoUp()) {
      // slider sube internamente
      if (typeof activeSlider.goUp === "function") activeSlider.goUp();
    } else {
      this._refreshBackground();
      const prevSliderIdx = this.prevSliderIndex();
      if (prevSliderIdx != -1) {
        this.beforePrevSlider();
        await this.active_slider(prevSliderIdx);
        const currentSlider = this._getActiveSlider();
        this.set_prefsActiveSlider(currentSlider);
        if (currentSlider.getType() == "promo") {
          currentSlider.opts.last = {};
          const perfil_tooltip = document.querySelector(".menu-item.active .perfiles-tooltip");
          if (perfil_tooltip && perfil_tooltip.classList.contains("on")) {
            perfil_tooltip.classList.remove("on");
            perfil_tooltip.classList.add("off");
          }
        }
      }
    }
    return;
  }

  async _goDown() {
    const splashActive = LoaderMng.instance.isSplashActive();
    if (splashActive) return;
    const activeSlider = this._getActiveSlider();
    if (activeSlider.getType() == "promo") {
      activeSlider.opts.last = {};
    }
    if (this.isSliderViewPlayer()) {
      PlayMng.instance.playerView.restartTimeoutHideSugerencias();
    }

    if (activeSlider.opts.type == "promo" && activeSlider.opts.wrap.find(".click").length) {
      return;
    }
    if (typeof activeSlider.canGoDown === "function" && activeSlider.canGoDown()) {
      //slider baja internamente
      if (typeof activeSlider.goDown === "function") activeSlider.goDown();
    } else {
      this._refreshBackground();
      const nextSliderIdx = this.nextSliderIndex();
      if (nextSliderIdx != -1) {
        this.beforeNextSlider();
        await this.active_slider(nextSliderIdx);
        const currentSlider = this._getActiveSlider();
        this.set_prefsActiveSlider(currentSlider);
        const perfil_tooltip = document.querySelector(".menu-item.active .perfiles-tooltip");
        if (perfil_tooltip && perfil_tooltip.classList.contains("off")) {
          perfil_tooltip.classList.remove("off");
          perfil_tooltip.classList.add("on");
        }
      }
    }
    return;
  }

  async _goLeft() {
    const splashActive = LoaderMng.instance.isSplashActive();
    if (splashActive) return;
    const activeSlider = this._getActiveSlider();
    const sliderType = activeSlider.getType();

    if (sliderType != "channels") {
      this._refreshBackground();
    }
    if (sliderType == "promo") {
      activeSlider.opts.last = {};
    }
    if (this.isSliderViewPlayer()) {
      PlayMng.instance.playerView.restartTimeoutHideSugerencias();
    }
    this.set_prefsActiveSlider(activeSlider);
    if (activeSlider.opts.type == "promo" && activeSlider.opts.wrap.find(".click").length) {
      return;
    }
    this._getActiveSlider().prev_slide();
    return;
  }

  async _goRight() {
    const splashActive = LoaderMng.instance.isSplashActive();
    if (splashActive) return;
    const activeSlider = this._getActiveSlider();
    const sliderType = activeSlider.getType();

    if (sliderType != "channels") {
      this._refreshBackground();
    }
    if (sliderType == "promo") {
      activeSlider.opts.last = {};
    }
    if (this.isSliderViewPlayer()) {
      PlayMng.instance.playerView.restartTimeoutHideSugerencias();
    }
    this.set_prefsActiveSlider(activeSlider);
    if (activeSlider.opts.type == "promo" && activeSlider.opts.wrap.find(".click").length) {
      return;
    }
    this._getActiveSlider().next_slide();
    return;
  }

  set_prefsActiveSlider(activeSlider) {
    const sliderType = this._getActiveSliderType();
    const itemData = activeSlider?.opts.data[activeSlider.opts.itemIndex] || {};
    const tabInfo = activeSlider?.getTabInfo ? activeSlider.getTabInfo() : null;
    const tbName = tabInfo?.tabName;
    const sourceType = tabInfo?.sourceType;
    const title = this._getActiveSliderTitle() || itemData?.nombre || itemData?.title;
    const pgName = this.opts.title?.length ? this.opts.title : "MainMenu";

    audienceManager.activeSlider = {
      type: sliderType,
      pg: pgName,
      sec: itemData?.nombre || title || tbName,
      row: this.opts.activeSlider,
      col: activeSlider.opts.itemIndex,
      m: itemData.m || itemData.M,
      p: itemData.p || itemData.P,
      title,
      idRow: itemData.idRow || activeSlider?.opts?.idRow,
      sliderType,
      sourceType,
    };
    itemData.col = activeSlider.opts.itemIndex;
    itemData.row = this.opts.activeSlider;
    this.createPositionRowsSlider(this.opts.sliders || []);
    activeSlider.opts.data.referenceSliders = audienceManager.activeSlider;
  }

  createPositionRowsSlider(_sliders) {
    const itemns = _sliders.filter((elem) => elem?.opts?.data && elem?.opts?.data.length);
    let dataRow;
    const positionRowSliders = [];
    const _isHome = ViewMng.instance?.active?.opts?.isHome;
    if (_isHome && itemns.length) {
      itemns.forEach(function (_slider, indexSlider) {
        const item = {
          row: indexSlider,
          type: _slider?.opts.type,
          title: _slider?.opts?.title,
          idRow: _slider?.opts?.idRow,
        };
        if (item) positionRowSliders.push(item);
      });

      if (positionRowSliders.length) {
        dataRow = positionRowSliders.find(
          (element) =>
            element.idRow === audienceManager.activeSlider?.idRow ||
            (element.title === audienceManager.activeSlider?.title &&
              element.type === audienceManager.activeSlider?.type)
        );
        if (dataRow) audienceManager.activeSlider.row = dataRow.row;
      }
    }
  }

  async sendEPAudience(action, button, itemData) {
    const sliderType = this._getActiveSliderType();
    const activeSlider = this._getActiveSlider();
    const _isHome = ViewMng.instance?.active?.opts?.isHome;
    const mne = _isHome ? "Menu" : "ContentListService";
    const epartner = itemData.Origen.partner.id360;
    const title = itemData.DatosEditoriales.Titulo;
    const dlink = itemData.Origen.partner.links[0].href;
    let pdevid = " ";
    if (epartner === "NFX") {
      try {
        const epInfo = await Main.getAppInfo("netflix");
        pdevid = epInfo.deviceId;
      } catch {
        pdevid = " ";
      }
    }
    const baseParams = { mne, epartner, title, dlink, pdevid };
    let actionType = action;
    let additionalParams = {};

    if (action === "play_prod") {
      if (sliderType === "carrusel_multiple_horizontal") {
        const sec = activeSlider.getActiveTab();
        const carousel = activeSlider.opts.carousel;
        const col = carousel.opts.itemIndex;
        actionType = "play_prod-01";
        additionalParams = { button, sec: sec["@nombre"], col };
      } else {
        additionalParams = { button };
      }
    }

    AppStore.tfnAnalytics.audience_navigation(
      "ExternalPartner",
      actionType,
      { ...baseParams, ...additionalParams },
      itemData
    );
  }

  async goEnter() {
    const activeSlider = this._getActiveSlider();
    const sliderType = this._getActiveSliderType();
    const itemData = activeSlider.opts.data[activeSlider.opts.itemIndex] || {};
    let title = this._getActiveSliderTitle();
    let tabsEnlace = activeSlider.opts?.tabs?.opts?.focused ? (tabsEnlace = activeSlider.getTabsEnlace()) : undefined;
    if (itemData.Origen?.isExternal) this.sendEPAudience("ck_prod", "ok", itemData);

    if (activeSlider.opts.type == "promo" && activeSlider.opts.wrap.find(".click").length) return;

    if (itemData.type === "slider" && activeSlider.opts.data[activeSlider.opts.itemIndex].pin === "S") {
      /* Control para ver si necesita de control parental el item clickado @pin: "S"*/
      AppStore.PinMng.enabled = true;
      const response = await AppStore.PinMng.init();
      if (
        response.eventName === AppStore.PinMng.status.PIN_KO ||
        response.eventName === AppStore.PinMng.status.PIN_KO_BACK
      ) {
        return false;
      } else if (response.eventName === AppStore.PinMng.status.PIN_OK) {
        await ViewMng.instance.cleanType(AppStore.PinMng.PIN_VIEW);
      }
    }
    if (
      activeSlider.opts.type !== "channels" &&
      !activeSlider.opts.isSkeleton &&
      !(activeSlider.opts?.tabs?.opts?.focused && !tabsEnlace)
    ) {
      LoaderMng.instance.show_loader();
    }
    if (itemData.type) {
      this.set_prefsActiveSlider(activeSlider);
      this.onMenuItemClick(itemData);
    } else {
      if (!activeSlider.opts.isSkeleton) {
        this.set_prefsActiveSlider(activeSlider);
        if (!title) title = activeSlider?.getTabInfo ? activeSlider?.getTabInfo()?.tabName : null;
        activeSlider.click(sliderType);
      }
    }
  }

  async goBack() {
    const splashActive = LoaderMng.instance.isSplashActive();
    if (splashActive) return;
    return this._executeBackOrHome();
  }

  goPlayPause() {
    const activeSlider = this._getActiveSlider();
    let itemData;
    if (typeof activeSlider.isCarouselMultiple === "function" && activeSlider.isCarouselMultiple()) {
      if (activeSlider.opts.active) {
        const carousel = activeSlider.opts.carousel;
        itemData = carousel?.opts.data[carousel.opts.itemIndex];
      } else {
        itemData = activeSlider.getActiveTab();
      }
    } else {
      itemData = activeSlider.opts.data[activeSlider.opts.itemIndex] || {};
    }
    if (itemData["@shortcut"] && itemData["@source_type"]) {
      ShortcutsMng.instance.execute(itemData["@shortcut"], { ...itemData });
    } else if (itemData.Origen?.isExternal) {
      this.sendEPAudience("play_prod", "play", itemData);
      EpMng.instance.handleExternalPartner(itemData).then((handle) => {
        if (!handle) LoaderMng.instance.hide_loader();
      });
    } else {
      this._playContent();
    }
  }

  goStop() {
    this._stopRecordContent();
  }

  goRec() {
    this._recordContent();
  }

  goRed() {
    this._recordContent();
  }

  goYellow() {
    const activeSlider = this._getActiveSlider();
    const itemData = activeSlider.opts.data[activeSlider.opts.itemIndex] || {};
    if (itemData.Origen?.isExternal) this.sendEPAudience("play_prod", "yellow", itemData);
    AppStore.yPlayerCommon.setAutoplay(false);
    this._playContent(true);
  }

  /**
   * Ejecuta el comportamiento del GO BACK
   *
   * @param {boolean} [isHomeKeyPressed=false] True si se presiono la tecla home
   * @returns {Promise}
   */
  async _executeBackOrHome(isHomeKeyPressed = false) {
    let result = false;
    if (this._getCanPlayChannelOnBack(isHomeKeyPressed)) {
      result = await PlayMng.instance.playLastChannel();
    } else {
      this._refreshBackground();
      if (this.activeComponent === this.opts.keyboardModal) {
        this.hideKeyboardModal();
      } else {
        await this.gotoPreviousSlider();
      }
    }
    return result;
  }

  /*
  _cleanFocused(_time) {
    setTimeout(() => {
      const focusables = document.querySelectorAll(".focused");
      if (focusables.length > 1 || document.querySelector(".menu-item.active") != null) {
        focusables.forEach((slider) => {
          slider.classList.remove("focused");
        });
      }
    }, _time || 0);
  }

  _cleanSliders(_time) {
    const sliders = document.getElementById("sliders");
    if (sliders) {
      sliders.scrollTop = 0;
    }
    this._cleanFocused(_time);
  }
   * */

  /**
   * Ir a la Slider previa
   * @private
   */
  async _gotoPreviousSlider() {
    var firstSliderIndex = this.get_first_non_empty_slider_index();
    if (this.isHome) {
      if (this.opts.activeSlider !== firstSliderIndex) {
        await this.active_slider(firstSliderIndex);
      }
    } else {
      if (this.opts.activeSlider > firstSliderIndex) {
        await this.active_slider(firstSliderIndex);
      } else {
        AppStore.home.focus_prev();
      }
    }
    //this._cleanSliders(300);
    //this._cleanSliders(2000);
    return;
  }

  /**
   * Retorna _true_ si al presionar back o home se debe reproducir
   * el ultimo canal sintonizado.
   *
   * @private
   * @param {boolean} [isHomeKeyPressed=false] True si se presiono la tecla home
   * @type {boolean}
   */
  _getCanPlayChannelOnBack(isHomeKeyPressed) {
    if (this.isFirstSlide && this.isHome) {
      if (isHomeKeyPressed) {
        return this._isActiveSliderFirstItem;
      } else {
        return true;
      }
    }
    return false;
  }

  /**
   * Reproducir el contenido del slider activo
   *
   * @param {boolean} playFromTheBegining True para reproducir desde el inicio
   * @return {void}
   */
  async _playContent(playFromTheBegining) {
    //await PlayMng.instance.stopPreviousPlayer();
    const activeSlider = this._getActiveSlider();
    const itemData = activeSlider.opts.data[activeSlider.opts.itemIndex];
    if (!AppStore.appStaticInfo.isTvApp()) {
      return;
    }
    if (activeSlider.opts.type === "channels") {
      activeSlider.opts.channel = itemData;
      if (activeSlider?.playChannelFromUCV) {
        activeSlider?.playChannelFromUCV(playFromTheBegining);
      } else {
        activeSlider?.playChannel(playFromTheBegining);
      }
    } else if (typeof activeSlider?.play === "function") {
      activeSlider.play(playFromTheBegining);
    }
    this.set_prefsActiveSlider(activeSlider);
  }

  _recordContent() {
    const activeSlider = this._getActiveSlider();
    const channel = activeSlider.opts.data[activeSlider.opts.itemIndex];
    if (!AppStore.appStaticInfo.isTvApp()) {
      return;
    }
    activeSlider.opts.channel = channel;
    activeSlider.start_grabacion();
    //this.set_prefsActiveSlider(activeSlider);
  }

  _stopRecordContent() {
    const activeSlider = this._getActiveSlider();
    if (!AppStore.appStaticInfo.isTvApp()) {
      return;
    }
    activeSlider.start_dejardegrabar();
    //this.set_prefsActiveSlider(activeSlider);
  }

  /**
   * Obtener el titulo del Slide activo
   * @private
   * @return {string}
   */
  _getActiveSliderTitle() {
    return this.opts.slidersData[this.opts.activeSlider]?.title;
  }

  /**
   * Obtener el titulo del Slide activo
   * @private
   * @return {string}
   */
  _getActiveSliderType() {
    const item = this.opts.slidersData[this.opts.activeSlider];
    let type = item?.type;
    !type ? (type = item.getType()) : null;
    return type;
  }

  /**
   * Muestra el background completo y detiene el autoplay
   * @private
   */
  _refreshBackground(_stop) {
    if (this.opts.showFanart) BackgroundMng.instance.show_full_background();
    if (_stop) AutoplayMng.instance.autoplay_stop(true);
  }

  /**
   * Obtiene el slider activo
   *
   * @return {any} Slides activo
   * @protected
   */
  _getActiveSlider() {
    return this.opts.sliders[this.opts.activeSlider];
  }

  /**
   * Devuelve True si es el primer item del slide
   * @private
   * @type {boolean}
   */
  get _isActiveSliderFirstItem() {
    return this._getActiveSlider()?.isActiveFirstItem();
  }
}
