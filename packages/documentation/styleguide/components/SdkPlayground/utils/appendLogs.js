import { Hook, Decode, Unhook } from 'console-feed';
import PERMITTED_LOGS from '../../../constants/logs';

export default function appendLogs(frameConsole, prevlogs = [], cb) {
    Unhook(frameConsole);
    Hook(frameConsole, (log) => {
        const decodedLog = Decode(log);
        if (PERMITTED_LOGS.indexOf(decodedLog.method) > -1) {
            cb({
                logs: [...prevlogs, decodedLog],
            });
        }
    });
}
