FROM oraclelinux:7-slim
RUN yum update -y
RUN yum install -y oracle-release-el7
RUN yum install -y oracle-nodejs-release-el7
RUN yum install -y nodejs
RUN yum install -y oracle-instantclient19.3-basic.x86_64
RUN node --version
RUN npm --version
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --force
COPY . .
CMD ./start.sh