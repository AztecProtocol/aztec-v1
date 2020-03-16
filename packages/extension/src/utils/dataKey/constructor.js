import {
    warnLog,
} from '~/utils/log';
import dataKeyConfig from '~/config/dataKey';
import {
    formatStrPattern,
} from '~/utils/format';

export default function dataKey(type, data, config = dataKeyConfig) {
    const pattern = typeof type === 'string' && type.match(/{([^{}]+)}/)
        ? type
        : config[type];

    if (!pattern) {
        warnLog(`Pattern not found for type '${type}'.`);
        return '';
    }

    return formatStrPattern(pattern, data);
}
