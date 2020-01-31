import urls from '~/config/urls';
import {
    warnLog,
} from '~/utils/log';
import {
    formatStrPattern,
} from '~/utils/format';
import getVersion from './getVersion';

export default function getResourceUrl(type) {
    const urlPattern = urls[type];
    if (!urlPattern) {
        warnLog(`Cannot find url of type '${type}'.`);
        return '';
    }

    const version = getVersion();
    return formatStrPattern(urlPattern, {
        version,
    });
}
