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
    .select("id", "name", "email", "phone", "password", "device_token")
    .where({ email, status: "Active" })
    .first();
  if (!userData || !(md5(`++${password}--`) === userData.password)) {
    res.send(sendApiResult(false, "Oops! Invalid email or Password."));
  } else {
    const userLevel = await knex("APSISIPDC.cr_user_wise_role")
      .innerJoin(
        "APSISIPDC.cr_user_roles",
        "cr_user_roles.id",
        "cr_user_wise_role.role_id"
      )
      .select("cr_user_wise_role.role_id", "cr_user_roles.name")
      .where("cr_user_wise_role.user_id", userData.id)
      .where("cr_user_wise_role.status", 'Active')
      .where("cr_user_roles.status", 'Active')
      .first();

    if (userLevel == undefined) {
      res.send(sendApiResult(false, "Oops! User Wise Level Missing."));
    }

    if (userLevel.role_id == 12) {
      const salesagentUser = await knex("APSISIPDC.cr_sales_agent_user")
        .select("cr_sales_agent_user.sales_agent_id")
        .where("cr_sales_agent_user.user_id", userData.id)
        .where("cr_sales_agent_user.status", 'Active')
        .first();

      userData.salesagent_id = (salesagentUser?.sales_agent_id != undefined) ? salesagentUser?.sales_agent_id : null;

    }

    if (userLevel.role_id == 11) {
      const supervisorUser = await knex("APSISIPDC.cr_supervisor_user")
        .select("cr_supervisor_user.supervisor_id")
        .where("cr_supervisor_user.user_id", userData.id)
        .where("cr_supervisor_user.status", 'Active')
        .first();

      userData.supervisor_id = (supervisorUser?.supervisor_id != undefined) ? supervisorUser?.supervisor_id : null;

    }

    delete userData.password;
    const payload = { userData };
    const options = { expiresIn: process.env.JWT_EXPIRES_IN };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, options);
    const refreshOptions = { expiresIn: process.env.REFRESH_TOKEN_LIFE };
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);
    // await knex("APSISIPDC.cr_users").where("id", userData.id).update({
    //   remember_token: refreshToken,
    // });

    userData.user_level_id = (userLevel?.role_id != undefined) ? userLevel?.role_id : null;
    userData.user_level_name = (userLevel?.name != undefined) ? userLevel?.name : null;
    userData.token = token;
    userData.refreshToken = refreshToken;
    userData.device_token = userData.device_token;

    return res.send(
      sendApiResult(true, "You have Successfully Logged In.", userData)
    );
  }
};

exports.keepAliveDb = async (req, res) => {
  const data = await knex("APSISIPDC.cr_manufacturer").select("id").first().returning("id");
  return data;
};


exports.deviceToken = async(req,res) =>{
  const { id, device_token } = req.body;
  const data = await knex("APSISIPDC.cr_users").where("id", id).update({
    device_token: device_token,
  });
  return res.send(true, "You have Successfully Logged In.", data);

}