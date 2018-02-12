/**
 * M!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');

module.exports = function (html) {
    var $html = $(html);

    var count = {};
    var headerText = $html.find('tr.bg2').first().text();
    var headerRegExResult = /(\d*) Benutzer online \((\d*) sichtbar - (\d*) versteckt\)/.exec(headerText);
    if (headerRegExResult) {
        count = {
            'total': utils.toInt(headerRegExResult[1]),
            'visible': utils.toInt(headerRegExResult[2]),
            'hidden': utils.toInt(headerRegExResult[3])
        };
    }

    var users = [];
    $html.find('tr.bg2 a').each(function () {
        users.push({
            'userId': utils.toInt(/pxmboard.php\?mode=userprofile&brdid=&usrid=(\d+)/.exec($(this).attr('href'))[1]),
            'username': $(this).text().trim()
        });
    });

    return {
        count: count,
        users: users
    };
};
