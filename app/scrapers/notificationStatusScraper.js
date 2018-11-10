/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

module.exports = function (html) {
    var notification = null;
    var notificationLinkText = $(html).find('a[href^="pxmboard.php?mode=messagenotification"]').text().trim().split(' ')[1];

    if (notificationLinkText !== undefined) {
        notification = notificationLinkText === 'deaktivieren';
    }

    return {
        notification: notification
    };
};
