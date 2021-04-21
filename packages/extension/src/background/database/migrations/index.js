import Dexie from 'dexie';
import {
    networkDbPrefix,
} from '~/config/database';

const clearAllTables = (networkId) => {
    Dexie.delete(`${networkDbPrefix}_${networkId}`);
};

export default {
    1: [
        clearAllTables,
    ],
};
