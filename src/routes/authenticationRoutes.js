import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import multer from "multer";
import nodemailer from "nodemailer";
import axios from "axios";
import { messageHTML } from "../views/email.js";

import express from "express";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

import {
  saveCode,
  deleteCode,
  checkCode,
  randomCodeGenerator,
} from "../controllers/codeSqlite.js";

export const authenticationRoutes = (app) => {
  const upload = multer({ dest: "src/uploads/" });

  app.post("/send_code", async (req, res) => {
    try {
      const code = randomCodeGenerator();
      // method    == phone // email
      // methodRes == 12345 // joao@gmail.com
      
      // PHONE
      if ('phone' in req.body) {
        var method = 'phone'
        var methodRes = req.body.phone

        let token = process.env.SMS_API_TOKEN;
        const apiUrl = "https://apihttp.disparopro.com.br:8433/mt";

        const reqData = [
          {
            numero: methodRes,
            servico: "short",
            mensagem: `Seu código é: [ ${code} ]. Não compartilhe com terceiros.`,
            codificacao: "0",
          },
        ];

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const response = await axios.post(apiUrl, reqData, { headers });
        res.status(200).send({
          message: "We sent a confirmation code to your sms!",
        })
      }

      // EMAIL
      else if ('email' in req.body) {
        var methodRes = req.body.email

        const transport = nodemailer.createTransport({
          host: "smtp.office365.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD_EMAIL,
          },
        });

        const emailConfig = {
          from: process.env.EMAIL,
          to: req.body.email,
          subject: "Código de verificação",
          html: messageHTML(code),
          text: `Código de verificação: ${code}`,
        };

        transport
          .sendMail(emailConfig)
          .then((response) =>
            res.status(200).send({
              message: "We sent a confirmation code to your email!",
            })
          )
          .catch((error) =>
            res.status(400).send({ message: "Enter an existing email!" })
          );
      }
      else {
        res.send(`Nenhum método encontrado`)
      }

      saveCode(methodRes, code)
      deleteCode(methodRes, code)

      console.log(`Método: ${methodRes}`)

    } catch (error) {
      console.log(error)
    }


  })

  //Check if the user is registered, and then make the login.

  app.post("/check_code", async (req, res) => {
    try {
        const code = randomCodeGenerator();
        // method    == phone // email
        // methodRes == 12345 // joao@gmail.com
        
        // PHONE
        if ('phone' in req.body) {
          var method = 'phone'
          var methodRes = req.body.phone
        } else if ('email' in req.body) {
          var method = 'email'
          var methodRes = req.body.email
        }
      let check = await checkCode(methodRes, code);
      if (!check) {
        return res.status(400).send({ message: "Invalid or expired code!" });
      }
      let exist_method = await User.findOne({ method: methodRes });
      if (!exist_method) {
        return res.status(202).send({ message: "Continue with customer registration" });
      }
      //Completar o cadastro
      if (exist_method.complete_register === false) {
        let myuser = exist_method.toJSON();
        delete myuser.password;
        delete myuser.__v;
        //Sending the user and the token.
        return res.status(403).send(myuser);
      }

      //Doing the automatic login.
      let myuser = exist_method.toJSON();
      delete myuser.password;
      delete myuser.__v;
      let token = jwt.sign(myuser, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });

      //Sending the user and the token.
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(200).send(myuser);
    } catch (error) {
      res.status(500).send(error);
    }

    //If the code is ok we proceed to auto login
    let myuser = User.findOne({ method: methodRes });
    myuser = myuser.toJSON();
    delete myuser.password;
    let token = jwt.sign(myuser, process.env.SECRET_TOKEN, {
      expiresIn: "2h",
    });
    //Sending the user and the token.
    res.setHeader("auth-token", JSON.stringify(token));
    res.status(201).send(myuser);
  });

  ///////////////////////////// EMAIL ROUTES

// apagar se o check unico brabo (acima) estiver funcionando
/*
  app.post("/check_email", async (req, res) => {
    // Route responsible for receiving the code and email from the customer to check if the code is correct or expired
    try {
      let check = await checkEmailCode(req.body.email, req.body.code);
      if (!check) {
        return res.status(400).send({ message: "Invalid or expired code!" });
      }
      let exist_email = await User.findOne({ email: req.body.email });
      if (!exist_email) {
        return res
          .status(202)
          .send({ message: "Continue with customer registration" });
      }
      //Completar o cadastro
      if (exist_email.complete_register === false) {
        let myuser = exist_email.toJSON();
        delete myuser.password;
        delete myuser.__v;
        //Sending the user and the token.
        return res.status(403).send(myuser);
      }

      //Doing the automatic login.
      let myuser = exist_email.toJSON();
      delete myuser.password;
      delete myuser.__v;
      let token = jwt.sign(myuser, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });

      //Sending the user and the token.
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(200).send(myuser);
    } catch (error) {
      res.status(500).send(error);
    }
  });
*/

  app.post("/register_part1", async (req, res) => {
    let { email, phone, name, lastName, birth_date, gender } = req.body;
    let user = {
      email,
      phone,
      name,
      lastName,
      birth_date,
      gender,
    };
    try {
      let myuser = await User.create(user);
      res.status(200).send({ id: myuser._id });
    } catch (error) {
      res.status(500).send({ message: "Cant access the database" });
    }
  });

  app.patch("/register_part2/:id", upload.single("image"), async (req, res) => {
    //Put the photo in the server
    try {
      const image = req.file;
      const fileName = image.filename;
      const fileUrl = `http://localhost:3000/src/uploads/${fileName}`;
      //Update the User
      let myuser = await User.findByIdAndUpdate(
        req.params.id,
        { photos: [fileUrl], complete_register: true },
        {
          new: true,
        }
      );
      //Doing the automatic login.
      myuser = myuser.toJSON();
      delete myuser.password;
      delete myuser.__v;
      let token = jwt.sign(myuser, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });

      //Sending the user and the token.
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(201).send(myuser);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Cant access the database" });
    }
  });
};

// 253