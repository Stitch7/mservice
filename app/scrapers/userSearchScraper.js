/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');

module.exports = function (username, html) {
    var users = [];

    var $tds = $(html).find('tr.bg2 td');
    $tds.each(function () {
        var $td = $(this);
        var userId = /pxmboard.php\?mode=userprofile&brdid=&usrid=(\d+)/.exec($td.find('a').first().attr('href'))[1];
        users.push({
            userId: utils.toInt(userId),
            username: $td.text()
        });
    });

    return users;
};
