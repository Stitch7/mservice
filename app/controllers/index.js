/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(log, client, db, responses) {
    var controllers = {};
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == 'index.js') { return; }
        controllers[file.replace('Controller.js', '')] = require('./' + file)(log, client, db, responses);
    });
    return controllers;
};
