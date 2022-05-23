const knex = require('../config/database')
const nodemailer = require('nodemailer');

exports.saveMail = async (req, res) => {

    const { type, mail_subject, mail_body } = req.body;

    await knex('APSISIPDC.cr_sendmail').insert([
        { type: type, mail_subject: mail_subject, mail_body: mail_body }
    ])
        .then(data => res.json(data))
        .catch((err) => { res.json(err); throw err })
        .finally(() => {
            //knex.destroy();
        });
}

exports.sendEmail = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const data = await knex('APSISIPDC.cr_sendmail')
        .where('id', id)
        .select(
            'type',
            'mail_subject',
            'mail_body'
        );
    const { type, mail_subject, mail_body } = data[0];

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }

    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: mail_subject,
        html: mail_body

    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};