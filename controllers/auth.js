const jwt = require("jsonwebtoken");
const md5 = require("md5");
const knex = require("../config/database");
const { sendApiResult } = require("./helper");

exports.refreshToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400);
  }
  const data = await knex("cr_users")
    .select(
      "id",
      "name",
      "email",
      "phone",
      "cr_user_type",
      "password",
      "id_fi",
      "remember_token"
    )
    .where({ email })
    .first();

  if (data.remember_token !== req.body.refreshToken) {
    return res.sendStatus(401);
  }
  delete data.remember_token;
  const payload = { data };
  const options = { expiresIn: process.env.JWT_EXPIRES_IN };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, options);
  const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
  await knex("cr_users").where("id", data.id).update({
    remember_token: refreshToken,
  });
  const output = { token, refreshToken };
  return res.json(output);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400);
  }

  const userData = await knex("APSISIPDC.cr_users")
    .select("id", "name", "email", "phone", "password")
    .where({ email, status: "Active" })
    .first();

  if (!userData || !(md5(`++${password}--`) === userData.password)) {
    res.send(sendApiResult(false, "Oops! Invalid email or Password."));
  } else {
    delete userData.password;
    const payload = { userData };
    const options = { expiresIn: process.env.JWT_EXPIRES_IN };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, options);
    const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
    await knex("APSISIPDC.cr_users").where("id", userData.id).update({
      remember_token: refreshToken,
    });

    // delete userData.id;
    userData.token = token;
    userData.refreshToken = refreshToken;

    return res.send(
      sendApiResult(true, "You have Successfully Logged In.", userData)
    );
  }
};
