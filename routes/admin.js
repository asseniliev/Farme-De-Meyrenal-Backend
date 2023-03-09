var express = require("express");
var sendMail = require("../modules/mailerSimplified");
var router = express.Router();

router.post("/notify", async (req, res) => {
  const mailReceiver = "assen.s.iliev@gmail.com";

  await sendMail(mailReceiver, "Notification from client", req.body.text);

  res.json({ result: true });
});

module.exports = router;
