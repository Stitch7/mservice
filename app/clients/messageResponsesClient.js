/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * Copyright(c) 2017 Matthias Kuech.
 * MIT Licensed
 */
'use strict';

var response = require('./../models/response.js');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, db, username, fn) {
        var responses = [];

        var readlistCollection = db.get().collection('readlist');
        var threadlistCollection = db.get().collection('threadlist');
        var messagelistCollection = db.get().collection('messagelist');

        messagelistCollection.find().toArray(function (err, messagelists) {
            var counter = 0;
            messagelists.forEach(function(messagelist, i) {
                var boardId = messagelist.boardId;
                var threadId = messagelist.threadId;

                var readlistQuery = {
                    username: username,
                    threadId: threadId.toString()
                };
                readlistCollection.findOne(readlistQuery, function (err, readlist) {
                    if (err) {
                        log.error(err);
                    }

                    var threadlistQuery = {
                        id: threadId
                    };
                    threadlistCollection.findOne(threadlistQuery, function (err, thread) {
                        if (err) {
                            log.error(err);
                        }

                        var readMessageIds = readlist ? readlist.messages : [];
                        messagelist.messages.forEach(function(message, i) {
                            if (i <= 0) {
                                return;
                            }

                            var previousMessage = messagelist.messages[i-1];
                            if (previousMessage.level +1 == message.level &&
                                previousMessage.username == username)
                            {
                                var threadSubject = thread.subject;
                                var isRead = readMessageIds.indexOf(message.messageId.toString()) >= 0;
                                responses.push(new response(boardId,
                                                            threadId,
                                                            threadSubject,
                                                            message.messageId,
                                                            message.subject,
                                                            message.username,
                                                            message.date,
                                                            isRead));
                            }
                        });

                        if (counter == messagelists.length - 1) {
                            fn(responses, null);
                        }
                        counter++;
                    });
                });
            });
        });
    };
};
