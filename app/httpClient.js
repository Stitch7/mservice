/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var request = require('request');

var responses = require('./responses.js');
var utils = require('./utils.js');

module.exports = function (serverOptions, errors) {        
    this.baseUrl = serverOptions.maniacUrl;
    this.errors = errors;
    
    var httpSend = function (res, method, options, fn) {
        if ((typeof options === 'string')) {
            options = { uri: options };
        }

        options = utils.extend({
            uri: serverOptions.maniacUrl,
            method: method,
            rejectUnauthorized: false,
            timeout: serverOptions.requestTimeout,
            gzip: true,
            headers: {
                'User-Agent': serverOptions.name,
                'accept-encoding': 'gzip,deflate'
            }
        }, options);

        request(options, function (requestError, requestResponse, requestBody) {
            if (requestError || requestResponse.statusCode !== 200) {
                responses.json(res, null, 'connection');
            } else if (typeof fn === 'function') {
                fn(requestBody, requestResponse);
            }
        });
    };

    this.get = function (res, options, fn) {
        httpSend(res, 'GET', options, fn);
    };

    this.post = function (res, options, fn) {
        httpSend(res, 'POST', options, fn);
    };
};
