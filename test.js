var sendMail = require("./modules/mailerSimplified");

const receiver = "assen.s.iliev@gmail.com";

sendMail(receiver, "Test Message", "This is a test body");
