/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    id,
    messageId,
    sticky,
    closed,
    username,
    mod,
    subject,
    date,
    messageCount,
    lastMessageId,
    lastMessageDate
) {
    this.id = id;
    this.messageId = messageId;
    this.sticky = sticky;
    this.closed = closed;
    this.username = username;
    this.mod = mod;
    this.subject = subject;
    this.date = date;
    this.messageCount = messageCount;
    this.lastMessageId = lastMessageId;
    this.lastMessageDate = lastMessageDate;
};
