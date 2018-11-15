FROM keymetrics/pm2:10-alpine

# Bundle app files
COPY app app/
COPY README.md .
COPY LICENSE .
COPY package.json .
COPY ecosystem.config.js .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install -g node-gyp &&\
  npm install --production && \
  apk del native-deps

# Set timezone
ENV TZ="Europe/Berlin"

# Expose the listening port
EXPOSE 8080

# Start the app
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
