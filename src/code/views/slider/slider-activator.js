import { appConfig } from "@appConfig";
//import { promoAvailables } from "@newPath/comonents/promo/promo-actions.js";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { HomeMng } from "src/code/managers/home-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { MagicMng } from "@newPath/managers/magic-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewActivator } from "src/code/managers/view-mng/view-activator";

//import { unirlib } from "@unirlib/main/unirlib";
import { SliderState } from "./slider-state";

export class SliderViewActivator extends ViewActivator {
  constructor(baseView) {
    super(baseView);
  }

  /**
   *
   * @param {import("./slider").SliderView} target
   * @param {any} originalMethod
   */
  async activate(target, originalMethod) {
    await originalMethod();
    DialMng.instance.hide(0);
    if (target.opts.showFanart) {
      BackgroundMng.instance.show_background();
    } else {
      BackgroundMng.instance.set_bg_invisible();
    }
    if (target.isHome) {
      await this._activateHome(target);
    } else {
      await this._activateSlider(target);
    }
    HomeMng.instance.show();
    await _reloadSliderBodyBgImage(target);
    this._postActivateSlider(target);
  }

  _postActivateSlider(target) {
    switch (target.getSectionRef()) {
      case "U7D": {
        this._postActivateSlider_U7D();
        break;
      }

      default:
        break;
    }
  }

  _postActivateSlider_U7D() {
    AppStore.RecordingsMng.refreshRecordingsIds();
  }

  /**
   * @param {SliderView} target
   */
  async deactivate(target, originalMethod) {
    SliderState.instance.save(target);
    await target.checkPlayerSliders();
    await originalMethod();
    if (target.isHome) {
      target.stopBillboard();
    }
  }

  /**
   * @private
   * @param {SliderView} sliderView
   */
  async _activateSlider(_sliderView) {
    // Activate simple slider
    _sliderView.active_slider(_sliderView.opts.activeSlider);
  }

  /**
   * @private
   * @param {SliderView} homeView
   */
  async _activateHome(homeView) {
    if (homeView?.isHome && homeView?.opts?.activeSlider === 0 && AutoplayMng.instance.isAutoplayPromo()) {
      return homeView.active_slider(homeView.opts.activeSlider, "backAutoplayPromo");
    }
    _reloadFanArt(homeView);
    homeView.startBillboard();
    if (!homeView.opts.checkEnablers) {
      homeView.opts.checkEnablers = true;
    } else homeView.refreshEnablers();
    LoaderMng.instance.hide_loader();
    MagicMng.instance.hide_magic();

    // const { sliders, activeSlider } = homeView.opts;
    // const slider = sliders[activeSlider];
    // if (slider) {
    //   slider.endMove();
    // }

    if (!SliderState.instance.restore(homeView)) {
      homeView.active_slider(homeView.opts.activeSlider);
    }
  }
}

/**
 * @param {SliderView} homeView
 */
/*
async function _refreshBillboard(homeView) {
  try {
    let promoList;
    const { data: response } = await unirlib.updatePromos().promise;

    const updatedPromos = response.Portada.Carrusel;
    for (const i in updatedPromos) {
      if (updatedPromos[i]["@tipo"] === "carrusel_promociones") {
        promoList = await promoAvailables(updatedPromos[i].Promocion);
        break;
      }
    }

    // @type {import("../../components/promo/promo").Promo}
    const element = homeView.opts.sliders[0];
    if (!element) {
      return;
    }

    //Comparacion datos servicio
    if (promoList.length != element.opts.data.length) {
      element.deleteAndRefresh(promoList);
    }
    for (const i in promoList) {
      if (promoList[i]["@url_imagen"] != element.opts.data[i]["@url_imagen"]) {
        element.deleteAndRefresh(promoList);
        break;
      }
    }
  } catch (error) {
    console.warn("sliderActivator._refreshBillboard:error", error);
  }
}
 * */

/**
 * @param {SliderView} sliderView
 */
async function _reloadSliderBodyBgImage(sliderView) {
  const actual_bg_image = BackgroundMng.instance.get_background_image();
  const no_actual = actual_bg_image == "none";

  if (sliderView.isHome) {
    const sliderIndexImage = sliderView.opts.activeSlider == 1 ? 0 : sliderView.opts.activeSlider;
    const element = sliderView.opts.sliders[sliderIndexImage];
    if (typeof element?.get_bg_image !== "function") {
      return;
    }

    const index = element.get_index();
    const slider_image = element.get_bg_image(index);

    if (no_actual || slider_image === undefined || actual_bg_image.search(slider_image) == -1) {
      const [pase] = element.opts.data[index]?.Pases || [];
      if (!pase || ControlParentalMng.instance.isContentAllowed(pase)) {
        BackgroundMng.instance.load_bg_image(slider_image, false);
        ControlParentalMng.instance.hideNotAllowed();
        element.opts.itemsDesc?.removeClass("disabled");
      } else {
        BackgroundMng.instance.set_bg_black();
        ControlParentalMng.instance.showNotAllowed();
        element.opts.itemsDesc?.addClass("disabled");
      }
    }
  } else {
    const element = sliderView.opts.sliders[sliderView.opts.activeSlider];
    if (typeof element?.get_bg_image !== "function") {
      return;
    }
    const index = element.get_index();
    const slider_image = element.get_bg_image(index);
    if (no_actual || slider_image === undefined || actual_bg_image.search(slider_image) == -1) {
      BackgroundMng.instance.load_bg_image(slider_image, false);
    }
  }
}

/**
 *
 * @param {SliderView} homeView
 */
function _reloadFanArt(homeView) {
  if (BackgroundMng.instance.reload_fanart) {
    const data = homeView.opts.orig_data;
    const index = parseInt(
      data[homeView.opts.activeSlider].wrap[0].querySelectorAll(".item.active")[0].dataset.itemIndex
    );
    const datosEditoriales = data[homeView.opts.activeSlider].data[index].DatosEditoriales;
    BackgroundMng.instance.load_bg_image(_getImageFrom(datosEditoriales, "fanart"), false);
  }
}

// TODO: Si datos editoriales es una clase podria ir alli
export function _getImageFrom(datosEditoriales, id) {
  if (!appConfig.SHOW_IMAGES || !datosEditoriales?.Imagenes) {
    return null;
  }

  for (const i in datosEditoriales.Imagenes) {
    if (datosEditoriales.Imagenes[i].id == id) {
      return datosEditoriales.Imagenes[i].uri;
    }
  }
  return null;
}

/** @typedef {import("./slider").SliderView} SliderView */
