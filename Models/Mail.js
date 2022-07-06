const knex = require("../config/database");
const nodemailer = require("nodemailer");

const { EMAIL,EMAIL_PASS,EMAIL_SERVICE,EMAIL_PORT} = process.env;


const transportOptions = {
  host: EMAIL_SERVICE,
  port: EMAIL_PORT,
  auth: { user: EMAIL, pass: EMAIL_PASS },
  secureConnection: true,
  tls: { ciphers: 'SSLv3' }
};

exports.saveMail = async (req, res) => {
  const { type, mail_subject, mail_body } = req.body;
  await knex("APSISIPDC.cr_sendmail")
    .insert([{ type: type, mail_subject: mail_subject, mail_body: mail_body }])
    .then((data) => res.json(data))
    .catch((err) => {
      res.json(err);
      throw err;
    })
    .finally(() => {
      //knex.destroy();
    });
};

exports.sendEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const data = await knex("APSISIPDC.cr_sendmail")
    .where("id", id)
    .select("type", "mail_subject", "mail_body");
  const { type, mail_subject, mail_body } = data[0];

  const transporter = nodemailer.createTransport(transportOptions);
  const mailOptions = {
    from: FROM,
    to: "asad.zaman@apsissolutions.com",
    subject: "Email Functionality Quick Test",
    html: "This is a test message!\n",
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log({
        message: "Email sent" + info.response,
        time: Date.now(),
      });
    }
  });
};


 
exports.sendEmailTemp = async (req, res) => {
const transporter = nodemailer.createTransport(transportOptions);
console.log('mailbody',req.body)

const mailOptions = {
  from: FROM,
  to: req.body.email,
  subject: req.body.mail_subject,
  html: req.body.mail_body,
};

console.log('mailOptions',mailOptions)

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      informationLog.error(error);
    } else {
      informationLog.info({
        message: "Email sent" + info.response,
        time: Date.now(),
      });
    }
  });
};



