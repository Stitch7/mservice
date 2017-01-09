FROM node:7.2

RUN npm install pm2 -g

WORKDIR /App

ADD package.json package.json
RUN npm install
ADD . .

EXPOSE 8080

ENV TZ="Europe/Berlin"

CMD ["pm2-docker", "--raw", "mservice.js", "--verbose-logging"]
