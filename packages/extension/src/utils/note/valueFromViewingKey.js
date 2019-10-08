import BN from 'bn.js';
import bn128 from '@aztec/bn128';

export default viewingKey => new BN(viewingKey.slice(66, 74), 16).toRed(bn128.groupReduction);
