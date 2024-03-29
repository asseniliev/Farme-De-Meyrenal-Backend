var express = require("express");
var sendMail = require("../modules/mailerSimplified");
var router = express.Router();

router.post("/notify", async (req, res) => {

  await sendMail(process.env.FLAV_MAIL_ID, "Notification from client", req.body.text);

  res.json({ result: true });
});

module.exports = router;
