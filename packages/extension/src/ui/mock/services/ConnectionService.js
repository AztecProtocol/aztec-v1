import {
    log,
} from '~/utils/log';
import OriginConnectionService from '~/ui/services/ConnectionService';

const ConnectionService = {
    ...OriginConnectionService,
    close: (...args) => log('close', args),
    returnToClient: (...args) => log('returnToClient', args),
};

export default ConnectionService;
