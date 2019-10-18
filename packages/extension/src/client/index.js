import Aztec from './Aztec';

window.aztec = new Aztec();

if (process.env.NODE_ENV === 'development') {
    if (window.location.hostname.match(/aztecprotocol/)) {
        // const demo = require('./demo/ownable.js').default; // eslint-disable-line global-require
        // demo();
    }
}
