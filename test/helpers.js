/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = {
    scrapers: require('./../app/scrapers/'),
    loadHtmlRessource: function (filename, completionHandler) {
        fs.readFile(path.resolve(__dirname, './ressources/html/' + filename + '.html'), 'utf8', function (error, html) {
            completionHandler(error, html);
        });
    },
    loadJsonRessource: function (filename, completionHandler) {
        fs.readFile(path.resolve(__dirname, './ressources/json/' + filename + '.json'), 'utf8', function (error, html) {
            completionHandler(error, html);
        });
    }
};
