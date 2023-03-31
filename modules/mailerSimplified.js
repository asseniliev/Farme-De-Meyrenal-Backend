"use strict";

async function sendMail(receiverMail, mailTitle, mailText) {
  const nodemailer = require("nodemailer");

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  const userId = process.env.ADMIN_MAIL_ID;
  const password = process.env.ADMIN_MAIL_PASS;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: userId, // your user id for the service
      pass: password, // your password for the service
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.ADMIN_MAIL_ID, // sender address mail
    to: receiverMail, // list of receivers
    subject: mailTitle, // Subject line
    text: mailText, // plain text body
    //html: "<b>Hello world?</b>", // html body
  });
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account

  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

module.exports = sendMail;
