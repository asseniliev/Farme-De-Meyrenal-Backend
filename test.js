var sendMail = require("./modules/mailer");

const receiver = "assen.s.iliev@gmail.com";

sendMail(receiver, "Test Message", "This is a test body");
