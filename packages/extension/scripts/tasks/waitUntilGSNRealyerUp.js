import {
    waitForRelay,
} from '../utils/GNSHelpers';
import {
    DEFAULT_GSN_RELAYER_PORT,
} from '../config/constants';


export default async function waitUntilGSNRealyerUp({
    onError,
    onClose,
} = {}) {
    const relayUrl = `http://localhost:${DEFAULT_GSN_RELAYER_PORT}`;

    try {
        await waitForRelay(relayUrl);
    } catch (e) {
        onError(e);
        onClose();
    }
}
