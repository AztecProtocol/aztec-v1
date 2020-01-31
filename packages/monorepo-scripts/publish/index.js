const multirelease = require('multi-semantic-release');

// prettier-ignore
multirelease([
    `${__dirname}/../../aztec.js/package.json`,
    `${__dirname}/../../contract-addresses/package.json`,
    `${__dirname}/../../contract-artifacts/package.json`,
    `${__dirname}/../../dev-utils/package.json`,
    `${__dirname}/../../protocol/package.json`,
    `${__dirname}/../../secp256k1/package.json`,
    `${__dirname}/../../extension/package.json`,
]);
