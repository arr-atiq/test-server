require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("pino")();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { informationLog, errorLog } = require("./log/log");
const { PORT, NODE_ENV } = process.env;

// process.on('uncaughtException', (ex) => {
//   errorLog.error({
//     message: 'uncaughtException',
//     exception: ex,
//     time: Date.now(),
//   });
//   process.exit(1);
// });

// process.on('unhandledRejection', (ex) => {
//   errorLog.error({
//     message: 'unhandledRejection',
//     exception: ex,
//     time: Date.now(),
//   });
//   process.exit(1);
// });

const app = express();
app.use(express.static(`${__dirname}/public`));
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
  })
);

app.get("/", (req, res) =>
  res.json({ message: "Apsis Dana platform is up and running" })
);
require('./routes')(app);

const swaggerDocument = YAML.load("./swagger.yaml");
swaggerDocument.host = process.env.HOSTIP.split("//")[1];
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  logger.info(`App on ${NODE_ENV} is running on port ${PORT}`);
  informationLog.info({ message: "Application restarted", time: Date.now() });
});
