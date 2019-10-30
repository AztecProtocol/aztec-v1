import ConnectionService from '~ui/services/ConnectionService';

export default function closeWindow(delay = 0) {
    if (!delay) {
        ConnectionService.close();
        return;
    }
    setTimeout(() => {
        ConnectionService.close();
    }, delay);
}
