/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');
var thread = require('./../models/thread.js');

module.exports = function(html) {
    var thread = [];
    var $htmlEntityDecodeHelper = $('<div/>');
    var parseThreadMessage = function ($li, level, $htmlEntityDecodeHelper) {
        var messageId = utils.toInt(/pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($li.find('span a').attr('href'))[1]);
        var subject = $li.find('span a font').text();

        var userAndDateHtml = $li.find('span > font').html();
        var userAndDateRegExp = /<b>\n<span class="(.*)">\n(.+)\n<\/span>\n<\/b>\s-\s(.+)/;
        var userAndDateRegExpResult = userAndDateRegExp.exec(userAndDateHtml);
        var mod = userAndDateRegExpResult[1] === 'highlight';
        var username = $htmlEntityDecodeHelper.empty().append(userAndDateRegExpResult[2]).text();
        var date = utils.datetimeStringToISO8601(userAndDateRegExpResult[3]);

        return {
            messageId: messageId,
            level: level,
            subject: subject,
            mod: mod,
            username: username,
            date: date
        };
    };

    $(html).find('body > ul').each(function () {
        (function walkthrough($ul, level) {
            level = level || 0;
            $ul.children().each(function () {
                switch (this.name) {
                    case 'li':
                        thread.push(parseThreadMessage($(this), level, $htmlEntityDecodeHelper));
                        break;
                    case 'ul':
                        walkthrough($(this), level + 1);
                        break;
                }
            });
        })($(this));
    });

    return thread;
};
