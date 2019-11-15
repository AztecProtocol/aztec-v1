import {
    warnLog,
} from '~/utils/log';
import EventListeners from './EventListeners';

const apis = [
    'addListener',
    'removeListener',
    'notifyListeners',
];

export default function initEventListeners(targetObj, eventNames) {
    const handler = new EventListeners(eventNames);
    apis.forEach((apiName) => {
        if (apiName in targetObj) {
            warnLog(`"${apiName}" has already been defined in target object.`);
            return;
        }

        targetObj[apiName] = handler[apiName]; // eslint-disable-line no-param-reassign
    });
}
