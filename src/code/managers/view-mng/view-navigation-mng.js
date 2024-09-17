/* istanbul ignore file */

import { AppStore } from "src/code/managers/store/app-store";

import { DialMng } from "../dial-mng";
import { IgnoreIfViewAnnotation } from "./view-mng-utils";
import { viewTypeNames } from "./view-type-names";

/**
 * TODO: Mover hacia app o algun start
 */
export class NavigationMng {
  constructor(unirlib) {
    this.unirlib = unirlib;
    // Annotations
    this.EpgScene = IgnoreIfViewAnnotation(this.EpgScene, viewTypeNames.EPG_VIEW, this);
  }

  BuscarScene() {
    AppStore.home.load_search_view();
  }

  /**
   * @IgnoreIfViewAnnotation
   */
  EpgScene() {
    AppStore.home.loadEPGwithRemoteControl();
  }

  SettingsLocalesScene() {
    AppStore.home.load_settings("ajustes-locales");
  }

  SettingsScene() {
    AppStore.home.load_settings("ajustes");
  }

  ProfileScene() {
    this.unirlib.loadUserProfiles("HomeScene");
  }

  SearchScene() {
    AppStore.home.loadSearchWithRemoteControl();
  }

  ChannelScene(channel) {
    DialMng.instance.dial(channel);
  }

  /**
   * Ir a la vista de home.
   */
  async HomeScene() {
    if (this.unirlib.isEmergencyMode()) {
      await AppStore.home.show_home();
    } else {
      AppStore.home.focus_home();
    }
  }

  other(sceneName) {
    console.warn(`NavigationMng: Legacy scene detected: "${sceneName}"`);
    AppStore.sceneManager.show(sceneName);
    AppStore.sceneManager.focus(sceneName);
    if (sceneName == "PopLoginScene") {
      // TODO: Pasar a popLoginScene
      AppStore.tfnAnalytics.setConfigSection("Login");
      AppStore.sceneManager.get("PopLoginScene").setOriginScene(null);
    } else {
      AppStore.tfnAnalytics.tfnTrack(sceneName);
    }
  }
}
