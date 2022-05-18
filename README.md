## Docker Execution
#### Step 1 : docker build . -t apsis_ipdc_dana:1.0
#### Step 2 : docker-compose up

## For Non-docker execution
#### With nodemon for development environment: npm run dev
#### Without nodemon : npm run start

## Before You code push to Github, execute the following command step by step -
#### npm run check

This command will format our codebase and wil suggest warning and errors. if you find any issue/warning, then fix it. Until you get zero warning, keep fixing errors and warnings.In case of quick delievery, ignore 20 percentige warning.

## Logger
Important action should be logged. Reference file : log/log.js All instructions can be found on this file.
Code convention:
PascalCase | snake_case | camelCase :: Recommended // we will use it.

## Api Convention :
#### GET
#### POST
#### PUT
#### PATCH #### DELETE

## EXAMPLE ENDPOINT
#### GET = {BASE_URL}/users  i.e Using This endpoint we will get all users list.
#### GET = {BASE_URL}/user/:id  i.e Using This endpoint we will get single user details.
#### POST = {BASE_URL}/user i.e Using this endpoint we will store user.
#### DELETE = {BASE_URL}/user/:id  i.e Using This endpoint we will get single user deletion.
#### PUT/PATCH = {BASE_URL}/user/:id  i.e Using This endpoint we will Update single user Record.
