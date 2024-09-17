"use strict";
import "@newPath/components/keyboard/keyboard.css";

import * as keyboards from "@newPath/components/keyboard/keyboardsType.json";
import { BackendMng } from "src/code/managers/backend/backend-mng";
import { KeyMng } from "src/code/managers/key-mng/index";
import { FOCUS_KEYBOARD_BOTON_ID } from "@newPath/managers/pin/pin-constants";
import { AppStore } from "src/code/managers/store/app-store";
import { BaseComponent } from "src/code/views/base-component";
import { Main } from "@tvMain";
import i18next from "i18next";

export class KeyboardComponent extends BaseComponent {
  constructor(wrap, eventBus, isPinMng = false) {
    super(wrap);
    this.opts = {
      wrap, // contiene la referencia al wrapper donde está montada la vista del teclado
      eventBus,
      tpl: {
        span_cursor: `<span class="search-tv__inputCursor">|</span>`,
        key_security: `<div class="key key_security" value="encrypted"></div>`,
      },
      focus: null,
      checkPin: false,
      newPin: false,
      maxCharacters: 40,
      isCreatingProfile: false,
      isPinMng,
    };

    this.rows = []; // nodelist de las filas del teclado
    this.rowKeys = [];
    this.keys = []; // contiene cada capa de teclas
    this.altKeys = [];
    this.inputs = [];
    this.input = 0;
    this.keyInicial = 0; // contiene el índice del array de la tecla que tendrá en la PRIMERA CARGA para colocar el foco
    this.row_actual = 0; // contiene el número de la fila actual sobre la que se encuentra posicionado el foco
    this.alt_key_actual = 0; // contiene el índice del array de la tecla actual sobre la que se encuentra posicionado el foco
    this.panel_actual = 0; // contiene el índice del panel actual sobre la que se encuentra posicionado el foco
    this.teclaPulsada = null;
    this.keyboard = null;
    this.uppercase = null; // indicamos si el teclado está en mayúsculas
    this.text = "";
    this.enableButton = true;
    this.button = null;
    this.shift = false;
    this.inputNumber = 1;
    this.pinType = "";
    this.tipoAccion = "";
    this.kbClass = "";
    this.isSTB = null;
    this.isCircular = false; // indicamos si tiene navegación circular en las filas del teclado (izq-der)
    this.isEncrypted = false; // el valor del texto pertenece a una red cifrada (password)
    this.showTextEncrypted = false; // muestra o encripta el texto si pertenece a un valor cifrado
  }

  createInputKb(refresh) {
    this.input = 0;
    if (refresh) this.text = "";
    let inputDiv;
    if (!refresh) {
      inputDiv = document.createElement("div");
      inputDiv.classList.add("input_kb_wrap");
      inputDiv.setAttribute("id", "input_kb_wrap");
      document.getElementById(this.keyboard.id).appendChild(inputDiv);
    } else {
      inputDiv = document.querySelector("#input_kb_wrap");
    }
    let input = ``;
    if (this.inputNumber > 1) {
      input += `<div class="user-pin-key" id="user-pin-key-wrap">`;
      for (let i = 0; i < this.inputNumber; i++) {
        input += `<div class="user-pin-key__li"><input class="user-pin-key__input" type="password"></div>`;
      }
      input += `</div>`;
    } else if (this.inputNumber === 1) {
      input += `<div id="input-text" class="input-text" dir="rtl">
      <span id="span_input"><bdi></bdi><span class="search-tv__inputCursor">|</span></span>
    </div>`;
    }
    inputDiv.innerHTML = input;
    if (this.inputNumber > 1) {
      this.inputs = document.querySelectorAll(".user-pin-key__input");
      if (this.kbClass === "pin" && this.isSTB) {
        this.inputs[this.input].classList.add("active");
      }
    } else if (this.inputNumber === 1) {
      this.inputs = document.querySelector("#span_input");
      if (this.isEncrypted) document.querySelector("#span_input").classList.add("encrypted");
      this.inputs.innerHTML = this.text + this.opts.tpl.span_cursor;
    }
  }

  createKbPanel(refresh = false) {
    const panelInfo = this.keyboard.panels[this.panel_actual];
    let kbPanel = "";
    let hasAlt = "";
    let hasSwitchRow = false;
    if (this.keyboard.panels.length > 1) {
      hasSwitchRow = true;
      kbPanel += '<div class="kb_row switch_row">';
      for (let i = 0; i < this.keyboard.panels.length; i++) {
        kbPanel +=
          '<div class="key key_ext' +
          (i === this.panel_actual ? " selected" : "") +
          '" value="' +
          i +
          '">' +
          this.keyboard.panels[i].symbol +
          "</div>";
      }
      kbPanel += "</div>";
    }
    for (let i = 0; i < panelInfo.rows.length; i++) {
      kbPanel += '<div class="kb_row">';
      for (let j = 0; j < panelInfo.rows[i].keys.length; j++) {
        switch (panelInfo.rows[i].keys[j].value) {
          case "espacio":
            kbPanel += '<div class="key keyx3 space" value="space"><span>ESPACIO</span></div>';
            break;
          case "borrar":
            kbPanel += '<div class="key icon icon-kbdel" value="delete"></div>';
            break;
          case "shift":
            kbPanel += '<div class="key shift" value="shift"></div>';
            break;
          default:
            var altKey = "";
            if (panelInfo.rows[i].keys[j].alt) {
              altKey = " has_alt";
              hasAlt += '<div class="alt_row">';
              for (let h = 0; h < panelInfo.rows[i].keys[j].alt.length; h++) {
                var value = panelInfo.rows[i].keys[j].alt[h].value;
                if (value === "shift") {
                  hasAlt += '<div class="key" value="' + value + '"></div>';
                } else {
                  if (this.uppercase && h !== 1) {
                    value = value.toUpperCase();
                  } else if (!this.uppercase && h === 1) {
                    value = value.toUpperCase();
                  }
                  hasAlt += '<div class="key" value="' + value + '">' + value + "</div>";
                }
              }
              hasAlt += "</div>";
            }
            var value = panelInfo.rows[i].keys[j].value;
            if (this.uppercase) {
              value = value.toUpperCase();
            }
            kbPanel += '<div class="key' + altKey + '" value="' + value + '">' + value + "</div>";
            // Posicionamos el foco en la letra indicada.
            if (!refresh && panelInfo.rows[i].keys[j].foco) {
              this.row_actual = i;
              this.keyInicial = j;
              // this.setKeyActual(j, this.row_actual);
              if (hasSwitchRow) this.row_actual++;
            }
            break;
        }
      }
      kbPanel += "</div>";
      if (hasAlt !== "") {
        kbPanel += `<div class="kb_row alt_wrap ${this.shift ? "shift" : ""}">`;
        kbPanel += hasAlt;
        kbPanel += "</div>";
      }
    }
    return kbPanel;
  }

  /**
   * @name getKeyActual
   * @param {number} rowIndex Indice de la ROW a recuperar su keyActual
   */
  getKeyActual(rowIndex) {
    rowIndex = typeof rowIndex === "undefined" ? this.row_actual : rowIndex;
    var keyActual = 0;
    if (this.kbClass === "pin") {
      keyActual = this.keys.keyActual;
    } else {
      // si estamos en la row 3 (ALT), guardamos el valor de la row anterior.
      if (rowIndex === 3) {
        keyActual = this.keys[rowIndex - 1].keyActual !== undefined ? this.keys[rowIndex - 1].keyActual : 0;
      } else {
        keyActual = this.keys[rowIndex].keyActual !== undefined ? this.keys[rowIndex].keyActual : 0;
      }
    }
    return keyActual;
  }

  /**
   * @name setKeyActual
   * @description Función para actualizar el valor de keyActual dentro de cada fila
   * @param {number} keyIndex Indice de la tecla (KEY) actual
   * @param {number} rowIndex Indice de la ROW que queremos actualizar su keyActual
   */
  setKeyActual(keyIndex, rowIndex) {
    rowIndex = typeof rowIndex === "undefined" ? this.row_actual : rowIndex;
    if (this.kbClass === "pin") {
      this.keys.keyActual = keyIndex;
    } else {
      this.keys[rowIndex].keyActual = keyIndex;
    }
  }

  setAltVisible(refresh) {
    const rowActual = refresh ? this.row_actual - 1 : this.row_actual;
    const keyActual = this.getKeyActual(rowActual);
    this.altKeys[0][keyActual].classList.add("selected");
    this.altKeys[0][keyActual].style.left =
      this.keys[rowActual][keyActual].offsetLeft + this.keys[rowActual][keyActual].offsetWidth / 2 + "px";
  }

  removeAltVisible() {
    this.altKeys[0][this.getKeyActual()].classList.remove("selected");
  }

  setAltActive() {
    this.keys[this.row_actual][this.getKeyActual()][this.alt_key_actual].classList.add("activo");
  }

  removeAltActive() {
    this.keys[this.row_actual][this.getKeyActual()][this.alt_key_actual].classList.remove("activo");
  }

  setActive() {
    this.keys[this.row_actual][this.getKeyActual()].classList.add("activo");
    if (this.keys[this.row_actual][this.getKeyActual()].classList.contains("has_alt")) {
      this.setAltVisible();
    }
  }

  removeActive() {
    this.keys[this.row_actual][this.getKeyActual()].classList.remove("activo");
  }

  setButtonActive() {
    this.enableButton = true;
    this.button.classList.remove("disabled");
  }

  removeButtonActive() {
    this.enableButton = false;
    this.button.classList.remove("active");
    this.button.classList.add("disabled");
  }

  focusButton() {
    this.button.classList.add("active");
    this.opts.focus = "button";
  }

  createKb(refresh, keepKeyActual) {
    keepKeyActual = typeof keepKeyActual === "undefined" ? true : keepKeyActual;

    var keysOld = this.keys;
    this.opts.focus = "keyboard";
    this.keys = [];
    this.altKeys = [];
    let kbDiv;
    // Nos traemos del json el teclado del tipo requerido.
    if (!refresh) {
      kbDiv = document.createElement("div");
      kbDiv.classList.add("kb_wrap");
    } else {
      kbDiv = document.getElementById(this.keyboard.id).querySelector(".kb_wrap");
    }
    kbDiv.innerHTML = this.createKbPanel(refresh);

    if (!refresh) {
      document.getElementById(this.keyboard.id).appendChild(kbDiv);
    }

    if (this.isEncrypted) {
      document.querySelector(".kb_row").insertAdjacentHTML("beforeend", this.opts.tpl.key_security);
    }

    // Inicialización
    // Almacenamos el array de las filas del teclado
    this.rows = document.querySelectorAll(".kb_row");
    // Almacenamos los arrays de las disitintas filas en un unico array
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rows[i].classList.contains("alt_wrap")) {
        this.rowAlt = this.rows[i].querySelectorAll(".alt_row");
        this.altKeys.push(this.rowAlt);
        this.keys.push([]);
        for (let j = 0; j < this.altKeys[0].length; j++) {
          this.rowKeys = this.altKeys[0][j].querySelectorAll(".key");
          this.keys[i].push(this.rowKeys);
        }
      } else {
        this.rowKeys = this.rows[i].querySelectorAll(".key");
        this.keys.push(this.rowKeys);
      }
      // Mantenemos la memoria del keyActual si procede
      if ((i === 0 || keepKeyActual) && keysOld[i]?.keyActual !== undefined)
        this.keys[i].keyActual = keysOld[i].keyActual;
    }
    // Posicionamos el foco en la letra inicial recogida del Template
    if (!refresh) {
      this.setKeyActual(0, 0); // Guardamos la pestaña seleccionada inicialmente
      this.setKeyActual(this.keyInicial); // Guardamos el keyInicial recogido del del template
    }

    if (this.typeOfRow(this.row_actual) === "altRow") {
      this.setAltVisible(refresh);
      this.setAltActive();
    } else {
      this.setActive();
    }
  }

  createPinErrorMessage() {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("text");
    errorDiv.setAttribute("id", "wrap-error-msg");
    errorDiv.innerHTML = `<p class="titulo" id="kb-modal-msg-title"></p>
      <p class="descripcion" id="kb-modal-msg"></p>`;
    document.getElementById(this.keyboard.id).appendChild(errorDiv);
    document.getElementById("kb-modal-msg-title").innerHTML = i18next.t("settings.pin_incorrecto");
    document.getElementById("kb-modal-msg").innerHTML = i18next.t("settings.vuelve_intentarlo");
  }

  createButtonKb(textButton = null) {
    const textBt = textButton || i18next.t("aceptar");
    const buttonDiv = document.createElement("div");
    buttonDiv.classList.add("button_kb_wrap");
    buttonDiv.innerHTML = `<div class="buttons" id="TecladoPopupBotonesWrapper">
        <div class="button" id="boton0">
        <span class="button-text">${textBt}</span>
        </div>
      </div>`;
    document.getElementById(this.keyboard.id).appendChild(buttonDiv);
    this.button = document.querySelector("#boton0");
    if (this.inputNumber > 1) {
      this.removeButtonActive();
    }
    if (!this.keyboard.panels) {
      this.focusButton();
    }
  }

  init(keyboardInfo) {
    this.isSTB = AppStore.appStaticInfo.getTVModelName() === "iptv2";
    //this.isSTB = false;
    if (keyboardInfo.isEncrypted) {
      this.isEncrypted = this.showTextEncrypted = keyboardInfo.isEncrypted;
    }
    this.kbClass = keyboardInfo.class;
    const kb = keyboards;
    this.keyboard = kb.keyboards[this.kbClass];
    this.uppercase = this.keyboard.mayInic;
    this.inputNumber = this.kbClass === "pin" ? 4 : 1;
    this.opts.checkPin = keyboardInfo.checkPin;
    this.opts.newPin = keyboardInfo.newPin;
    if (keyboardInfo.maxCharacters) this.opts.maxCharacters = keyboardInfo.maxCharacters;
    this.pinType = keyboardInfo.pinType;
    this.tipoAccion = keyboardInfo.id;
    if (this.tipoAccion === "nombrardispositivo") {
      keyboardInfo.inputText =
        keyboardInfo.values || keyboardInfo.itemValue.friendlyName || keyboardInfo.itemValue.deviceName;
      this.setmaxCharacterValue();
    }
    if (keyboardInfo.inputText && keyboardInfo.inputText !== "") {
      this.text = keyboardInfo.inputText;
      this.uppercase = false;
    }
    // Creamos elemento wrapper del teclado y lo añadimos al wrapper que nos llega
    var wrapperTeclado = document.createElement("div");
    wrapperTeclado.classList.add(this.keyboard.class);
    wrapperTeclado.setAttribute("id", this.keyboard.id);
    this.opts.wrap.append(wrapperTeclado);
    if (this.inputNumber > 0) {
      this.createInputKb();
    }
    if (this.kbClass === "pin") {
      this.createPinErrorMessage();
    }
    if (!(this.kbClass === "pin" && this.isSTB) && this.keyboard.panels) {
      this.createKb(false);
    }
    if (!(this.kbClass === "pin" && this.isSTB) && this.inputNumber > 0) {
      const textButton = keyboardInfo?.textButton || null;
      this.createButtonKb(textButton);
    }
  }

  focus() {
    this.opts.eventBus.emit("keyboard-setfocus", { type: "focus" });
  }

  unfocus() {
    this.opts.eventBus.emit("keyboard-setfocus", { type: "unfocus" });
  }

  async setmaxCharacterValue() {
    this.opts.maxCharacters = parseInt(await BackendMng.instance.getContextParam("maxLongDispo"));
  }

  typeOfRow(row) {
    let rowType;
    if (this.keys[row][0].length > 1) {
      rowType = "altRow";
    } else if (this.keys[row][0].classList.contains("has_alt")) {
      rowType = "hasAlt";
    } else if (this.rows[row].classList.contains("switch_row")) {
      rowType = "switchRow";
    }
    return rowType;
  }

  changeRow(prevRow, newRow) {
    if (this.typeOfRow(prevRow) === "altRow") {
      this.removeAltActive();
      this.row_actual = newRow;
      this.setActive();
    } else if (this.typeOfRow(newRow) === "altRow") {
      this.removeActive();
      this.row_actual = newRow;
      this.alt_key_actual = 0;
      this.setAltActive();
    } else {
      if (this.typeOfRow(prevRow) === "hasAlt" && this.typeOfRow(newRow) !== "altRow") {
        this.removeAltVisible();
      }
      this.removeActive();
      this.row_actual = newRow;
      this.setActive();
    }
  }

  goUp() {
    if (this.keys.length <= this.row_actual) return;
    if (this.opts.focus === "keyboard") {
      if (this.row_actual > 0) {
        this.changeRow(this.row_actual, this.row_actual - 1);
      } else if (this.enableButton) {
        this.removeActive();
        this.focusButton();
      }
    } else {
      if (this.keyboard.panels) {
        this.button.classList.remove("active");
        this.opts.focus = "keyboard";
        this.row_actual = this.rows.length - 1;
        if (this.typeOfRow(this.row_actual) === "altRow") {
          this.row_actual -= 1;
        }
        this.setActive();
      }
    }
  }

  goDown() {
    if (this.keys.length <= this.row_actual) return;
    if (this.opts.focus === "keyboard") {
      if (this.row_actual < this.rows.length - 1) {
        this.changeRow(this.row_actual, this.row_actual + 1);
      } else if (this.enableButton) {
        if (this.typeOfRow(this.row_actual) === "altRow") {
          this.removeAltActive();
          this.removeAltVisible();
        } else {
          this.removeActive();
        }
        this.focusButton();
      }
    } else {
      if (this.keyboard.panels) {
        if (this.button) {
          this.button.classList.remove("active");
        }
        this.opts.focus = "keyboard";
        this.row_actual = 0;
        this.setKeyActual(0);
        this.setActive();
      }
    }
  }

  deleteInputValue() {
    const input = this.input >= this.inputs.length ? this.input - 1 : this.input;
    this.inputs[input].value = "";
    this.inputs[input].classList.remove("active");
    this.input -= 1;
    this.inputs[this.input].classList.add("active");
    this.inputs[this.input].value = "";
    this.text = this.text.substring(0, this.text.length - 1);
  }

  goLeft() {
    if (this.kbClass === "pin" && this.isSTB) {
      if (this.inputNumber > 1 && this.input > 0) {
        this.deleteInputValue();
      }
    } else {
      if (this.opts.focus === "keyboard") {
        if (this.typeOfRow(this.row_actual) === "altRow") {
          if (!(this.alt_key_actual === 0 && !this.isCircular)) {
            this.removeAltActive();
            if (this.alt_key_actual === 0) {
              if (!KeyMng.instance.getPulsacionLarga()) {
                this.alt_key_actual = this.keys[this.row_actual][this.getKeyActual()].length - 1;
              }
            } else {
              this.alt_key_actual--;
            }
            this.setAltActive();
          }
        } else {
          if (!(this.getKeyActual() === 0 && !this.isCircular)) {
            this.removeActive();
            if (this.typeOfRow(this.row_actual) === "hasAlt") {
              this.removeAltVisible();
            }
            if (this.getKeyActual() === 0 && this.isCircular) {
              if (!KeyMng.instance.getPulsacionLarga()) {
                this.setKeyActual(this.keys[this.row_actual].length - 1);
              }
            } else {
              this.setKeyActual(this.getKeyActual() - 1);
            }
            this.setActive();
          }
        }
      }
    }
  }

  goRight() {
    if (this.opts.focus === "keyboard") {
      if (this.typeOfRow(this.row_actual) === "altRow") {
        if (!(this.alt_key_actual === this.keys[this.row_actual][this.getKeyActual()].length - 1 && !this.isCircular)) {
          this.removeAltActive();
          if (this.alt_key_actual === this.keys[this.row_actual][this.getKeyActual()].length - 1) {
            if (!KeyMng.instance.getPulsacionLarga()) {
              this.alt_key_actual = 0;
            }
          } else {
            this.alt_key_actual++;
          }
          this.setAltActive();
        }
      } else {
        if (!(this.getKeyActual() === this.keys[this.row_actual].length - 1 && !this.isCircular)) {
          this.removeActive();
          if (this.typeOfRow(this.row_actual) === "hasAlt") {
            this.removeAltVisible();
          }
          if (this.getKeyActual() === this.keys[this.row_actual].length - 1) {
            if (!KeyMng.instance.getPulsacionLarga()) {
              this.setKeyActual(0);
            }
          } else {
            this.setKeyActual(this.getKeyActual() + 1);
          }
          this.setActive();
        }
      }
    }
  }

  cambiaOrdenTeclado() {
    this.uppercase = !this.uppercase;
    this.createKb(true);
  }

  insertar_valor_busqueda(valor) {
    let inputValor;
    const selector = this.inputs instanceof Element && this.inputs.querySelector("bdi");
    if (this.isEncrypted && this.showTextEncrypted) {
      inputValor = `${valor.replace(/[a-zA-Z0-9_\-.#@¿?[\]^]/g, "&#x2022;")}`;
    } else {
      inputValor = `${valor.replace(/\s/g, "&nbsp;")}`;
    }
    if (selector) {
      this.inputs.querySelector("bdi").innerHTML = inputValor;
    } else {
      //TODO: considerar si aquí no incluir <bdi> ni cursor; parece innecesario, pero lo dejo como estaba.
      this.inputs.innerHTML = "<bdi>" + inputValor + "</bdi>" + this.opts.tpl.span_cursor;
    }
  }

  toggleSelected() {
    document.querySelector(".switch_row .selected").classList.remove("selected");
    this.keys[this.row_actual][this.getKeyActual()].classList.add("selected");
  }

  /**
   * @method
   * @name toggleEncryptedText
   * @description Muestra/Oculta el texto encriptado en el input
   *
   */
  toggleEncryptedText() {
    const keySecurityWrap = document.querySelector(".switch_row .key_security");
    if (keySecurityWrap.classList.contains("off")) {
      keySecurityWrap.classList.remove("off");
      this.inputs.classList.add("encrypted");
      this.showTextEncrypted = true;
    } else {
      keySecurityWrap.classList.add("off");
      this.inputs.classList.remove("encrypted");
      this.showTextEncrypted = false;
    }
    this.insertar_valor_busqueda(this.text);
  }

  goKey(keyCode) {
    const num = keyCode - 48;
    if (this.kbClass === "pin" && this.isSTB && num > -1 && num < 10) {
      this.clearMsgError();
      this.clearInputError();
      if (this.input < this.inputs.length) {
        this.inputs[this.input].classList.remove("active");
        this.text += num.toString();
        this.inputs[this.input].value = num.toString();
        this.input += 1;
        if (this.input >= this.inputs.length) {
          this.clickButton();
        } else {
          this.inputs[this.input].classList.add("active");
        }
      }
    } else {
      if (parseInt(this.text.length + num.toString().length) < this.opts.maxCharacters) {
        this.text += num;
        this.insertar_valor_busqueda(this.text);
      }
    }
    /*if (this.opts.class === "ip") {
      if (this.opts.lastPressed === null || (this.opts.lastPressed && this.opts.lastPressed !== this.opts.focused)) {
        this.opts.ip_items[this.opts.focused].textContent = keyCode - 48;
      } else {
        const len = this.opts.ip_items[this.opts.focused].textContent.length;
        if ((this.opts.focused === 4 && len < 5) || (this.opts.focused !== 4 && len < 3)) {
          this.opts.ip_items[this.opts.focused].textContent += keyCode - 48;
        } else {
          this.opts.ip_items[this.opts.focused].textContent = keyCode - 48;
        }
      }
      this.opts.lastPressed = this.opts.focused;
      this.opts.eventBus.emit("form-changed");
    }*/
  }

  goEnter() {
    if (this.opts.focus === FOCUS_KEYBOARD_BOTON_ID) {
      this.text = this.text || "-1";
      this.opts.eventBus.emit("keyboard-pinComplete", this.text);
      return;
    }
    if (this.opts.focus === "keyboard") {
      let value;
      if (this.typeOfRow(this.row_actual) === "altRow") {
        value = this.keys[this.row_actual][this.getKeyActual()][this.alt_key_actual].getAttribute("value");
      } else {
        value = this.keys[this.row_actual][this.getKeyActual()].getAttribute("value");
      }

      if (this.typeOfRow(this.row_actual) === "switchRow") {
        if (value === "encrypted") {
          this.toggleEncryptedText();
        } else {
          value = parseInt(value);

          if (value !== this.panel_actual) {
            this.toggleSelected();
            this.panel_actual = value;
            this.createKb(true, false);
          }
        }
      } else {
        if (this.tipoAccion === "nombrardispositivo" && this.text.length >= this.opts.maxCharacters) {
          const letUseKeyboard = value === "delete" || value === "shift" ? true : false;
          if (!letUseKeyboard) return;
        }
        switch (value) {
          case "delete":
            if (this.text.length > 0) {
              if (KeyMng.instance.getPulsacionLarga()) {
                this.text = "";
                this.insertar_valor_busqueda(this.text);
              } else {
                this.text = this.text.substring(0, this.text.length - 1);
                if (this.inputNumber > 1 && this.input > 0) {
                  this.inputs[this.input - 1].value = "";
                  this.input -= 1;
                  this.removeButtonActive();
                } else if (this.inputNumber === 1) {
                  this.insertar_valor_busqueda(this.text);
                } else if (this.inputNumber < 1) {
                  this.opts.eventBus.emit("keyboard-emit", this.text);
                }
              }
            }
            break;
          case "space":
            if (
              this.text.length > 0 &&
              this.text.length < this.opts.maxCharacters &&
              this.text[this.text.length - 1] !== " "
            ) {
              this.text += " ";
              if (this.inputNumber === 1) {
                this.insertar_valor_busqueda(this.text);
              } else {
                this.opts.eventBus.emit("keyboard-emit", this.text);
              }
            }
            break;
          case "shift":
            this.shift = !this.shift;
            if (this.text.length > 0 && this.shift !== this.uppercase) {
              this.cambiaOrdenTeclado();
            }
            if (this.shift) {
              document.querySelector(".alt_wrap").classList.add("shift");
            } else {
              document.querySelector(".alt_wrap").classList.remove("shift");
            }
            break;
          default:
            this.clearMsgError();
            if (this.inputNumber > 1) {
              if (this.input < this.inputs.length) {
                this.text += value;
                this.inputs[this.input].value = value;
                this.input += 1;
                if (this.input >= this.inputs.length) {
                  this.setButtonActive();
                  this.removeActive();
                  this.focusButton();
                }
              }
            } else if (this.inputNumber === 1 && this.text.length < this.opts.maxCharacters) {
              if (this.opts.isCreatingProfile) {
                this.text = value;
                this.setIsCreatingProfiles(false);
              } else {
                this.text += value;
              }
              this.insertar_valor_busqueda(this.text);
            } else if (this.text.length < this.opts.maxCharacters) {
              this.text += value;
              this.opts.eventBus.emit("keyboard-emit", this.text);
            }
            break;
        }

        // cambiamos mayúsculas a minúsculas si es la primera pulsación y el teclado así lo requiere
        if (
          this.keyboard.mayMin &&
          !this.shift &&
          ((this.text.length === 0 && !this.uppercase) || (this.text.length > 0 && this.uppercase))
        ) {
          this.cambiaOrdenTeclado();
        }
      }
    } else {
      if (
        this.inputNumber === 1 ||
        (this.inputNumber > 1 && this.text.length === this.inputNumber) ||
        !this.keyboard.panels
      ) {
        this.clickButton();
      }
    }
  }

  goClick(event) {
    if (event) {
      event.preventDefault();
      for (let i = 0; i < this.keys.length; ++i) {
        for (let j = 0; j < this.keys.length; ++j) {
          if (this.keys[i][j] === event.target) {
            this.removeActive();
            this.row_actual = i;
            this.setKeyActual(j, this.row_actual);
            this.setActive();
            this.goEnter();
          }
        }
      }
    }
  }

  goBack() {
    if (this.opts.focus === FOCUS_KEYBOARD_BOTON_ID) {
      this.opts.eventBus.emit("keyboard-back");
      return;
    }
    if (this.kbClass === "pin" && this.isSTB && this.inputNumber > 1 && this.input > 0) {
      this.deleteInputValue();
    } else {
      this.opts.eventBus.emit("keyboard-back");
    }
  }

  clearInputError() {
    document.getElementById("kb-modal-profile").classList.remove("focus-error");
  }

  clearMsgError() {
    document.getElementById("kb-modal-profile").classList.remove("little-error");
  }

  showError() {
    this.setKeyActual(0);
    this.createInputKb(true);
    if (!(this.kbClass === "pin" && this.isSTB)) {
      this.createKb(true);
      this.removeButtonActive();
    }
    const botonAlquilarId = this.opts.wrap.nextSibling?.getAttribute("id");
    ///
    /// Tenemos el botón aceptar para el alquiler
    ///
    if (this.kbClass === "pin" && botonAlquilarId === "popup_button_pin") {
      ///
      /// Error en el PIN introducido. EL foco debe de estar situado en el hueco para dígito de PIN y no en el botón aceptar
      ///
      const botonAlquilar = this.opts.wrap.nextSibling;
      botonAlquilar.firstElementChild.classList.remove("active");
      this.opts.focus = "keyboard";
    }
    document.getElementById("kb-modal-profile").classList.add("little-error");
    document.getElementById("kb-modal-profile").classList.add("focus-error");
    setTimeout(this.clearInputError, 1000);
  }

  checkPIN(pin) {
    const self = this;

    const requestPIN = {
      method: "POST",
      service: "tfgunir/cuenta",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      endpoint: "checkpin",
      pinType: this.pinType,
      data: { pin },
    };
    BackendMng.instance.request(requestPIN).then(
      function (response) {
        self.opts.eventBus.emit("keyboard-emit", response);
        self.opts.eventBus.emit("m360-emit", "ok");
        self.opts.eventBus.emit("checkPIN", "ok");
      },
      function (error) {
        self.opts.eventBus.emit("m360-emit", "ko");
        if (error.status === 429) {
          const currentTime = Date.now();
          // 5 minutos
          const blockedTime = currentTime + 300000;
          Main.setStorageValue("time_pin_blocked", blockedTime);
          self.opts.eventBus.emit("keyboard-emit", "pinblocked");
          self.opts.eventBus.emit("checkPIN", "pinblocked");
        } else {
          self.opts.eventBus.emit("checkPIN", "ko");
          self.showError();
        }
      }
    );
  }

  clickButton() {
    if (this.opts.checkPin) {
      if (this.opts.isPinMng) {
        ///
        /// Comprobamos si tenemos disponible el botón "Aceptar" del teclado de PINES
        ///

        const botonAlquilarId = this.opts.wrap.nextSibling.getAttribute("id");
        if (botonAlquilarId === "popup_button_pin") {
          const botonAlquilar = this.opts.wrap.nextSibling;
          botonAlquilar.firstElementChild.classList.add("active");
          this.opts.focus = FOCUS_KEYBOARD_BOTON_ID;
        } else {
          this.opts.eventBus.emit("keyboard-pinComplete", this.text);
        }
      } else {
        this.checkPIN(this.text);
      }
    } else if (this.opts.newPin) {
      if (this.opts.isPinMng) {
        this.opts.eventBus.emit("keyboard-pinComplete", this.text);
      } else {
        this.newPIN(this.text);
      }
    } else {
      this.opts.eventBus.emit("keyboard-emit", this.text);
    }
  }

  fade_out() {
    document.getElementById(this.keyboard.id).classList.add("fadeout");
  }

  fade_in() {
    document.getElementById(this.keyboard.id).classList.remove("fadeout");
  }

  destroy() {
    super.destroy();
    this.opts.wrap.classList.remove("active");
    this.opts.wrap.removeChild(document.getElementById(this.keyboard.id));
  }

  isCreatingProfile() {
    return this.opts.isCreatingProfile;
  }
  setIsCreatingProfiles(value) {
    this.opts.isCreatingProfile = value;
  }
}
