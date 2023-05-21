import jwt from "jsonwebtoken";

export const validate = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send("Access Denied");
  } else {
    try {
      const verified = jwt.verify(token, process.env.SECRET_TOKEN);
      req.user = verified;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).send({ mensagem: "Session Expired" });
      }
      res.status(400).send("Invalid Token");
    }
  }
};
