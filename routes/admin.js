var express = require("express");
var sendMail = require("../modules/mailerSimplified");
var router = express.Router();

router.post("/notify", async (req, res) => {
  const mailReceiver = "andres_flavien@outlook.fr";

  await sendMail(mailReceiver, "Notification from client", req.body.text);

  res.json({ result: true });
});

module.exports = router;
