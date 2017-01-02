/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

var responses = require('./../app/responses.js');
var routes = require('./../app/routes.js');
var client = require('./../app/clients/')(null, null, null, null);
var controller = require('./../app/controllers/')(null, null);
var handler = require('./../app/handlers/')(null, null);

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
