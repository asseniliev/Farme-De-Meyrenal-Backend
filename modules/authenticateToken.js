const jwt = require("jsonwebtoken");
var User = require("../models/user");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({
    result: false, error: "No token was provided"
  });
  //console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ result: false, error: "invalid token" });
    } else {
      console.log("Token email: " + user.email);
      const loggedUser = await User.findOne({ email: user.email });
      console.log("Logged user:" + loggedUser);
      if (loggedUser && loggedUser.password !== "") {
        req.user = user;
        next();
      } else {
        return res.status(401).json({
          result: false, error: "No valid user for this token"
        });
      }
    }
  });
}

module.exports = authenticateToken;