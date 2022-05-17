// ref: https://devhints.io/knex
// TODO: implement more dynamic env var settings loader
require('dotenv').config();
require('oracledb');

module.exports = {
  development: {
    client: process.env.DB_CLIENT_ORACLE,
    connection: {
      host: process.env.DB_HOST_ORACLE,
      user: process.env.DB_USER_ORACLE,
      password: process.env.DB_PASSWORD_ORACLE,
      database: process.env.DB_NAME_ORACLE,
      port: process.env.DB_PORT,
      connectString:
        '(DESCRIPTION= (ADDRESS_LIST=  (ADDRESS=(PROTOCOL=TCP) (HOST=192.168.20.38)(PORT=1521) ) ) (CONNECT_DATA=(SID=orcl) ) )',
    },
  },
  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
};
