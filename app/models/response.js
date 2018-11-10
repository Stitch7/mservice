/**
 * m!service
 * Copyright(c) 2017 Matthias Kuech.
 * MIT Licensed
 */
'use strict';

module.exports = function(
        boardId,
        threadId,
        threadSubject,
        messageId,
        subject,
        username,
        date,
        isRead)
{
    this.boardId = boardId;
    this.threadId = threadId;
    this.threadSubject = threadSubject;
    this.messageId = messageId;
    this.subject = subject;
    this.username = username;
    this.date = date;
    this.isRead = isRead;
};
