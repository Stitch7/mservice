/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    id,
    messageId,
    isRead,
    sticky,
    closed,
    username,
    mod,
    subject,
    date,
    messagesCount,
    messagesRead,
    lastMessageId,
    lastMessageIsRead,
    lastMessageDate
) {
    this.id = id;
    this.messageId = messageId;
    this.isRead = isRead;
    this.sticky = sticky;
    this.closed = closed;
    this.username = username;
    this.mod = mod;
    this.subject = subject;
    this.date = date;
    this.messagesCount = messagesCount;
    this.messagesRead = messagesRead;
    this.lastMessageId = lastMessageId;
    this.lastMessageIsRead = lastMessageIsRead;
    this.lastMessageDate = lastMessageDate;
};
