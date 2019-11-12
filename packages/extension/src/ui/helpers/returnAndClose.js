import ConnectionService from '~uiModules/services/ConnectionService';
import closeWindow from '~ui/utils/closeWindow';

export default function returnAndClose(data, closeDelay = 1000) {
    ConnectionService.returnToClient(data);
    closeWindow(closeDelay);
}
