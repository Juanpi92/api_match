import { sqliteConnection } from "../infra/db.js";

// 300000 ms = 5min
// 30000 ms = 30s
var timeUntilCodeDelete = 30000 // in ms

// 4 digit random code generator
export function randomCodeGenerator() {
  return Math.floor(Math.random() * 9000) + 1000;
}
//RASCUNHO: se assim como está funfar, tentar meter um trycatch aqui \/
export async function saveCode(methodRes, code){
  sqliteConnection().then( (db) => 
  db.getDatabaseInstance().serialize(async () => {
  db.run(
    `CREATE TABLE IF NOT EXISTS db_code (
      method TEXT,
      code INTEGER
    )`);
    db.run(
    'INSERT OR IGNORE INTO db_code (method, code) VALUES (?, ?)', [methodRes, code] )
  }))}


export async function deleteCode(methodRes, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(
        `DELETE FROM db_code WHERE method = ? AND code = ?`, [methodRes, code],
        function (err, results) {
          if (err) {
            throw new Error({ message: "Error in the database" });
          } else {
            console.log("TERMINADO", results);
          }
        }
      )
    );
  }, timeUntilCodeDelete);
}

export async function checkCode(methodRes, code) {
  return sqliteConnection().then((db) => {
    return db.get(
      `SELECT * FROM db_code WHERE method = ? AND code = ?`, [methodRes, code],
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          console.log( { message: "checkado com sucesso" }, results);
        }
      }
    );
  });
}