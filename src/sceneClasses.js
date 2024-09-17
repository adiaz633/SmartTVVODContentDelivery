import { SceneConfigScene } from "./app/scenes/ConfigScene.js";
import { SceneEpgScene } from "./app/scenes/EpgScene.js";
import { ScenePopAvisoScene } from "./app/scenes/PopAvisoScene.js";
import { ScenePopCondicionesScene } from "./app/scenes/PopCondicionesScene.js";
import { ScenePopConfirmarScene } from "./app/scenes/PopConfirmarScene.js";
import { ScenePopErrorScene } from "./app/scenes/PopErrorScene.js";
import { ScenePopExitScene } from "./app/scenes/PopExitScene.js";
import { ScenePopKbScene } from "./app/scenes/PopKbScene.js";
import { ScenePopLoginScene } from "./app/scenes/PopLoginScene.js";
import { ScenePopLogoutScene } from "./app/scenes/PopLogoutScene.js";
import { ScenePopOfertaScene } from "./app/scenes/PopOfertaScene.js";
import { ScenePopParentalScene } from "./app/scenes/PopParentalScene.js";
import { ScenePopRegistrarScene } from "./app/scenes/PopRegistrarScene.js";
import { ScenePopSuscripcionScene } from "./app/scenes/PopSuscripcionScene.js";
import { ScenePopTimezoneScene } from "./app/scenes/PopTimezoneScene.js";
import { SceneSplashScene } from "./app/scenes/SplashScene.js";

export const sceneClasses = [
  { name: "EpgScene", class: SceneEpgScene },
  { name: "PopAvisoScene", class: ScenePopAvisoScene },
  { name: "PopCondicionesScene", class: ScenePopCondicionesScene },
  { name: "PopConfirmarScene", class: ScenePopConfirmarScene },
  { name: "ConfigScene", class: SceneConfigScene },
  { name: "PopOfertaScene", class: ScenePopOfertaScene },
  { name: "PopLoginScene", class: ScenePopLoginScene },
  { name: "PopKbScene", class: ScenePopKbScene },
  { name: "PopLogoutScene", class: ScenePopLogoutScene },
  { name: "PopParentalScene", class: ScenePopParentalScene },
  { name: "PopErrorScene", class: ScenePopErrorScene },
  { name: "SplashScene", class: SceneSplashScene },
  { name: "PopRegistrarScene", class: ScenePopRegistrarScene },
  { name: "PopTimezoneScene", class: ScenePopTimezoneScene },
  { name: "PopExitScene", class: ScenePopExitScene },
  { name: "PopSuscripcionScene", class: ScenePopSuscripcionScene },
];
