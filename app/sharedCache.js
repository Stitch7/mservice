/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var redis = require('redis');
var client, log;

exports.connect = function (logger, options) {
    client = redis.createClient(options);
    log = logger;

    client.on('error', function (error) {
        log.error('Redis Error: ' + error);
    });

    client.on('connect', function () {
        log.info('Shared cache connection established to redis://' + options.host + ':' + options.port);
    });

    client.on('ready', function () {
        log.info('Shared cache is ready');
    });
};

exports.getAndReturnOrFetch = function (key, ttl, resultCallback, fetchCallback) {
    if (!client) {
        fetchCallback();
    }

    client.get(key, function(error, data) {
        if (error) {
            log.error('Failed to read shared cache data for key: ' + key + ' , error: ' + error);
            return;
        }
        if (data) {
            resultCallback(JSON.parse(data));
            return;
        }

        fetchCallback(function (fetchedData, fetchError) {
            resultCallback(fetchedData, fetchError);
            if (!fetchError) {
                client.set(key, JSON.stringify(fetchedData), 'EX', ttl);
            }
        });
    });
};

exports.del = function (key) {
    if (client) {
        client.del(key);
    }
};
