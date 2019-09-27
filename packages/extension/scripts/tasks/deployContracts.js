import pipeTasks from '../utils/pipeTasks';
// import migrateProtocol from './migrateProtocol';
import migrateExtension from './migrateExtension';
import copyProtocol from './copyProtocol';

export default function deployContracts({
    onError,
    onClose,
} = {}) {
    pipeTasks(
        [
            // migrateProtocol,
            migrateExtension,
            // Migrate protocol contracts here in the extension package
            copyProtocol,
        ],
        {
            onError,
            onClose,
        },
    );
}
