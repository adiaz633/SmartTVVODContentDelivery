import { viewTypeNames } from "../view-mng";
import { ANY_VIEW, HOME_VIEW } from "./constants";

/**
 * @type {import("./view-transition-mng").TransitionRules}
 */
export const transitionsRules = {
  [ANY_VIEW]: {
    [viewTypeNames.EPG_VIEW]: "showTransition",
    [HOME_VIEW]: "hideTransition",
  },

  [viewTypeNames.SETTINGS_VIEW]: {
    [viewTypeNames.SLIDER_VIEW]: "showTransition",
  },

  [HOME_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "showTransitionIfContentChanged",
  },

  [viewTypeNames.SLIDER_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "showTransitionIfNotPlayerSliders",
  },

  [viewTypeNames.EPG_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "showTransitionIfNotBackgroundChannel",
  },

  [viewTypeNames.DETAILS_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "showTransitionIfNotBackgroundChannel",
  },

  [viewTypeNames.PLAYER_VIEW]: {
    [viewTypeNames.EPG_VIEW]: "showTransitionIfNotBackgroundChannel",
  },

  [viewTypeNames.POPUP_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "hideTransition",
    [viewTypeNames.EPG_VIEW]: "hideTransition",
  },

  [viewTypeNames.PIN_VIEW]: {
    [viewTypeNames.PLAYER_VIEW]: "hideTransition",
    [viewTypeNames.EPG_VIEW]: "hideTransition",
  },

  [viewTypeNames.EXTERNAL_PARTNER_VIEW]: {
    [viewTypeNames.EPG_VIEW]: "hideTransition",
  },

  [viewTypeNames.WIZARD_VIEW]: {
    [viewTypeNames.EPG_VIEW]: "hideTransition",
  },
};
