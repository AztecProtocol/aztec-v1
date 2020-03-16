import Dexie from 'dexie';
import {
    networkDbPrefix,
} from '~/config/database';

const networkDBNamePattern = new RegExp(`^${networkDbPrefix}_[0-9]+$`);

export default async function deleteAllNetworks() {
    const names = await Dexie.getDatabaseNames();
    const networkDbs = names.filter(name => name.match(networkDBNamePattern));
    return Promise.all(networkDbs.map((name) => {
        const db = new Dexie(name);
        return db.delete();
    }));
}
