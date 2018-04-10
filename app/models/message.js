/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    messageId,
    threadId,
    isRead,
    userId,
    username,
    subject,
    date,
    text,
    textHtml,
    textHtmlWithEmbeddedImages,
    notification,
    userBlockedByYou,
    userBlockedYou
) {
    this.messageId = messageId;
    this.threadId = threadId;
    this.isRead = isRead;
    this.userId = userId;
    this.username = username;
    this.subject = subject;
    this.date = date;
    this.text = text;
    this.textHtml = textHtml;
    this.textHtmlWithImages = textHtmlWithEmbeddedImages;
    this.notification = notification;
    this.userBlockedByYou = userBlockedByYou;
    this.userBlockedYou = userBlockedYou;
};
