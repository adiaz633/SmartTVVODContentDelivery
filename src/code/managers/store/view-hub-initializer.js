import { EpgView } from "@newPath/views/epg/epg";
import { PinView } from "@newPath/views/pin/pin-view";
import { PlayerView } from "src/code/views/player-view/player-view";
import { PopupView } from "src/code/views/popup/popup-view";
import { WizardView } from "@newPath/views/wizard/wizard-view";

import { ViewHub, ViewHubNames } from "./view-hub";

export function viewHubInitializer() {
  ViewHub.inject(ViewHubNames.popup, PopupView);
  ViewHub.inject(ViewHubNames.pin, PinView);
  ViewHub.inject(ViewHubNames.wizard, WizardView);
  ViewHub.inject(ViewHubNames.epg, EpgView);
  ViewHub.inject(ViewHubNames.player, PlayerView);
}
