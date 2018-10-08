/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, db, req, threadList, callback) {
    var username = req.authorization.basic.username;
    var readlist = db.get().collection('readlist');
    var threadIds = threadList.map(function(thread) {
        return thread.id.toString();
    });

    readlist.find({ username: username, threadId: { $in: threadIds } }).toArray(function(err, result) {
        if (err) {
            log.error(err);
            callback(threadList);
            return;
        }

        if (!result) {
            callback(threadList);
            return;
        }

        threadList.forEach(function(thread, key) {
            var isRead = false;
            var lastMessageIsRead = false;
            var messagesRead = 0;
            var readlistEntries = result.filter(function(readlistEntry) {
                return readlistEntry.threadId == thread.id;
            });

            if (readlistEntries.length > 0) {
                var messageIds = readlistEntries[0].messages;
                if (messageIds) {
                    isRead = messageIds.indexOf(thread.messageId.toString()) >= 0;
                    if (thread.lastMessageId) {
                        lastMessageIsRead = messageIds.indexOf(thread.lastMessageId.toString()) >= 0;
                    }
                    messagesRead = messageIds.length;
                    if (isRead) {
                        messagesRead--;
                    }
                }
            }

            thread.isRead = isRead;
            thread.lastMessageIsRead = lastMessageIsRead;
            thread.messagesRead = messagesRead;
        });

        callback(threadList);
    });
};