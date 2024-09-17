import { Profiler } from "src/code/js/widgets/profiler";
import { StackManager } from "@newPath/managers/audiences/audience-stackMng";
import { AccountMng } from "src/code/managers/backend/account-mng";
import { BackendMng } from "src/code/managers/backend/backend-mng";
import { ChannelsMng } from "@newPath/managers/channels-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { EpgMng } from "@newPath/managers/epg-mng";
import { HdmiMng } from "@newPath/managers/hdmi-mng";
import { M360Mng } from "@newPath/managers/m360/m360-mng";
import { ModalMng } from "src/code/managers/modal-mng";
import { PinMng } from "@newPath/managers/pin-mng";
import { RecordingsMng } from "@newPath/managers/recordings-mng";
import { SettingsMng } from "src/code/managers/settings/settings-mng";
import { AppStore, STORES } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { VolumeMng } from "src/code/managers/volume-mng";
import { MitoAPI } from "@tvlib/MitoAPI";
import { network } from "@tvlib/network";
import { unirlib } from "@unirlib/main/unirlib";
import { scenemanager } from "@unirlib/scene/scenemanager";
import { data } from "@unirlib/server/data";
import { login } from "@unirlib/server/login";
import { playReady } from "@unirlib/server/playReady";
import { profile } from "@unirlib/server/profile";
import { servertime } from "@unirlib/server/servertime";
import { tfnAnalytics } from "@unirlib/server/tfnAnalytics";
import { yPlayerCommon } from "@unirlib/server/yPlayerCommon";
import { lastprofile } from "@unirlib/storage/lastprofile";
import { preferences } from "@unirlib/storage/preferences";
import { ProfileChannelsStorage } from "@unirlib/storage/profileChannelsStorage";
import { error } from "@unirlib/utils/error";
import { fileutils } from "@unirlib/utils/fileutils";

import { TpaMng } from "../3pa-mng";
import { BingeWatching } from "../bingewatching/index";
import { EpMng } from "../ep-mng";
import { PlayMng } from "../play-mng";
import { ajaxResponseErrorSignal } from "../signals";
import { MONITORING } from "src/code/constants/monitoring_constants";

import { NavigationMng } from "../view-mng/view-navigation-mng";
import { homeInitializer } from "./home-initializer";
import { StoreInfo } from "./store-info";
import { viewHubInitializer } from "./view-hub-initializer";

export class StoreInitializer {
  start() {
    this.initializeOthers();

    AppStore.instance.onSet(STORES.device, () => {
      AppStore.Set(STORES.PlayMng, PlayMng.instance);
    });

    AppStore.Set(STORES.ws_data, new data());
    AppStore.Set(STORES.network, new network());
    AppStore.Set(STORES.errors, new error());
    AppStore.Set(STORES.servertime, new servertime());
    AppStore.Set(STORES.fileutils, new fileutils());
    AppStore.Set(STORES.M360Mng, M360Mng.instance);
    AppStore.Set(STORES.bingeWatching, BingeWatching);
    AppStore.Set(STORES.analytics, tfnAnalytics);
    AppStore.Set(STORES.yPlayerCommon, yPlayerCommon);
    AppStore.Set(STORES.EpgMng, EpgMng.instance);
    AppStore.Set(STORES.info, new StoreInfo(AppStore.instance));
    AppStore.Set(STORES.login, new login());
    AppStore.Set(STORES.profile, new profile());
    AppStore.Set(STORES.pinmng, PinMng.instance);
    AppStore.Set(STORES.lastprofile, new lastprofile());
    AppStore.Set(STORES.playReady, new playReady());
    AppStore.Set(STORES.scenemanager, new scenemanager());
    AppStore.Set(STORES.appProfiler, new Profiler());
    AppStore.Set(STORES.profileChannels, new ProfileChannelsStorage());

    AppStore.Set(STORES.VolumeMng, VolumeMng.instance);
    AppStore.Set(STORES.SettingsMng, SettingsMng.instance);
    AppStore.Set(STORES.HdmiMng, HdmiMng.instance);
    AppStore.sceneManager.loadScenes();

    AppStore.Set(STORES.controlparental, ControlParentalMng.instance);
    AppStore.Set(STORES.RecordingsMng, RecordingsMng.instance);
    AppStore.Set(STORES.channelsMng, ChannelsMng.instance);

    AppStore.Set(STORES.EpMng, EpMng.instance);
    AppStore.Set(STORES.TpaMng, TpaMng.instance);

    AppStore.Set(STORES.StackManager, StackManager.instance);

    const prefs = new preferences();
    prefs.readPreferences();
    AppStore.Set(STORES.preferences, prefs);

    this.initializeSignals();
  }

  /**
   * Inicializaciones de objetos que no requieren estar en el store pero si se
   * necesita la inicializacion e inyeccion de dependencias
   */
  initializeOthers() {
    viewHubInitializer();
    // Initialize home
    homeInitializer(AppStore, STORES);
    // Initialize account mng
    AccountMng.instance.init(BackendMng.instance, MitoAPI.instance);

    EpgMng.instance.unirlib = unirlib;

    ViewMng.instance.routes = new NavigationMng(unirlib);
    ViewMng.instance.modals = ModalMng.instance;
  }

  /**
   * Inicializar las escuchas de las señales generales
   */
  initializeSignals() {
    const { HTTP_STATUS, MONITORING_TYPE } = MONITORING;
    ajaxResponseErrorSignal.on((signal) => {
      const data = { message: "", ...signal.data };
      const { status, statusText, isPop, url } = data;
      const urlError = data.urlError || url;
      const message = data.message || statusText;
      const isTimeout = message.includes("timeout");
      const httpStatus = isTimeout ? HTTP_STATUS.TIMEOUT : status;
      AppStore.tfnAnalytics.monitoring(MONITORING_TYPE.CSCErrorEvent, {
        evt: 72,
        url: url,
        urlError,
        error: httpStatus,
        tse: Date.now(),
      });

      AppStore.tfnAnalytics.monitoring(MONITORING_TYPE.NavErrorEvent, {
        evt: 74,
        scu: url || urlError,
        sreco: status,
        srete: statusText,
        isPop: isPop,
        urlError,
        message: message,
        tse: Date.now(),
      });
    });
  }
}
