const multirelease = require('multi-semantic-release');

// prettier-ignore
multirelease([
    `${__dirname}/../../aztec.js/package.json`,
    `${__dirname}/../../dev-utils/package.json`,
    `${__dirname}/../../protocol/package.json`,
]);
