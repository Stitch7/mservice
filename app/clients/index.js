/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (httpClient, scrapers) {
    var clients = {};    
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == 'index.js') { return; }
        clients[file.replace('Client.js', '')] = require('./' + file)(httpClient, scrapers);
    });
    return clients;
};
