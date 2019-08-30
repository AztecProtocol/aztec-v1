const windowCrypto = require('@trust/webcrypto');

global.crypto = windowCrypto;
global.chrome = require('sinon-chrome');
