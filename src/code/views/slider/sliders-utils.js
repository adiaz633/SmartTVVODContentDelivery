/**
 * Data de los sliders
 * @typedef {Object} SliderData
 * @property {string} type Tipo de slide
 * @property {object[]} data Data del slider
 */

/**
 * Obtiene el primer slider del tipo _type_ desde arriba hacia abajo
 *
 * @param {SliderData[]} slidersData arreglo de infomacion de las sliders
 * @param {string} type tipo de slider
 * @return {number} 0-n si se encuentra el tipo -1 de lo contrario
 */
export function getFirstSliderByType(slidersData, type) {
  for (let i = 0; i < slidersData.length; i += 1) {
    const sliderData = slidersData[i];
    if (sliderData.type.toLowerCase() === type.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

/**
 * Obtiene el primer slider no vacio desde arriba hacia abajo
 * @param {SliderData[]} slidersData arreglo de infomacion de las sliders
 * @returns {number} 0-n si se encuentra un slider no vacio -1 de lo contrario
 */
export function getFirstSliderNotEmpty(slidersData) {
  let notEmptySlideIndex = 0;
  for (notEmptySlideIndex; notEmptySlideIndex < slidersData.length; notEmptySlideIndex += 1) {
    const sliderData = slidersData[notEmptySlideIndex];
    if (sliderData.data?.length) {
      break;
    }
  }
  return notEmptySlideIndex;
}
/**
 * Obtiene las dimensiones verticales reales del elemento
 * @param {HTMLElement} element elemento evaluado
 * @returns {Number} altura en px
 */
export function getElementTotalHeight(element) {
  const style = window.getComputedStyle(element);
  const height = element.offsetHeight + parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
  return isNaN(height) ? 0 : height;
}
