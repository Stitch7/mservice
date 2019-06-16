/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');

module.exports = function (username, html) {
    var firsrA = $(html).find('a').first().attr('href');
    var userId = /pxmboard.php\?mode=userprofile&brdid=&usrid=(\d+)/.exec(firsrA)[1];

    return userId;
};
