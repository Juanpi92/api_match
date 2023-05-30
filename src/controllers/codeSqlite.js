import { sqliteConnection } from "../infra/db.js";

// 4 digit random code generator
export async function randomCodeGenerator() {
  return Math.floor(Math.random() * 9000) + 1000;
}

export async function saveEmailCode(email, code) {
  sqliteConnection().then((db) =>
    db.run(`INSERT INTO db_emailcode (email, code) VALUES ('${email}', ${code});`)
  );
}

export async function deleteEmailCode(email, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(`DELETE FROM db_emailcode WHERE email = '${email}' AND code = ${code};`)
    );
  }, 300000);
}

export async function checkEmailCode(email, code) {
  return sqliteConnection().then((db) => {
    return db.get(
      `SELECT * FROM db_emailcode WHERE email = '${email}' AND code = ${code}`,
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          console.log("terminado");
        }
      }
    );
  });
}

//////// SMS (TEMPORARIO, A IDEIA É TER APENAS 1 FUNCAO PRA CADA AÇÃO, TANTO PRA EMAIL TANTO PRA SMS)


export async function saveSmsCode(phone, code) {
  sqliteConnection().then((db) =>
    db.run(`INSERT INTO db_smscode (phone, code) VALUES ('${phone}', ${code});`)
  );
}

export async function deleteSmsCode(phone, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(`DELETE FROM db_smscode WHERE phone = '${phone}' AND code = ${code};`)
    );
  }, 300000);
  
}

export async function checkSmsCode(phone, code) {
  return sqliteConnection().then((db) => {
    return db.get(
      `SELECT * FROM db_smscode WHERE phone = '${phone}' AND code = ${code}`,
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          console.log("terminado", results);
        }
      }
    );
  });
}