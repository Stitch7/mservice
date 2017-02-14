/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

var utils = require('./../utils.js');
var message = require('./../models/message.js');

module.exports = function (scrapers, messageId, html) {
    var $html = $(html);
    var $bg1TRs = $html.find('body table tr.bg1 td');
    var $userA = $($bg1TRs.get(5)).find('a').first();
    var userId = utils.toInt(/pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'))[1]);
    var username = $userA.text();
    var subject = $($bg1TRs.get(2)).find('b').text();
    var date = utils.datetimeStringToISO8601($($bg1TRs.get(7)).html());
    var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;
    var $text = $html.find('body table tr.bg2 td > font');
    var text = $text.text().trim();
    var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

    $text.find('font[face="Courier New"] > a').replaceWith(utils.embedImages($));
    var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

    var notification = scrapers.notificationStatus(html).notification;

    return new message(
        utils.toInt(messageId),
        null,
        userId,
        username,
        subject,
        date,
        text,
        textHtml,
        textHtmlWithEmbeddedImages,
        notification
    );
};
