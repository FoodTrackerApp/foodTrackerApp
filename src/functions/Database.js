import * as SQLite from "expo-sqlite";



const createTable = () => {
    const db = SQLite.openDatabase("item.db");
    db.transaction((tx) => {
        tx.executeSql(
            "create table if not exists items (id text primary key not null, name text, place text, date int, hasDueDate int, count int, datemodified int, deleted int);"
        );
        },
        (error) => {console.log(error)},
    );
}

const insertItem = (item) => {
    const db = SQLite.openDatabase("item.db");
    db.transaction((tx) => {
        tx.executeSql("insert into items (id, name, place, date, hasDueDate, count, datemodified, deleted) values (?, ?, ?, ?, ?, ?, ?, 0)", 
            [id, form.name, form.place, form.date, form.hasDueDate, form.count, form.datemodified]);
        },
        (err) => {console.log(err)},
    )
}

const deleteItem = (newDateModified, id) => {
    const db = SQLite.openDatabase("item.db");
    db.transaction((tx) => {
        tx.executeSql("update items set deleted = 1, datemodified = ? where id = ?",
            [newDateModified, id]);
        },
        (err) => {console.log(err)},
    )
}

const updateItem = (newDateModified, id, form) => {
    const db = SQLite.openDatabase("item.db");
    db.transaction((tx) => {
        tx.executeSql("update items set name = ?, place = ?, date = ?, hasDueDate = ? count = ?, datemodified = ? where id = ?", 
            [form.name, form.place, form.date, form.hasDueDate, form.count, newDateModified, id]);
        },
        (err) => {console.log(err)},
    )
}

/**
 * @returns {Array} rows
 */
const readItems = async () => {
    return new Promise((resolve , reject) => {
        const db = SQLite.openDatabase("item.db");
        db.transaction((tx) => {
            tx.executeSql("select * from items", [], (_, { rows: {_array} }) => {
                resolve(_array);
            });
            },
            (err) => {reject(err)},
        )
    })
}

const dropItems = () => {
    return new Promise((resolve , reject) => {
        const db = SQLite.openDatabase("item.db");
        db.transaction((tx) => {
            tx.executeSql("delete from items", [], () => {
                resolve();
            });
            },
            (err) => {reject(err)},
        )
    })
}

export {
    createTable,
    insertItem,
    deleteItem,
    updateItem,
    readItems,
    dropItems
}