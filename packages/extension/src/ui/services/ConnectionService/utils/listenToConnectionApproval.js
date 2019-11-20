import {
    connectionApprovedEvent,
} from '~/config/event';
import NetworkService from '~/helpers/NetworkService/factory';

export default async function listenToConnectionApproval() {
    return new Promise((resolve) => {
        const handleReceiveMessage = (e) => {
            if (e.data.type === connectionApprovedEvent) {
                window.removeEventListener('message', handleReceiveMessage);

                const {
                    data,
                } = e.data;
                NetworkService.setConfigs([data]);
                const [port] = e.ports;
                resolve(port);
            }
        };

        window.addEventListener('message', handleReceiveMessage);
    });
}
