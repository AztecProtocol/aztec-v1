const multirelease = require('multi-semantic-release');

// prettier-ignore
multirelease([
    `../../aztec.js/package.json`,
    `../../dev-utils/package.json`,
    `../../packages/protocol/package.json`,
]);
