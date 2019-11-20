import pipeTasks from '../utils/pipeTasks';
// import migrateProtocol from './migrateProtocol';
import migrateExtension from './migrateExtension';

export default function deployContracts({
    onError,
    onClose,
} = {}) {
    pipeTasks(
        [
            // migrateProtocol,
            migrateExtension,
        ],
        {
            onError,
            onClose,
        },
    );
}
