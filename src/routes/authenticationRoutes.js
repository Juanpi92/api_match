import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { validate } from "../authorization/auth.js";
import multer from "multer";
import path from "path";

import nodemailer from 'nodemailer'
import { messageHTML } from '../views/email.js';
import { saveCode, deleteCode, checkCode } from '../controlers/codeSqlite.js';


export const authenticationRoutes = (app) => {
  const upload = multer({ dest: "uploads/" });

  app.post("/sms", async (req, res) => {
    try {
      let { phone } = req.body;
      //Create the code to send a SMS with the auth code and storage thesedata in a db.

      res.status(200).send({ message: "o cdigo foi enviado satifatoriamente" });
    } catch (error) {
      res.status(500).send({ message: "Ocurriu um error ao enviar o codigo" });
    }
  });
  app.post("/confirm_code", async (req, res) => {
    let { phone, sms_code, timestamp } = req.body;
    //Check if the user is registered, and then make the login.

    //Create the code to confirm the validation of the SMS code(?).

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

  app.post("/register", async (req, res) => {
    try {
      let {
        name,
        lastName,
        about,
        location,
        preference,
        age,
        gender,
        phone,
        email,
        photos,
        course,
        password,
      } = req.body;
      //Here we encripted the password.
      let hashed_password = await bcrypt.hash(
        password,
        Number(process.env.PASSOS)
      );
      let user = {
        name,
        lastName,
        about,
        location,
        preference,
        age,
        gender,
        phone,
        email,
        photos,
        course,
        password: hashed_password,
      };
      //Checking if the e-mail exist into the database or not.
      let exist_email = await User.findOne({ email: user.email });
      if (exist_email) {
        return res.status(400).send({ error: "E-mail already registered" });
      }
      //Checking if the e-mail exist into the database or not.
      let exist_phone = await User.findOne({ phone: user.phone });
      if (exist_phone) {
        return res.status(400).send({ error: "Phone already registered" });
      }

      let myuser = await User.create(user);

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
      res.status(500).send({ error: "Can't access the database!" });
    }
  });

  //login route
  app.get("/login", async (req, res) => {
    try {
      let user = req.body;
      let password = user.password;
      const login_property = Object.keys(user)[0];
      let value = user[login_property];
      //Tring the user in the database
      let existe = await User.findOne({
        $or: [{ email: value }, { phone: value }],
      });
      if (!existe) {
        return res.status(400).send({ error: "User or password wrong" });
      }
      let valid = await bcrypt.compare(password, existe.password);
      if (!valid) {
        return res.status(400).send({ error: "User or password wrong " });
      }
      //Cast the moongose document into a plain javascript object
      existe = existe.toJSON();
      delete existe.password;
      delete existe.__v;
      let token = jwt.sign(existe, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });
      //Send the response
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(200).send(existe);
    } catch (error) {
      res.status(500).send({ error: "Cant access to the database" });
    }
  });
  app.get("/test_session", validate, async (req, res) => {
    res.status(200).send({ message: "Session dint expire" });
  });

  app.post("/register_photo", upload.single("image"), async (req, res) => {
    try {
      //Checking if the e-mail exist into the database or not.
      let exist_email = await User.findOne({ email: req.body.email });
      if (exist_email) {
        return res.status(400).send({ error: "E-mail already registered" });
      }
      //Checking if the e-mail exist into the database or not.
      let exist_phone = await User.findOne({ phone: req.body.phone });
      if (exist_phone) {
        return res.status(400).send({ error: "Phone already registered" });
      }

      let {
        name,
        lastName,
        about,
        location,
        preference,
        age,
        gender,
        phone,
        email,
        course,
        password,
      } = req.body;

      //Put the photo in he server
      const imagen = req.file;
      const nombreArchivo = imagen.filename;
      const urlArchivo = `http://localhost:3000/uploads/${nombreArchivo}`;

      let hashed_password = await bcrypt.hash(
        password,
        Number(process.env.PASSOS)
      );

      let user = {
        name,
        lastName,
        about,
        location,
        preference,
        age,
        gender,
        phone,
        email,
        photos: [urlArchivo],
        course,
        password: hashed_password,
      };

      //Create the user in the database
      let myuser = await User.create(user);

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
      res.status(500).send({ error: "Can't access the database!" });
    }
  });





  // Email verification routes

  app.post('/code_email', (req, res) => {   // Route responsible for receiving the customer's email and sending a code by email

    const code = Math.floor(Math.random() * 9000) + 1000;   // 4 digit random code generator

    saveCode(req.body.email, code)   // Function that saves the email and code in the database
    deleteCode(req.body.email, code)   // Function that deletes the email and code stored by the above function from the database after 30 seconds

    const transport = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_EMAIL
      }
    })

    const emailConfig =
    {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: 'Código de verificação',
      html: messageHTML(code),
      text: `Código de verificação: ${code}`
    }

    transport.sendMail(emailConfig)
      .then((response) => res.status(200).send({ message: "Enviamos um codigo de confirmacao para seu e-mail!" }))
      .catch((error) => res.status(400)({ message: "Digite um e-mail existente!" }))

  })


  app.post('/check_code', (req, res) => {   // Route responsible for receiving the code and email from the customer to check if the code is correct or expired

    checkCode(req.body.email, req.body.code)
      .then((response) => {
        if (!response) {
          res.status(400).send({ message: "Código inválido ou expirado!" })
        } else {
          res.status(200).send({ message: "Código verificado com sucesso!" })
        }
      })
      .catch((error) => console(error))

  })


};
