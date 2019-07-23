import migrateContractsInstance from '../instances/migrateContractsInstance';

export default function migrate({
    onError,
    onClose,
} = {}) {
    const migrateExtension = () => {
        migrateContractsInstance({
            packageName: 'extension',
            onError,
            onClose,
        })
    };

    migrateContractsInstance({
        packageName: 'protocol',
        onError,
        onClose: migrateExtension,
    });
}
