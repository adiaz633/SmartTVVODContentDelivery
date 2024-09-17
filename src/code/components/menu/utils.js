/**
 * Hace la rotacion de los elementos de un arreglo
 *
 * @template T
 * @param {T[]} array Arreglo a rotar
 * @param {number} count Número de posiciones a rotar
 * @returns {T[]} Arreglo con los elementos rotados
 *
 * @example
 * const a = [1,2,3]
 * console.info(rotate(a, 1))
 * // [2,3,1]
 * console.info(rotate(a, -1))
 * // [3,1,2]
 */
export const rotate = (array, count = 1) => {
  return [...array.slice(count, array.length), ...array.slice(0, count)];
};
