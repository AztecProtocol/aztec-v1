import db from '../'

export default function clearDb() {
    db.tables.forEach(function (table) {
        table.clear();
    });
};