import { sqliteConnection } from "../infra/db.js";


export async function saveCode(email, code) {

    sqliteConnection().then(db => db.run(`INSERT INTO code (email, code) VALUES ('${email}', ${code});`))

}


export async function deleteCode(email, code) {

    setTimeout(function() {
        sqliteConnection().then(db => db.run(`DELETE FROM code WHERE email = '${email}' AND code = ${code};`))
    }, 30000);

}


export async function checkCode(email, code) {

    return sqliteConnection().then(db => db.get(`SELECT * FROM code WHERE email = '${email}' AND code = ${code}`))

}