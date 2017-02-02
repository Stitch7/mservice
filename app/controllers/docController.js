/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');
var marked = require('marked');

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Index action
         */
        index: function (req, res, next) {
            fs.readFile(path.resolve(__dirname, '../views/doc.html'), 'utf8', function (error, data) {
                if (error) {
                    req.log.error({ req: req }, error);
                    responses.json(res, null, 'httpInternalServerError');
                    return;
                }
                var indexHtml = data;
                fs.readFile(path.resolve(__dirname, '../../README.md'), 'utf8', function (error, data) {
                    if (error) {
                        req.log.error({ req: req }, error);
                        responses.json(res, null, 'httpInternalServerError');
                        return;
                    }

                    var html = indexHtml.replace(/<!-- README.md -->/, marked(data));
                    responses.html(res, html, error, next);
                });
            });
        }
    };
};
