/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var restify = require('restify');
var nodeCache = require('node-cache');
var bunyan = require('bunyan');

var db = require('./db.js');
var errors = require('./errors.js');
var httpClient = require('./httpClient.js');
var responses = require('./responses.js');
var routes = require('./routes.js');
var scrapers = require('./scrapers/');
var utils = require('./utils.js');

var defaultOptions = {
    name: 'M!service',
    port: 8080,
    maniacUrl: 'https://maniac-forum.de/forum/pxmboard.php',
    log: {
        disabled: false,
        verbose: true,
        file: false
    },
    requestTimeout: 10000,
    db: {
        host: process.env.MSERVICEDB_PORT_27017_TCP_ADDR || 'localhost',
        port: process.env.MSERVICEDB_PORT_27017_TCP_PORT || '27017',
        name: '/mservice'
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

        db.connect(options.db, function(err) {
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
                server.use(restify.authorizationParser());
                server.use(restify.bodyParser());
                server.use(restify.gzipResponse());

                var cache = new nodeCache();
                var client = require('./clients/')(log, new httpClient(options, errors), cache, scrapers);
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
