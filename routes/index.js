const jwt = require("jsonwebtoken");
const { decodeToken } = require("../controllers/helper");
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) {
      return res.sendStatus(403);
    }
    const userId = await decodeToken(token);
    req.user_id = userId;
    next();
  });
}

module.exports = function (app) {
  app.use("/login", require("./login"));
  app.use("/bulk", authenticateToken, require("./bulk"));
  app.use("/menu", authenticateToken, require("./menu"));
  app.use("/user", authenticateToken, require("./user"));
  app.use("/manufacturer", authenticateToken, require("./manufacturer"));
  app.use("/distributor", authenticateToken, require("./distributor"));
  app.use("/supervisor", authenticateToken, require("./supervisor"));
  app.use("/salesagent", authenticateToken, require("./salesagent"));
  app.use("/scheme", authenticateToken, require("./scheme"));
  app.use("/mail", authenticateToken, require("./mail"));
  app.use("/retailer", authenticateToken, require("./Retailer"));
  app.use("/loan", authenticateToken, require("./loan"));
  app.use("/job", require("./Cronjob"));
}