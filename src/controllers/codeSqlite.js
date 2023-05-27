import { sqliteConnection } from "../infra/db.js";

// 4 digit random code generator
export async function randomCodeGenerator() {
  return Math.floor(Math.random() * 9000) + 1000;
}

export async function saveCode(email, code) {
  sqliteConnection().then((db) =>
    db.run(`INSERT INTO code (email, code) VALUES ('${email}', ${code});`)
  );
}

export async function deleteCode(email, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(`DELETE FROM code WHERE email = '${email}' AND code = ${code};`)
    );
  }, 300000);
}

export async function checkCode(email, code) {
  return sqliteConnection().then((db) => {
    return db.get(
      `SELECT * FROM code WHERE email = '${email}' AND code = ${code}`,
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          // console.log("terminado");
        }
      }
    );
  });
}
