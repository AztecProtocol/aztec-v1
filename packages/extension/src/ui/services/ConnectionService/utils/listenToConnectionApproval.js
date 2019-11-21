import {
    connectionApprovedEvent,
} from '~/config/event';

export default async function listenToConnectionApproval() {
    return new Promise((resolve) => {
        const handleReceiveMessage = async (e) => {
            if (e.data.type === connectionApprovedEvent) {
                window.removeEventListener('message', handleReceiveMessage);

                const {
                    data: clientConfig,
                } = e.data;
                const [port] = e.ports;

                resolve({
                    port,
                    clientConfig,
                });
            }
        };

        window.addEventListener('message', handleReceiveMessage);
    });
}
