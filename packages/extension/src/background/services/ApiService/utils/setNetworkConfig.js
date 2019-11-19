import NetworkService from '~helpers/NetworkService/factory';
import {
    set,
} from '~utils/storage';

export default async function setNetworkConfig(config) {
    NetworkService.setNetworkConfig(config);
    await set({
        networkId: config.networkId,
    });
}
