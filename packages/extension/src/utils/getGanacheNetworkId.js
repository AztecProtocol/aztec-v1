import {
    ACEConfig,
} from '~/config/contracts';


export default function getGanacheNetworkId() {
    return Object.keys(ACEConfig.config.networks).pop();
}
