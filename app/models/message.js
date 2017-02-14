/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    messageId,
    isRead,
    userId,
    username,
    subject,
    date,
    text,
    textHtml,
    textHtmlWithEmbeddedImages,
    notification
) {
    this.messageId = messageId;
    this.isRead = isRead;
    this.userId = userId;
    this.username = username;
    this.subject = subject;
    this.date = date;
    this.text = text;
    this.textHtml = textHtml;
    this.textHtmlWithImages = textHtmlWithEmbeddedImages;
    this.notification = notification;
};
