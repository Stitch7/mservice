/**
 * M!service
 * Copyright(c) 2017 Matthias Kuech.
 * MIT Licensed
 */
'use strict';

module.exports = function(
        boardId,
        threadId,
        messageId,
        subject,
        username,
        date)
{
    this.boardId = boardId;
    this.threadId = threadId;
    this.messageId = messageId;
    this.subject = subject;
    this.username = username;
    this.date = date;
};
