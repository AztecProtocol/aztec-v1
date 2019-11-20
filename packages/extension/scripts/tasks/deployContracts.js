import pipeTasks from '../utils/pipeTasks';
import migrateExtension from './migrateExtension';

export default function deployContracts({
    onError,
    onClose,
} = {}) {
    pipeTasks(
        [
            migrateExtension,
        ],
        {
            onError,
            onClose,
        },
    );
}
