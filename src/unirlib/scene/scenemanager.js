import { KeyMng } from "src/code/managers/key-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { scene } from "@unirlib/scene/scene";
import { ykeys } from "@unirlib/scene/ykeys";
import { debug } from "@unirlib/utils/debug";

import { sceneClasses } from "../../sceneClasses";

export const scenemanager = function () {
  this._json_scenes = "{}";
  this._scene_col = null;
  this._lbm = null;
  this._focusedScene = null;
  this._focusedSceneName = "";

  scenemanager.prototype.show = function (key) {
    var html_id = "Scene" + key;
    var divScene = document.getElementById(html_id);
    if (!divScene) {
      divScene = document.createElement("div");
      divScene.id = html_id;
      // Se inserta el nuevo div en el body
      document.body.appendChild(divScene);
      // Se incluye el codigo del html original de la escena en el div del body
      var inst = this;
      $("#" + html_id).load("./app/htmls/" + key + ".html", function () {
        var sc = inst.getScene(key);
        var html_loaded = $("#" + html_id).html().length != 0;
        if (!html_loaded) {
          if (key == "PopErrorScene") AppStore.errors.generateAuxErrorScene(key);
        } else {
          //googleAnalytics.gaTrack(html_id);
          $(document).ready(function () {
            debug.alert("scenemanager.prototype.show FIRST SHOW READY...");
            sc.show();
          });
        }
      });

      document.getElementById(html_id).style.display = "block";
    } else {
      document.getElementById(html_id).style.display = "block";
      var sc = this.getScene(key);
      sc.show();
    }

    if (unirlib.needScaling(key)) {
      if ($(window).height() != 720) {
        var ratio = $(window).height() / 720;
        var tx = ($(window).width() - 1280) / 2 + "px";
        var ty = ($(window).height() - 720) / 2 + "px";
        $("#" + html_id).css("transform", "translate(" + tx + "," + ty + ") scale(" + ratio + ")");
      }
    }

    this.focus(key);
  };

  scenemanager.prototype.hide = function (key) {
    var html_id = "Scene" + key;
    var divScene = document.getElementById(html_id);
    if (divScene != null && divScene != undefined) {
      var sc = this.getScene(key);
      if (sc) {
        sc.hide(key);
        document.getElementById(html_id).style.display = "none";
        this._focusedScene = null;
        this._focusedSceneName = "";
      }
    }
  };

  scenemanager.prototype.focus = function (scene_name) {
    if (this._focusedScene != null) this._focusedScene.handleBlur();
    this._focusedScene = AppStore.sceneManager.get(scene_name);
    this._focusedSceneName = scene_name;
    this.getScene(scene_name).focus();
  };

  scenemanager.prototype.blur = function (scene_name) {
    this._focusedScene.blur();
  };

  scenemanager.prototype.get = function (scene_name) {
    return this.getInstance(scene_name);
  };

  scenemanager.prototype.getFocusedScene = function () {
    return this._focusedScene;
  };

  scenemanager.prototype.getFocusedScenName = function () {
    return this._focusedSceneName;
  };

  scenemanager.prototype.keyDown = function (keyCode) {
    //console.log("sceneManager.prototype.keyDown: " + keyCode);
    if (this._focusedScene != null) this._focusedScene.handleKeyDown(keyCode);
  };

  scenemanager.prototype.onClick = function (srcId) {
    if (this._focusedScene != null && srcId && srcId.indexOf("magic") == -1) this._focusedScene.handleOnClick(srcId);
    else this.mouse_click(srcId);
  };

  scenemanager.prototype.onMouseOver = function (srcId) {
    //console.log("sceneManager.prototype.onMouseOver: " + srcId);
    if (this._focusedScene != null) this._focusedScene.handleOnMouseOver(srcId);
    else this.mouse_over(srcId);
  };

  scenemanager.prototype.onMouseOut = function (srcId) {
    //console.log("sceneManager.prototype.keyDown: " + keyCode);
    if (this._focusedScene != null) this._focusedScene.handleOnMouseOut(srcId);
  };

  scenemanager.prototype.onMouseWheel = function (delta) {
    if (this._focusedScene != null) {
      if (delta > 0) this._focusedScene.handleKeyDown(ykeys.VK_UP);
      else if (delta < 0) this._focusedScene.handleKeyDown(ykeys.VK_DOWN);
    }
  };

  scenemanager.prototype.loadScenes = function () {
    this.readAppFile();
  };

  scenemanager.prototype.readAppFile = function () {
    $.ajaxSetup({ async: true });

    this._json_scenes = sceneClasses;
    this.generateScenes();
  };

  scenemanager.prototype.generateScenes = function () {
    var scs = this._json_scenes;
    if (scs != null && scs.length > 0) this.instantiateScenes();
    else console.log("ERROR: loadScenes ha obtenido un resultado erroneo. Compruebe app.json");
  };

  // Instancia las escenas y guarda las referencias en una coleccion
  scenemanager.prototype.instantiateScenes = function () {
    this._scene_col = [];
    var index = 0;

    while (index < this._json_scenes.length) {
      // Instantiate by Name
      var str_instance = this._json_scenes[index]["name"];
      var win_name = "Scene" + str_instance;
      var instance = new this._json_scenes[index]["class"]();

      if (instance == null || instance == undefined) {
        console.log(
          "scenemanager.prototype.instantiateScenes Instancia " + win_name + " es NULL/UNDEFINED. Incluida en index? "
        );
      } else {
        var sc = new scene();
        sc.set_instance(instance);
        sc.set_key(str_instance);
        sc.set_htmlId(win_name);
        //sc.mostrarSceneConsola();
        this._scene_col.push(sc);
      }

      index++;
    }
    //this.initScenes();
  };

  // Inicializa las escenas en su initialize
  scenemanager.prototype.initScenes = function () {
    var index = 0;
    console.log("COLECCION DE ESCENAS LONGITUD:" + this._scene_col.length);
    while (index < this._scene_col.length) {
      var instance = this._scene_col[index].get_instance();
      if (instance != null) {
        instance.initialize();
      }
      index++;
    }
  };

  // Devuelve referencia a la instancia con el nombre dado.
  scenemanager.prototype.getInstance = function (key) {
    var instance = null;
    var exito = false;
    var index = 0;
    while (!exito && index < this._scene_col.length) {
      var sc = this._scene_col[index];
      exito = sc.get_key() == key;
      if (!exito) index++;
    }
    if (exito) instance = this._scene_col[index].get_instance();

    return instance;
  };

  // Devuelve referencia a la instancia con el nombre dado.
  scenemanager.prototype.getScene = function (key) {
    var sc = null;
    var exito = false;
    var index = 0;

    while (!exito && index < this._scene_col.length) {
      sc = this._scene_col[index];
      exito = sc.get_key() == key;
      if (!exito) index++;
    }
    if (exito) {
      sc = this._scene_col[index];
    }

    return sc;
  };

  scenemanager.prototype.showArrows = function () {};

  scenemanager.prototype.hideArrows = function () {};

  scenemanager.prototype.removeScenes = function () {
    debug.alert("scenemanager.prototype.removeScenes");
    var long = this._scene_col ? this._scene_col.length : 0;
    for (var i = 0; i < long; i++) {
      const sc = this._scene_col[i];
      var key = sc.get_key();
      this.removeScene(key);
    }
  };

  scenemanager.prototype.removeScene = function (key) {
    debug.alert("scenemanager.prototype.removeScene HIDE: " + key);
    var html_id = "Scene" + key;
    $("#" + html_id).remove();
  };

  scenemanager.prototype.mouse_over = function (srcId) {
    // show lateral arrows
    //debug.alert('mouse_over ' + srcId);
  };

  scenemanager.prototype.mouse_click = function (srcId) {
    if (srcId == null || srcId == "") return;

    debug.alert("mouse_click " + srcId);
    switch (srcId) {
      case "magic-left":
        KeyMng.instance.runKeyAction(ykeys.VK_LEFT, true); //left
        break;
      case "magic-right":
        KeyMng.instance.runKeyAction(ykeys.VK_RIGHT, true); //right
        break;
      case "magic-down":
        KeyMng.instance.runKeyAction(ykeys.VK_DOWN, true); //down
        break;
      case "magic-up":
        KeyMng.instance.runKeyAction(ykeys.VK_UP, true); //up
        break;
      case "clickup":
        KeyMng.instance.runKeyAction(ykeys.VK_UP, true); //up
        break;
      case "filters-comp":
        KeyMng.instance.runKeyAction(ykeys.VK_ENTER, true);
    }
  };

  scenemanager.prototype.sceneKeyHandler = function (keyCode) {
    let sceneKeyIsHandled = false;
    try {
      const focusedScene = this.getFocusedScene();
      if (focusedScene) {
        console.info(`sceneKeyHandler: Handled ${keyCode}`);
        sceneKeyIsHandled = true;
        this.keyDown(keyCode);
      }
    } catch (error) {
      console.error(`sceneKeyHandler: ${error.message}`);
    }
    return sceneKeyIsHandled;
  };
};
