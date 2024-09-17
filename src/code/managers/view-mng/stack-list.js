/**
 * @template T
 */
export class StackList {
  constructor() {
    /**
     * @type {T[]}
     * @private
     */
    this._innerList = [];
  }

  /**
   * Devuelve la longitud del stack
   *
   * @type {number}
   */
  get length() {
    return this._innerList.length;
  }

  /**
   * Set the inner collection
   *
   * @param {T[]} itemList new items to set
   */
  setItems(itemList) {
    this._innerList = [];
    itemList.forEach((item) => this.push(item));
  }

  /**
   * Obtiene el elemento en la posicion especificada
   *
   * @param {number} index Indice empezando en 0
   * @return {T}
   */
  item(index) {
    return this._innerList[index];
  }

  /**
   * Agrega un elemento en el stack
   *
   * @param {T} item Item a agregar
   */
  push(item) {
    this._innerList.push(item);
  }

  /**
   * Extrae un elemento del stack
   *
   * @return {T} Ultimo elemento en el stack
   */
  pop() {
    return this._innerList.pop();
  }

  /**
   * Borra elementos del stack
   *
   * @param {Number} start Inicio del borrado basado en cero
   * @param {Number} [deleteCount = undefined] Cuantos elementos se van a borrar
   * @return {T[]} Elementos eliminados
   */
  splice(start, deleteCount = Number.MAX_SAFE_INTEGER) {
    return this._innerList.splice(start, deleteCount);
  }

  /**
   * Return a clone of the elements of stack
   * @return {T[]}
   */
  toArray() {
    return [...this._innerList];
  }

  /**
   * Obtiene el indice de un elemento
   *
   * @param {T} item Item a buscar el indice
   * @return {number} indice del elemento en el arreglo o -1 si no lo encuentra
   */
  indexOf(item) {
    return this._innerList.lastIndexOf(item);
  }

  /**
   * Remueve un elemento del arreglo si existe
   * @param {T} item Item a eliminar
   * @returns {boolean} true si se ha eliminado el elemento
   */
  remove(item) {
    let wasRemoved = false;
    const lastIndex = this.indexOf(item);
    if (lastIndex >= 0) {
      this.splice(lastIndex, 1);
      wasRemoved = true;
    }
    return wasRemoved;
  }
}
