/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(client, responses) {
    var handlers = {};
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == 'index.js') { return; }
        handlers[file.replace('Handler.js', '')] = require('./' + file)(client, responses);
    });
    return handlers;
};
