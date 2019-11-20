import {
    ACE,
} from '~/config/contracts';

export default function getGanacheNetworkId() {
    return Object.keys(ACE.config.networks).pop();
}
