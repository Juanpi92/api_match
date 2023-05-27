import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { validate } from "../authorization/auth.js";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import { messageHTML } from "../views/email.js";
import { saveCode, deleteCode, checkCode, randomCodeGenerator } from "../controllers/codeSqlite.js";

// API SMS imports PROXIMO PASSO: 
var unirest = require("unirest");

export const authenticationRoutes = (app) => {
  const upload = multer({ dest: "uploads/" });

  app.post("/sms", async (req, res) => {

    const code = randomCodeGenerator()
    try {
      let req = unirest("POST", "https://apihttp.disparopro.com.br:8433/mt");
      let { phone } = req.body;
      let token = process.env.SMS_API_TOKEN

      //Send the SMS
      req.headers({
        "content-type": "application/json",
        "authorization": `Bearer ${token}`
      });
      req.type("json");

      req.send([
        {
          "numero": `${phone}`,
          "servico": "short",
          "mensagem": `Seu código é: [ ${code} ]. Não compartilhe com terceiros.`,
          "codificacao": "0"
        }
      ]);

      req.end(function (res) {
        if (res.error) throw new Error(res.error);
        console.log(res.body);
      });

      res.status(200).send({ message: "the code was sent successfully" });
    } catch (error) {
      res.status(500).send({ message: "An error occurred while sending the code" });
    }
  });
  app.post("/confirm_code", async (req, res) => {
    let { phone, code, timestamp } = req.body;
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
      //Checking if the phone exist into the database or not.
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

  app.post("/code_email", (req, res) => {
    // Route responsible for receiving the customer's email and sending a code by email
    const code = randomCodeGenerator()

    saveCode(req.body.email, code); // Function that saves the email and code in the database
    deleteCode(req.body.email, code); // Function that deletes the email and code stored by the above function from the database after 30 seconds
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

  app.post("/check_code", async (req, res) => {
    // Route responsible for receiving the code and email from the customer to check if the code is correct or expired
    try {
      let check = await checkCode(req.body.email, req.body.code);
      if (!check) {
        return res
          .status(400)
          .send({ message: "Invalid or expired code!" });
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

    // check if i can do the register or the automatic login
  });
};
