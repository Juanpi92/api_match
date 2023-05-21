import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authenticationRoutes = (app) => {
  app.post("/sms", async (req, res) => {
    let { phone } = req.body;
    //Create the code to send the sms with the auth code
  });
  app.post("/confirm_code", async (req, res) => {
    let { phone, sms_code } = req.body;
    //Conferir se o usuario ta cadastrado e entao fazer o login

    //Create the code confirm the validation of the sms code
  });

  app.post("/register", async (req, res) => {
    try {
      let {
        name,
        lastName,
        nickName,
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
      //Here we encripted the password
      let hashed_password = await bcrypt.hash(
        password,
        Number(process.env.PASSOS)
      );
      let user = {
        name,
        lastName,
        nickName,
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
      // Checking if the email exist into de database or not
      let exist_email = await Usuario.findOne({ email: user.email });
      if (exist_email) {
        return res.status(400).send({ error: "email already exist " });
      }

      let exist_nickName = await Usuario.findOne({ nickName: user.nickName });
      if (exist_nickName) {
        return res.status(400).send({ error: "nickName already exist " });
      }
      let myuser = await User.create(user);
      //res.status(201).send({ message: "User Registered Successfully " });
      res.status(201).send(myuser);
      //fazer login automatico
    } catch (error) {
      res.status(500).send({ error: "Cant access to the database" });
    }
  });

  /*
  app.get("/login", async (req, res) => {
    try {
      let { email, password } = req.body;
      let existe = await Usuario.findOne({ email: email });
      // OJO puede ser interesante  let existe = await Usuario.findOne({ email: email }, "-password");
      console.log(existe);
      if (!existe) {
        return res.status(400).send({ error: "User or password wrong" });
      }
      let valid = await bcrypt.compare(password, existe.password);
      if (!valid) {
        return res.status(400).send({ error: "User or password wrong " });
      }
      //Então encontrou o usuario na bd
      //Convierto de documento de moongose a plain javascript object
      //existe = existe.toObject();
      existe = existe.toJSON();
      delete existe.password;
      let token = jwt.sign(existe, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });
      //Envio a resposta
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(200).send({ user: existe });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Cant access to the database" });
    }
  });*/
};
