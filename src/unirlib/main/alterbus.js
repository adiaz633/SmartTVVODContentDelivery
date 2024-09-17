/**
 * Bus de eventos
 */
const TIMEOUT_DELAY = 1;
export class EventBus {
  /**
   * Crea una nueva instancia de la clase _EventBus_
   *
   * @param {object} parent Objeto asociado al bus
   */
  constructor(parent) {
    /**
     * Suscripciones a los eventos
     * @type {{[key:string]:any}}
     */
    this.subscriptions = {};

    /**
     * Objeto padre
     *
     * @type {object}
     */
    this.parent = parent;
  }

  /**
   * Emitir un evento
   *
   * @param {string} eventName Evento a emitir
   * @param {object} eventArgs Argumentos del evento
   */
  emit(eventName, eventArgs) {
    if (typeof this.subscriptions[eventName] === "function") {
      if (this.parent) {
        this.subscriptions[eventName](this.parent, eventArgs);
      } else {
        this.subscriptions[eventName](eventArgs);
      }
    }
  }

  /**
   * Suscribirse a un evento
   *
   * @param {string} eventName Evento a suscribirse. Puede ser una combinación de eventos separados por comas
   * @param {{(parent: object, args: object)=>void}} callback
   */
  on(eventName, callback) {
    const eventos = eventName.split(",");
    const [firstEvent] = eventos;
    if (this.subscriptions[firstEvent.trim()]) {
      throw new Error(`EventBus: ${firstEvent} ya registrado`);
    }

    this.subscriptions[firstEvent] = callback;
  }

  /**
   * Desuscribirse a un evento
   *
   * @param {string} eventName Nombre del evento
   */
  off(eventName) {
    delete this.subscriptions[eventName];
  }
}

/**
 * Bus con espera de eventos
 */
export class SyncEventBus extends EventBus {
  constructor(parent) {
    super(parent);

    /**
     * Eventos a esperar como satisfactoria
     * @type {string[]}
     */
    this.successEventNames = [];

    /**
     * Eventos a esperar como falla
     * @type {string[]}
     */
    this.rejectEventNames = [];

    /**
     * Promesa delegada
     *
     * @private
     * @type {DelegatedPromiseMethod}
     */
    this._delegatePromise = null;

    this.parent = parent;

    this.timeoutId = null;
  }

  emit(eventName, eventArgs) {
    // console.warn(`EVT ${eventName} : ${JSON.stringify(eventArgs, null, 2)}`);
    const parent = this.parent;
    if (this._delegatePromise && this.successEventNames.includes(eventName)) {
      this._delegatePromise.resolve({
        eventArgs,
        eventName,
        parent,
      });
      this._delegatePromise = null;
    }
    if (this._delegatePromise && this.rejectEventNames.includes(eventName)) {
      this._delegatePromise.reject(new Error(eventArgs));
      this._delegatePromise = null;
    }
    super.emit(eventName, eventArgs);
  }

  delayEmit(eventName, eventArgs) {
    window.clearTimeout(this.timeoutId);
    const self = this;
    this.timeoutId = setTimeout(
      () => {
        self.emit(eventName, eventArgs);
      },
      TIMEOUT_DELAY,
      eventName,
      eventArgs,
      self
    );
  }

  /**
   * Espera por un evento
   *
   * @param {string[]} successEventNames Nombre de los eventos satisfactorios
   * @param {string[]} rejectEventNames Nombre de los eventos a rechazar
   * @return {Promise<any>} resolucion de las promesas
   */
  async waitForEvent(successEventNames, rejectEventNames = []) {
    if (this._delegatePromise) {
      throw new Error("SyncEventBus: Already Waiting");
    }

    if (!Array.isArray(rejectEventNames)) {
      throw new TypeError("rejectEventNames must be array");
    }
    if (!Array.isArray(successEventNames)) {
      throw new TypeError("successEventNames must be array");
    }
    const thisSyncEventBus = this;
    this.successEventNames = successEventNames;
    this.rejectEventNames = rejectEventNames;
    return new Promise((resolve, reject) => {
      thisSyncEventBus._delegatePromise = {
        resolve,
        reject,
      };
    });
  }
}

/**
 * Promesas delegadas
 *
 * @typedef {object} DelegatedPromiseMethod
 * @property {{(result:any) => void}} resolve Resuelve la promesa
 * @property {{(reason:Error => void)}} reject falla la promesa
 */
