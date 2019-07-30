import {
    ADDRESS_LENGTH,
} from '~config/constants';

const addressPattern = new RegExp(`^[0-9a-f]{${ADDRESS_LENGTH}}$`);

export default function address(str) {
    const bytes = (str || '').replace(/^0x/, '').toLowerCase();

    if (!bytes.match(addressPattern)) {
        return '';
    }

    return `0x${bytes.toLowerCase()}`;
}
