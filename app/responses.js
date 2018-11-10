/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var errors = require('./errors.js');

module.exports = {
    json: function (res, data, error, next) {
        var status = 200;
        var json  = data || '';

        if (error) {
            status = errors.codes[error];
            if (!json) {
                json  = { error: errors.messages[error] };
            }
        }

        res.status(status);
        res.contentType = 'application/json';
        res.charSet('utf-8');
        res.send(json);

        if (typeof next === 'function') {
            next();
        }
    },
    html: function (res, html, error, next) {
        res.writeHead(200, {
            //'Content-Length': Buffer.byteLength(html),
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write(html);
        res.end();

        if (typeof next === 'function') {
            next();
        }
    }
};
