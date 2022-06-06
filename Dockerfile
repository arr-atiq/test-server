FROM node:latest
RUN npm install -g nodemon
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --force
COPY . .
CMD ./start.sh