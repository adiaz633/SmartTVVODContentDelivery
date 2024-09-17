import ms from "ms";

/**
 * @template T
 * @template {(...any) => T} F
 * @param {string} tag
 * @param {F} target
 * @returns {F}
 */
export const time = (tag, target) => {
  return async function (...args) {
    const start = Date.now();
    try {
      this.log(`start: ${tag}[${args[0]?.type}]`);
      return await target(...args);
    } finally {
      this.log(`end: ${tag}[${args[0]?.type}]: ${ms(Date.now() - start)}`);
    }
  };
};
