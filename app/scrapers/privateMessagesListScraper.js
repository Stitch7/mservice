/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

var utils = require('./../utils.js');

module.exports = function (html, type, limit) {
    limit = limit || false;
    var messages = [];
    var $html = $(html);
    var $bg1TDs = $html.find('body table tr.bg2');

    $bg1TDs.each(function (key, value) {
        if (limit && limit <= key) {
            return;
        }

        var tds = $(this).find('td');

        var message = {};
        message.type = type;
        message.msgid = /pxmboard.php\?mode=privatemessage&type=(out|in)box&msgid=(\d+)/.exec($(tds.get(0)).find('a').attr('href'))[2];
        message.subject = $(tds.get(0)).text();
        message.username = $(tds.get(1)).text().trim();
        message.date = utils.datetimeStringToISO8601($(tds.get(2)).text());

        messages.push(message);
    });

    return messages;
};
