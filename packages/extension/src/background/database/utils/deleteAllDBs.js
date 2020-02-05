import Dexie from 'dexie';

export default async function deleteAllDBs() {
    const names = await Dexie.getDatabaseNames();
    await Promise.all(names.map((name) => {
        const db = new Dexie(name);
        return db.delete();
    }));
}
