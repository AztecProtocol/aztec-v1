import ConnectionService from '~uiModules/services/ConnectionService';
import closeWindow from '~ui/utils/closeWindow';
import {
    closeWindowDelay,
} from '~/ui/config/settings';

export default function returnAndClose(data, closeDelay = closeWindowDelay) {
    ConnectionService.returnToClient(data);
    closeWindow(closeDelay);
}
