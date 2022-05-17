For Docker Execution
Step 1 : docker build . -t apsis_ipdc_dana:1.0
Step 2 : docker-compose up

For Non-docker execution
With nodemon for development environment: npm run dev
Without nodemon : npm run start

Before You code push to Github, execute the following command step by step -
$ npm run check
This command will format our codebase and wil suggest warning and errors. if you find any issue/warning, then fix it. Until you get zero warning, keep fixing errors and warnings.
In case of quick delievery, ignore 20% warning.

Logger:
Important action should be logged. Reference file : log/log.js All instructions can be found on this file.

Code convention:
PascalCase
snake_case
camelCase :: Recommended // we will use it
