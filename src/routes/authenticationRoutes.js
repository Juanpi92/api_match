import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import multer from "multer";
import nodemailer from "nodemailer";
import axios from "axios";
import { messageHTML } from "../views/email.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

import express from "express";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

import {
  saveEmailCode,
  deleteEmailCode,
  checkEmailCode,
  saveSmsCode,
  deleteSmsCode,
  checkSmsCode,
  randomCodeGenerator,
} from "../controllers/codeSqlite.js";

///////////////////////////// SMS ROUTES

export const authenticationRoutes = (app) => {
  const upload = multer({ storage: multer.memoryStorage() });
  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
    region: process.env.BUCKET_REGION,
  });

  app.post("/send_sms", async (req, res) => {
    try {
      let token = process.env.SMS_API_TOKEN;
      const code = randomCodeGenerator();

      saveSmsCode(req.body.phone, code);
      deleteSmsCode(req.body.phone, code);

      const apiUrl = "https://apihttp.disparopro.com.br:8433/mt";

      const reqData = [
        {
          numero: req.body.phone,
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
      res.status(200).send({
        message: "We sent a confirmation code to your sms!",
      });
    } catch (error) {
      res.status(400).send(error);
    }
  });

  //Check if the user is registered, and then make the login.

  app.post("/check_sms", async (req, res) => {
    let { phone, code, timestamp } = req.body;
    // Route responsible for receiving the code and email from the customer to check if the code is correct or expired
    try {
      let check = await checkSmsCode(req.body.phone, req.body.code);
      if (!check) {
        return res.status(400).send({ message: "Invalid or expired code!" });
      }
      let exist_phone = await User.findOne({ phone: req.body.phone });
      if (!exist_phone) {
        return res
          .status(202)
          .send({ message: "Continue with customer registration" });
      }
      //Completar o cadastro
      if (exist_phone.complete_register === false) {
        let myuser = exist_phone.toJSON();
        delete myuser.password;
        delete myuser.__v;
        //Sending the user and the token.
        return res.status(403).send(myuser);
      }

      //Doing the automatic login.
      let myuser = exist_phone.toJSON();
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
    let myuser = User.findOne({ phone: phone });
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

  app.post("/send_email", async (req, res) => {
    // Route responsible for receiving the customer's email and sending a code by email
    const code = randomCodeGenerator();

    saveEmailCode(req.body.email, code); // Function that saves the email and code in the database
    deleteEmailCode(req.body.email, code); // Function that deletes the email and code stored by the above function from the database after 30 seconds
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
  });

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
      let imagen = await sharp(req.file.buffer)
        .resize({ heigth: 1920, width: 1080, fit: "contain" })
        .toBuffer();
      //Send the image to S3
      if (!req.file) {
        return res.status(400).send({ error: "Nenhuma imagem fornecida" });
      }

      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `profile${req.params.id}`,
        Body: imagen,
        ContentType: req.file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);

      //Update the User
      let myuser = await User.findByIdAndUpdate(
        req.params.id,
        { photo_profile: `profile${req.params.id}`, complete_register: true },
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

      //Creating an temporary url for the bucket object
      let getObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `profile${req.params.id}`,
      };

      const command2 = new GetObjectCommand(getObjectParams);
      myuser.photo_profile = await getSignedUrl(s3, command2, {
        expiresIn: 10800,
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
