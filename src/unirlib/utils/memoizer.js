let instance = null;

export class PromiseMemoizer {
  #promises;
  #defaultPersistence;
  constructor() {
    this.#promises = new Map();
    // tiempo de persistencia de promesas (ms)
    this.#defaultPersistence = 0;
  }
  static get instance() {
    if (instance) {
      return instance;
    }
    instance = new PromiseMemoizer();
    return instance;
  }

  /**
   * @param {String} promiseKey key unica para compartir la promesa
   * @param {Function(): Promise} asyncFunc funcion ansicrona
   * @param  {Array} args argumentos
   * @returns {Promise<void>}
   */
  async getResource(promiseKey, asyncFunc, args) {
    if (this.#promises.has(promiseKey)) {
      //console.log("Memoizer: promise shared: ", { promiseKey, asyncFunc }, this.#promises);
      return this.#promises.get(promiseKey);
    }

    const promise = asyncFunc(...args)
      .then((data) => {
        setTimeout(() => {
          this.#promises.delete(promiseKey);
        }, this.#defaultPersistence);
        return data;
      })
      .catch((error) => {
        this.#promises.delete(promiseKey);
        throw error;
      });

    this.#promises.set(promiseKey, promise);
    //console.log("Memoizer: new promise: ", { promiseKey, asyncFunc }, this.#promises);
    return promise;
  }
}
