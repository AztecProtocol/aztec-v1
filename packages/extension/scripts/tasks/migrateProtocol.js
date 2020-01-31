import migrateContractsInstance from '../instances/migrateContractsInstance';

export default function migrateProtocol({
    onError,
    onClose,
} = {}) {
    return migrateContractsInstance({
        packageName: 'protocol',
        onError,
        onClose,
    });
}
