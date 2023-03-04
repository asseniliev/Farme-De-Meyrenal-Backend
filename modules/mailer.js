"use strict";

async function sendMail(receiverMail, mailTitle, mailText) {
  const nodemailer = require("nodemailer");
  const { google } = require("googleapis");
  const OAuth2 = google.auth.OAuth2;

  // const EMAIL = "assen1.iliev1@gmail.com";
  // const REFRESH_TOKEN =
  //   "1//04kcOV39-gGhTCgYIARAAGAQSNwF-L9IrPtlxgDkDvAccyvf_d3tlpi9bnHA6bBPImf_n4Ve8DvOQ7DRxQmWzc4dfqesjle9unbo";
  // const CLIENT_SECRET = "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";
  // const CLIENT_ID =
  //   "653361233410-cu4g3crv0kb1m85l8mu2l00koumaclef.apps.googleusercontent.com";

  const createTransporter = async () => {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    return transporter;
  };

  //emailOptions - who sends what to whom
  const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };

  sendEmail({
    subject: mailTitle,
    text: mailText,
    to: receiverMail,
    from: process.env.EMAIL,
  });

  console.log("Mail sent");
}

module.exports = sendMail;
