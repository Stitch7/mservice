/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');
var thread = require('./../models/thread.js');

module.exports = function(html) {
    var threads = [];

    var threadEntriesChained = html;
    var body = $(html).find('body p');
    if (body.length > 0) {
        threadEntriesChained = body.html();
    }
    var threadEntries = threadEntriesChained.split(/<\/*br>/);
    threadEntries.pop(); // Remove last (empty) entry

    // Compile Regexp outside loop to save perfomance
    var mainRegExp = /(.+)\s-\s(.+)\sam\s(.+)\(\s.+\s(\d+)\s(?:\|\s[A-Za-z:]+\s(.+)\s|)\)/;

    for (var i in threadEntries) {
        // fishing threadId from ld function call in onclick attribute
        var $messageHref = $('a', threadEntries[i]).first();
        var $lastMessageA = $('a', threadEntries[i]).last();

        var idRegExResult = /ld\((\w.+),0\)/.exec($messageHref.attr('onclick'));
        if (!idRegExResult) {
            continue;
        }

        var id = utils.toInt(idRegExResult[1]);

        var messageIdRegExResult = /(.+)msgid=(.+)/.exec($messageHref.attr('href'));
        var messageId = utils.toInt(messageIdRegExResult[2]);

        var lastMessageId;
        var lastMessageIdRegEx = new RegExp('.*msgid=(\\d+)', 'g');
        var lastMessageIdRegExResult = lastMessageIdRegEx.exec($lastMessageA.attr('href'));
        if (lastMessageIdRegExResult) {
            lastMessageId = utils.toInt(lastMessageIdRegExResult[1]);
        }

        var image = $('img', threadEntries[i]).attr('src').split('/').reverse()[0];
        // Sticky threads have pin image
        var sticky = image === 'fixed.gif';
        // Closed threads have lock image
        var closed = image === 'closed.gif';

        // Mods have are marked with the highlight css class
        var mod = $('span', threadEntries[i]).hasClass('highlight');

        // Fishing other thread data via easy regexp from line freed of html
        var subject, username, date, messagesCount, lastMessageDate;
        var regExpResult = mainRegExp.exec($(threadEntries[i]).text().trim().replace(/(\n|\t)/g, ''));

        if (regExpResult !== null) {
            subject = regExpResult[1];
            username = regExpResult[2];
            date = utils.datetimeStringToISO8601(regExpResult[3]);
            messagesCount = utils.toInt(regExpResult[4]);
            lastMessageDate = utils.datetimeStringToISO8601(regExpResult[5]);
        }

        // Add thread to list
        threads.push(new thread(
            id,
            messageId,
            null,
            sticky,
            closed,
            username,
            mod,
            subject,
            date,
            messagesCount,
            null,
            lastMessageId,
            null,
            lastMessageDate
        ));
    }

    return threads;
};
