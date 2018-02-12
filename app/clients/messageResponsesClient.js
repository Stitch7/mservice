/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * Copyright(c) 2017 Matthias Kuech.
 * MIT Licensed
 */
'use strict';

var response = require('./../models/response.js');
var moment = require('moment');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, db, username, fn) {
        var cacheKey = 'responses/' + username;
        var cacheTtl = 120; // 2 minutes
        try {
            var messageList = cache.get(cacheKey, true);
            fn(messageList);
        } catch (error) {
            var data = [];
            var messagelistCollection = db.get().collection('messagelist');
            var oneMonthAgo = moment().subtract(14, 'days').format('YYYYMMDD');

            messagelistCollection.find().toArray(function(err, messagelists) {
                var counter = 0;
                messagelists.forEach(function(messagelist, i) {
                    if (!messagelist.messages) {
                        return;
                    }

                    var boardId = messagelist.boardId;
                    var threadId = messagelist.threadId;
                    var threadSubject = messagelist.threadSubject ? messagelist.threadSubject : '';
                    if (threadSubject === '') {
                        threadSubject = '-';
                        var thread = messagelist.thread;
                        if (thread) {
                            threadSubject = thread.subject;
                        }
                    }

                    messagelist.messages.forEach(function(message, key) {
                        if (message.username !== username ||
                            (message.level > 0 && moment(message.date).format('YYYYMMDD') <= oneMonthAgo)
                        ) {
                            return;
                        }

                        var goDeeper;
                        do {
                            goDeeper = false;
                            var nextMessage = messagelist.messages[++key];
                            if (nextMessage && nextMessage.level > message.level) {
                                goDeeper = true;
                                if (nextMessage.level == message.level + 1 &&
                                    nextMessage.username !== username
                                ) {
                                    data.push(new response(
                                        boardId,
                                        threadId,
                                        threadSubject,
                                        nextMessage.messageId,
                                        nextMessage.subject,
                                        nextMessage.username,
                                        nextMessage.date,
                                        null
                                    ));
                                }
                            }
                        } while (goDeeper);
                    });
                });

                cache.set(cacheKey, data, cacheTtl, function(error, success) {
                    if (error || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });
                fn(data, null);
            });
        }
    };
};