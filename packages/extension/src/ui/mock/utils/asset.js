import {
    randomAddress,
} from '../data';

export default function asset(address) {
    return {
        address,
        linkedTokenAddress: randomAddress(),
    };
}
