/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

var utils = require('./../utils.js');
var message = require('./../models/message.js');

module.exports = function (scrapers, messageId, html) {
    var $html = $(html);
    var $bg1TDs = $html.find('body table tr.bg1 td');

    var $userA = $($html.find('a').get(1));
    var userIdRegExp = /pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'));
    var userId = userIdRegExp !== null ? utils.toInt(userIdRegExp[1]) : null;

    var username = $userA.text();

    var userBlockedByYou = false;
    var userBlockedYou = false;
    var $userBlockedI = $userA.next();
    if ($userBlockedI.length > 0 && $userBlockedI.prop('tagName') === 'I') {
        var userBlockedIText = $userBlockedI.text();
        userBlockedByYou = userBlockedIText === '(durch dich blockiert)';
        userBlockedYou = userBlockedIText === '(blockiert dich)';
    }

    var subject = $($bg1TDs.get(2)).find('b').text();

    var dateString = $($bg1TDs.get(7)).text();
    if (dateString === 'Datum:') {
         // User is administrator which has an additional td
        dateString = $($bg1TDs.get(8)).text();
    }
    var date = utils.datetimeStringToISO8601(dateString);

    var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;
    var $text = $html.find('body table tr.bg2 td > font');
    $text.find('img').replaceWith(function() {
        var src = $(this).attr('src');
        return $('<a href="' + src + '">' + src + '</a>');
    });
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

    var makeSpoilerButton = function () {
        var $button = $(this);
        $button.html('SPOILER');
    };
    $text.find('button').each(makeSpoilerButton);
    $textHtml.find('button').each(makeSpoilerButton);

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
        notification,
        userBlockedByYou,
        userBlockedYou
    );
};
