/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

var utils = require('./../utils.js');

module.exports = function (html) {
    var $latestUserA = $(html).find('a[href^="pxmboard.php?mode=userprofile"]');
    var userId = utils.toInt(/pxmboard.php\?mode=userprofile&brdid=&usrid=(.+)/.exec($latestUserA.attr('href'))[1]);
    var username = $latestUserA.text();

    return {
        userId: userId,
        username: username
    };
};