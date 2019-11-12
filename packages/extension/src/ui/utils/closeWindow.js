import ConnectionService from '~ui/services/ConnectionService';

export default function closeWindow(delay = 0, abort = false) {
    if (!delay) {
        ConnectionService.close({
            abort,
        });
        return;
    }
    setTimeout(() => {
        ConnectionService.close({
            abort,
        });
    }, delay);
}
