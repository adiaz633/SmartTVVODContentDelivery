const { AES: a } = require("crypto-js");

const crypt = (secret, version, milestone, commitNumber, country) => {
  // Split secret every 5 characters
  const groups = secret.match(/.{1,8}/g);

  // This KEY is generated also in the app to cypher/decypher secrets.
  const key = toBase64([version, milestone, commitNumber, country].join(""));

  // Cyphers and reverses every group in the array.
  return groups.map((group) => {
    return (
      a["encrypt"](group, key)
        .toString()
        .split("")
        // Converts every char to hex
        .map((c) => c.charCodeAt(0).toString(16))
        // Array should be cloned.
        .slice(0)
        // Reverse every group
        .reverse()
    );
  });
};

/**
 * Converts the provided string to a base64 encoded string.
 *
 * @param {string} params - The string to be converted to base64.
 * @return {string} The base64 encoded string.
 */
function toBase64(params) {
  return Buffer.from(params, "utf-8").toString("base64");
}
module.exports = crypt;
