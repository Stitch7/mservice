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
    var $contentContainer = $('<p>').append($('<div>').attr('id', 'content'));

    var threadid = null;
    var $flatViewAs = $html.find('a').filter(function(){
        return $(this).attr('target') == 'flatview';
    });
    if ($flatViewAs.length > 0) {
        threadid = utils.toInt(/pxmboard.php\?mode=messagelist&brdid=\d+&thrdid=(\d+)/.exec($flatViewAs.first().attr('href'))[1]);
    }

    var $textHtml = $contentContainer.clone();
    $textHtml.find('#content').append(textHtml);

    $text.find('font[face="Courier New"] > a').replaceWith(utils.embedImages($));
    $text.find('img').each(function () {
        var $img = $(this);
        $img.attr('alt', $img.attr('src'));
    });
    $text.find('button').each(function () {
        var $button = $(this);
        $button.html('SPOILER');
    });
    var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();
    var $textHtmlWithEmbeddedImages = $contentContainer.clone();
    $textHtmlWithEmbeddedImages.find('#content').append(textHtmlWithEmbeddedImages);

    var notification = scrapers.notificationStatus(html).notification;

    return new message(
        utils.toInt(messageId),
        threadid,
        null,
        userId,
        username,
        subject,
        date,
        text,
        $textHtml.html(),
        $textHtmlWithEmbeddedImages.html(),
        notification
    );
};
