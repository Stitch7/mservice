/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (log, httpClient, sharedCache, scrapers) {
    var clients = {};
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == 'index.js') { return; }
        clients[file.replace('Client.js', '')] = require('./' + file)(log, httpClient, sharedCache, scrapers);
    });
    return clients;
};
