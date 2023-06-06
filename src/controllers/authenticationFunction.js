import { sqliteConnection } from "../infra/db.js";
import axios from "axios";
import nodemailer from "nodemailer";
import { messageHTML } from "../views/email.js";

// 4 digit random code generator
export function randomCodeGenerator() {
  return Math.floor(Math.random() * 9000) + 1000;
}

export async function sendSms(phone, code) {
  let token = process.env.SMS_API_TOKEN;
  const apiUrl = "https://apihttp.disparopro.com.br:8433/mt";

  const reqData = [
    {
      numero: phone,
      servico: "short",
      mensagem: `Seu código é: [ ${code} ]. Não compartilhe com terceiros.`,
      codificacao: "0",
    },
  ];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  //Send the SMS
  const response = await axios.post(apiUrl, reqData, { headers });
}
export async function sendEmail(email, code) {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_EMAIL,
      },
    });

    const emailConfig = {
      from: process.env.EMAIL,
      to: email,
      subject: "Código de verificação",
      html: messageHTML(code),
      text: `Código de verificação: ${code}`,
    };
    const response = await transport.sendMail(emailConfig);
  } catch (error) {
    throw new Error("Enter an existing email!");
  }
}

export async function saveEmailCode(email, code) {
  sqliteConnection().then((db) =>
    db.run(
      `INSERT INTO db_emailcode (email, code) VALUES ('${email}', ${code});`,
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          console.log("terminado", results);
        }
      }
    )
  );
}

export async function deleteEmailCode(email, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(
        `DELETE FROM db_emailcode WHERE email = '${email}' AND code = ${code};`,
        function (err, results) {
          if (err) {
            throw new Error({ message: "Error in the database" });
          } else {
            console.log("terminado", results);
          }
        }
      )
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
    db.run(
      `INSERT INTO db_smscode (phone, code) VALUES ('${phone}', ${code});`,
      function (err, results) {
        if (err) {
          throw new Error({ message: "Error in the database" });
        } else {
          console.log("terminado", results);
        }
      }
    )
  );
}

export async function deleteSmsCode(phone, code) {
  setTimeout(function () {
    sqliteConnection().then((db) =>
      db.run(
        `DELETE FROM db_smscode WHERE phone = '${phone}' AND code = ${code};`,
        function (err, results) {
          if (err) {
            throw new Error({ message: "Error in the database" });
          } else {
            console.log("terminado", results);
          }
        }
      )
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
