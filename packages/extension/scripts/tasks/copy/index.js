import pipeTasks from '../../utils/pipeTasks';
import copyTokenIcons from './copyTokenIcons';
import copyContracts from './copyContracts';

export default async function copy({
    onError,
    onClose,
} = {}) {
    return pipeTasks(
        [
            copyTokenIcons,
            copyContracts,
        ],
        {
            onError,
            onClose,
        },
    );
}
