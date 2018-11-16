FROM keymetrics/pm2:10-alpine

# Install app dependencies
COPY package.json .
ENV NPM_CONFIG_LOGLEVEL warn
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install -g node-gyp &&\
  npm install --production && \
  apk del native-deps

# Bundle app files
COPY ecosystem.config.js .
COPY README.md .
COPY LICENSE .
COPY app app/

# Set timezone
ENV TZ="Europe/Berlin"

# Expose the listening port
EXPOSE 8080

# Start the app
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
