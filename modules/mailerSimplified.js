"use strict";

async function sendMail(receiverMail, mailTitle, mailText) {
  const nodemailer = require("nodemailer");

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  const userId = process.env.TELER_ID;
  const password = process.env.TELER_PASS;

  console.log("User ID: " + userId);

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.outlook.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: userId, // your user id for the service
      pass: password, // your password for the service
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.TELER_ID, // sender address mail
    to: receiverMail, // list of receivers
    subject: mailTitle, // Subject line
    text: mailText, // plain text body
    //html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

module.exports = sendMail;
