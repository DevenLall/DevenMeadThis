const { verify } = require("jsonwebtoken");
const { sign } = require("jsonwebtoken");

const secret = process.env.ACCESS_TOKEN_SECRET;
const expiresIn = "6h";

const decodeToken = (token) => {
  if (!token) return;
  token = token.split(" ")[1];
  if (!token) return;
  const secret = process.env.ACCESS_TOKEN_SECRET;
  return verify(token, secret);
};

const encodeToken = (payload) => {
  const secret = process.env.TOKEN_SECRET;
  return sign(payload, secret, { expiresIn: "1h" });
};

module.exports = { decodeToken, encodeToken };