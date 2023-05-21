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
      console.log("ok");
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
      let exist_email = await User.findOne({ email: user.email });
      if (exist_email) {
        return res.status(400).send({ error: "email already exist " });
      }

      let exist_nickName = await User.findOne({ nickName: user.nickName });
      if (exist_nickName) {
        return res.status(400).send({ error: "nickName already exist " });
      }
      let myuser = await User.create(user);
      //fazer login automatico
      myuser = myuser.toJSON();
      delete myuser.password;
      let token = jwt.sign(myuser, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
      });
      //Envio a resposta
      res.setHeader("auth-token", JSON.stringify(token));
      res.status(201).send(myuser);
    } catch (error) {
      res.status(500).send({ error: "Cant access to the database" });
    }
  });
};
