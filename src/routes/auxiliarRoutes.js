import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import multer from "multer";

export const authenticationRoutes = (app) => {
  const upload = multer({ dest: "src/uploads/" });
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
      const image = req.file;
      const fileName = image.filename;
      const fileUrl = `http://localhost:3000/uploads/${fileName}`;

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
        photos: [fileUrl],
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
};