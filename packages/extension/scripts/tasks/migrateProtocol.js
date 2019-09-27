import migrateContractsInstance from '../instances/migrateContractsInstance';
import copyContracts from './copyContracts';

export default function migrateProtocol({
    onError,
    onClose,
} = {}) {
    return migrateContractsInstance({
        packageName: 'protocol',
        onError,
    }).next(() => {
        copyContracts({
            targetPackages: ['protocol'],
            onError,
            onClose,
        });
    });
}
