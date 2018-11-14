/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var request = require('request');

var responses = require('./../responses.js');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, username, password, fn) {
        var options = {
            form: {
                mode: 'login',
                nick: username,
                pass: password
            }
        };

        httpClient.post(res, options, function(html, response) {
            var validLogin = scrapers.login(html);
            if (!validLogin) {
                responses.json(res, null, 'login', null);
                return;
            }

            var cookieString = response.headers['set-cookie'][0].split(';')[0];
            var cookie = request.cookie(cookieString);
            var jar = request.jar();
            jar.setCookie(cookie, httpClient.baseUrl);
            res.jar = jar;

            fn(res);
        });
    };
};