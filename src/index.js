import { logWidget } from "src/code/js/widgets";
import { StoreInitializer } from "src/code/managers/store/store-initializer";
import { StartMng } from "@tvlib/start-mng";
import { Main } from "@tvMain";

window.$ = window.jQuery = require("jquery");

class App {
  start() {
    logWidget();

    const storeInit = new StoreInitializer();
    storeInit.start();

    Main.initSystem();

    StartMng.instance.onLoad();

    document.body.addEventListener(
      "mouseover",
      (event) => {
        Main.onMouseOver(event);
      },
      true
    );
    document.body.addEventListener(
      "click",
      (event) => {
        Main.onClick(event);
      },
      true
    );
    document.body.addEventListener(
      "unload",
      (event) => {
        Main.onUnload(event);
      },
      true
    );
    document.body.addEventListener(
      "mousewheel",
      (event) => {
        Main.onMouseWheel(event);
      },
      true
    );
  }
}

const app = new App();
app.start();
