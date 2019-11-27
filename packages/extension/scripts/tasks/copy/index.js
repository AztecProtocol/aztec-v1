import pipeTasks from '../../utils/pipeTasks';
import copyTokenIcons from './copyTokenIcons';

export default async function copy({
    onError,
    onClose,
} = {}) {
    return pipeTasks(
        [
            copyTokenIcons,
        ],
        {
            onError,
            onClose,
        },
    );
}
