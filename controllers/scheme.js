const logger = require('pino')();
module.exports.createScheme = (req,res) =>{
  logger.info(req.user_id);
  return res.status(201).send({
      "message" : "scheme created!",
      "request" : req.user_id
  });
}