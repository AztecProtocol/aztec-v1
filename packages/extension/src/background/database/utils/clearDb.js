import db from '../'

export default function clearDB() {
    db.tables.forEach(function (table) {
        table.clear();
    });
};