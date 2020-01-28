import {
    sendActionEvent,
} from '~/config/event';

export default async function listenToInitialAction() {
    return new Promise((resolve) => {
        const handleReceiveAction = (e) => {
            if (e.data.type === sendActionEvent) {
                const {
                    action,
                } = e.data;
                window.removeEventListener('message', handleReceiveAction);
                resolve(action);
            }
        };

        window.addEventListener('message', handleReceiveAction);
    });
}
