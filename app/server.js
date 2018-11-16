/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var restify = require('restify');
var bunyan = require('bunyan');

var sharedCache = require('./sharedCache.js');
var db = require('./db.js');
var errors = require('./errors.js');
var httpClient = require('./httpClient.js');
var responses = require('./responses.js');
var routes = require('./routes.js');
var scrapers = require('./scrapers/');
var utils = require('./utils.js');

var defaultOptions = {
    name: 'm!service',
    port: 8080,
    maniacUrl: 'https://maniac-forum.de/forum/pxmboard.php',
    // maniacUrl: 'https://maniacs.io/forum/pxmboard.php',
    log: {
        disabled: false,
        verbose: true,
        file: false
    },
    requestTimeout: 10000,
    redis: {
        host: process.env.MSERVICECACHE_PORT_6379_TCP_ADDR || 'localhost',
        port: process.env.MSERVICECACHE_PORT_6379_TCP_PORT || '6379'
    },
    mongo: {
        host: process.env.MSERVICEDB_PORT_27017_TCP_ADDR || 'localhost',
        port: process.env.MSERVICEDB_PORT_27017_TCP_PORT || '27017',
        name: 'mservice'
    }
};

module.exports = function () {
    var self = {};
    self.defaultOptions = defaultOptions;
    self.run = function(options) {
        options = utils.extend(defaultOptions, options);
        var log;
        if (!options.log.disabled) {
            log = bunyan.createLogger({
                name: options.name,
                streams: [(options.log.file ? { path: options.log.file } : { stream: process.stdout })],
                serializers: bunyan.stdSerializers
            });
        }

        sharedCache.connect(log, options.redis);

        db.connect(options.mongo, function(err) {
            if (err) {
                if (log) {
                    log.error('Unable to connect to database! Error:', err);
                }
                process.exit(1);
            } else {
                if (log) {
                    log.info('Database connection established to', db.url);
                }

                var server = restify.createServer({
                    name: options.name,
                    log: log
                });
                server.pre(restify.pre.sanitizePath());
                server.use(restify.plugins.authorizationParser());
                server.use(restify.plugins.bodyParser({mapParams: true}));
                server.use(restify.plugins.gzipResponse());
                // server.use(restify.plugins.CORS()); // TODO

                var client = require('./clients/')(log, new httpClient(options, errors), sharedCache, scrapers);
                var handler = require('./handlers/')(client, responses);
                server.on('uncaughtException', handler.exception);
                server.on('NotFound', handler.notFound);
                server.on('MethodNotAllowed', handler.methodNotAllowed);
                if (options.log.verbose) {
                    server.on('after', handler.logRequest);
                }

                // Dispatch routes
                var controller = require('./controllers/')(log, client, db, responses);
                routes(server, handler, controller);

                server.listen(options.port, function () {
                    if (!log) {
                        return;
                    }
                    log.info(options.name + ' started listening at ' + server.url);
                });
            }
        });
    };
    return self;
};
