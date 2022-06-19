require("dotenv").config();
require("oracledb");
const {DB_CLIENT_ORACLE,DB_HOST_ORACLE,DB_USER_ORACLE,DB_PASSWORD_ORACLE,DB_NAME_ORACLE,DB_PORT} = process.env;
module.exports = {
  development: {
    client: DB_CLIENT_ORACLE,
    connection: {
      host: DB_HOST_ORACLE,
      user: DB_USER_ORACLE,
      password: DB_PASSWORD_ORACLE,
      database: DB_NAME_ORACLE,
      port: DB_PORT,
      connectString:
        "(DESCRIPTION= (ADDRESS_LIST=  (ADDRESS=(PROTOCOL=TCP) (HOST=192.168.20.38)(PORT=1521) ) ) (CONNECT_DATA=(SID=orcl) ) )",
    },
    acquireConnectionTimeout: 843600000,
    pool: {
        min: 2,
        max: 150,
        acquireTimeoutMillis: 100000,
        idleTimeoutMillis: 100000
    },
  }
};
