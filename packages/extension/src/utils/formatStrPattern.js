import {
    warnLog,
} from '~/utils/log';

export default function formatStrPattern(pattern, data) {
    if (!pattern) {
        return '';
    }

    return pattern.replace(/{([^{]+)}/ig, (_, key) => {
        if (!(key in data)) {
            warnLog(`Data '${key}' not found for pattern '${pattern}'.`);
            return _;
        }
        return data[key];
    });
}
