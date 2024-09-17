import "@newPath/components/input/input.css";

import { BaseComponent } from "src/code/views/base-component";

export class InputComponent extends BaseComponent {
  constructor(wrap, eventBus, inputClass) {
    super(wrap);
    this.opts = {
      eventBus,
      wrap, // contiene la referencia al wrapper donde se inserta el componente
      class: inputClass,
      ip_items: [],
      ip_revertChanges: false,
      focused: 0,
      lastPressed: null,
    };
  }

  get ip_revertChanges() {
    return this.opts.ip_revertChanges;
  }

  set ip_revertChanges(value) {
    this.opts.ip_revertChanges = value;
  }

  get lastPressed() {
    return this.opts.lastPressed;
  }

  set lastPressed(value) {
    this.opts.lastPressed = value;
  }

  init(textInput) {
    if (this.opts.class === "ip") {
      this.opts.focused = 0;
      this.opts.lastPressed = this.opts.ip_revertChanges ? null : this.opts.lastPressed;
      textInput = this.createInputIp(textInput);
      this.opts.wrap.innerHTML = textInput;
      this.opts.ip_items = this.opts.wrap.querySelectorAll(".ip_item");
      if (this.opts.ip_revertChanges) {
        this.focus();
        this.opts.ip_revertChanges = false;
      }
      for (let i = 1; i < this.opts.ip_items.length; i++) {
        if (this.opts.ip_items[i].classList.contains("focus")) {
          this.opts.focused = i;
          break;
        }
      }
    } else {
      this.opts.wrap.innerHTML = textInput;
    }
  }

  goUp() {
    return false;
  }

  goDown() {
    return false;
  }

  goLeft() {
    if (this.opts.focused > 0) {
      this.setFocus(this.opts.focused - 1);
      return true;
    }
    return false;
  }

  goRight() {
    if (this.opts.focused < this.opts.ip_items.length - 1) {
      this.setFocus(this.opts.focused + 1);
      return true;
    }
    return false;
  }

  goEnter() {
    // Mostrar teclado que toque
    return false;
  }

  goKey(keyCode) {
    if (this.opts.class === "ip") {
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
    }
  }

  focus() {
    if (this.opts.class === "ip") {
      this.opts.ip_items.forEach((it) => {
        if (it.classList.contains("focus")) {
          it.classList.add("active");
        }
      });
    } else {
      this.opts.wrap.classList.add("active");
    }
  }

  unfocus() {
    if (this.opts.class === "ip") {
      this.opts.ip_items.forEach((it) => {
        if (it.classList.contains("focus")) it.classList.remove("active");
      });
    } else {
      this.opts.wrap.classList.remove("active");
    }
  }

  setFocus(newFocus) {
    this.opts.ip_items[this.opts.focused].classList.remove("focus");
    this.opts.ip_items[this.opts.focused].classList.remove("active");
    this.opts.ip_items[newFocus].classList.add("focus");
    this.opts.ip_items[newFocus].classList.add("active");
    this.opts.focused = newFocus;
  }

  createInputIp(textInput) {
    let result = "";
    textInput.split(".").forEach((el, position) => {
      if (position > 0) result += ".";
      if (el.indexOf(":") > 0) {
        var split2Pts = el.split(":");
        result +=
          "<span class='ip_item range' id'" +
          position +
          "'>" +
          split2Pts[0] +
          "</span>" +
          ":" +
          "<span class='ip_item port' id'" +
          (position + 1) +
          "'>" +
          split2Pts[1] +
          "</span>";
      } else {
        if (position === 0) result += "<span class='focus ip_item range' id'" + position + "'>" + el + "</span>";
        else result += "<span class='ip_item range' id'" + position + "'>" + el + "</span>";
      }
    });
    return result;
  }

  getValue() {
    return this.opts.wrap.textContent;
  }
}
