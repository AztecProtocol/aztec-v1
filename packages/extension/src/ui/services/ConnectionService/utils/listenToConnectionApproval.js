import {
    connectionApprovedEvent,
} from '~/config/event';

export default async function listenToConnectionApproval() {
    return new Promise((resolve) => {
        const handleReceiveMessage = async (e) => {
            if (e.data.type === connectionApprovedEvent) {
                window.removeEventListener('message', handleReceiveMessage);

                const {
                    data: networkConfig,
                } = e.data;
                const [port] = e.ports;

                resolve({
                    port,
                    networkConfig,
                });
            }
        };

        window.addEventListener('message', handleReceiveMessage);
    });
}
