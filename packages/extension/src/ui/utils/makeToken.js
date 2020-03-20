import supportsPermit from '~/config/supportsPermitSignature';
import getTokenInfo from '~/utils/getTokenInfo';

export default function makeToken(address) {
    return {
        ...getTokenInfo(address),
        supportsPermit: supportsPermit[address],
    };
}
