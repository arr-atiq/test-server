require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const logger = require('pino')();
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const { informationLog, errorLog } = require('./log/log');
const { decodeToken } = require('./controllers/helper');


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
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type',
  );
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
  }),
);

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
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

app.get('/', (req, res) => res.json({ message: 'Apsis Dana platform is up and running' }));
app.use('/login', require('./routes/login'));
app.use('/bulk', authenticateToken, require('./routes/bulk'));
app.use('/menu', authenticateToken, require('./routes/menu'));
app.use('/manufacturer', authenticateToken, require('./routes/manufacturer'));
app.use('/distributor', authenticateToken, require('./routes/distributor'));
app.use('/supervisor', authenticateToken, require('./routes/supervisor'));
app.use('/salesagent', authenticateToken, require('./routes/salesagent'));
app.use('/scheme', authenticateToken, require('./routes/scheme'));
app.use('/temp' , authenticateToken, require('./routes/scheme'))
app.use('/job', require('./routes/Cronjob'));

const swaggerDocument = YAML.load('./swagger.yaml');
swaggerDocument.host = process.env.HOSTIP.split('//')[1];
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  logger.info(`App on ${NODE_ENV} is running on port ${PORT}`);
  informationLog.info({ message: 'Application restarted', time: Date.now() });
});
