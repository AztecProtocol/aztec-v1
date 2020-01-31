import pipeTasks from '../utils/pipeTasks';
import migrateProtocol from './migrateProtocol';

export default function deployContracts({
    onError,
    onClose,
} = {}) {
    pipeTasks(
        [
            migrateProtocol,
        ],
        {
            onError,
            onClose,
        },
    );
}
