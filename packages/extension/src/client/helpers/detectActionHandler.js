import MetaMaskService from '~/client/services/MetaMaskService';
import GSNService from '~/client/services/GSNService';


export default function detectActionHandler(data) {
    const {
        data: {
            action,
        },
    } = data;

    if (action.startsWith('metamask')) {
        return MetaMaskService(data);
    } else if (action.startsWith('gsn')) {
        return GSNService.handleAction(data);
    }
};
