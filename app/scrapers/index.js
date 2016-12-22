/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var path = require('path');

var scrapers = {};
fs.readdirSync(__dirname).forEach(function(file) {
    if (file == 'index.js') { return; }
    scrapers[file.replace('Scraper.js', '')] = require('./' + file);
});

module.exports = scrapers;
