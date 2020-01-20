import migrateContractsInstance from '../instances/migrateContractsInstance';

export default function migrateExtension({
    onError,
    onClose,
} = {}) {
    return migrateContractsInstance({
        packageName: 'extension',
        onError,
        onClose,
    });
}
