import Schema from 'validate';
import addressType from './types/address';

export default new Schema({
    id: addressType.isRequired,
    addresses: {
        type: Array,
        each: addressType,
    },
});
