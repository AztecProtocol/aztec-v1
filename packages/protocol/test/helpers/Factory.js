/**
 *
 * Generate a factory ID based on three supplied uint8's: epoch, cryptoSystem and
 * assetType
 *
 * @method generateFactoryId
 * @param {Number} epoch - uint8 representing factory version control
 * @param {Number} cryptoSystem - uint8 representing the cryptosystem the factory is associated with
 * @param {Number} assetType - uint8 representing the type of the asset i.e. is it convertible,
 * adjustable
 */
const generateFactoryId = (epoch, cryptoSystem, assetType) => {
    return epoch * 256 ** 2 + cryptoSystem * 256 ** 1 + assetType * 256 ** 0;
};

module.exports = {
    generateFactoryId,
};
