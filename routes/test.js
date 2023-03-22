var express = require("express");
var router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    result: "Route was found"
  })
})
module.exports = router;