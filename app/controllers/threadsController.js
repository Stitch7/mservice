/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var injectReadStatus = function(log, db, req, threadList, callback) {
    var username = req.authorization.basic.username;
    var readlist = db.get().collection('readlist');
    threadList.forEach( function (thread, key) {
        readlist.find({username: username, threadId: thread.id.toString()}).toArray(function (err, result) {
            if (err) {
                log.error(err);
            }

            var isRead = false;
            var lastMessageIsRead = false;
            var messagesRead = 0;

            if (result.length) {
                var messageIds = result[0].messages || [];
                isRead = messageIds.indexOf(thread.messageId.toString()) >= 0;
                lastMessageIsRead = messageIds.indexOf(thread.lastMessageId.toString()) >= 0;
                messagesRead = messageIds.length;
                if (isRead) {
                    messagesRead -= 1;
                }
            }

            thread.isRead = isRead;
            thread.lastMessageIsRead = lastMessageIsRead;
            thread.messagesRead = messagesRead;

            if (key == threadList.length - 1) {
                callback(threadList);
            }
        });
    });
};

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Index action
         */
        index: function (req, res, next) {
            client.threadList(res, req.params.boardId, function (threadList, error) {
                if (req.authorization.basic === undefined) {
                    responses.json(res, threadList, error, next);
                    return;
                }

                injectReadStatus(log, db, req, threadList, function (threadList) {
                    responses.json(res, threadList, error, next);
                });
            });
        },
        /**
         * Mark as read action
         */
        markAsRead: function (req, res, next) {
            var threadId = req.params.threadId;
            client.messageList(res, req.params.boardId, threadId, function (messages, error) {
                responses.json(res, 'Ok', null, next);

                req.on('end', function() {
                    var username = req.authorization.basic.username;

                    var messageIds = [];
                    messages.forEach( function (message, key) {
                        messageIds.push(message.messageId.toString());
                    });

                    var readlist = db.get().collection('readlist');
                    var query = {username: username, threadId: threadId};

                    readlist.find(query).toArray(function (err, result) {
                        if (err) {
                            log.error(err);
                        } else if (result.length === 0) {
                            var newEntry = {username: username, threadId: threadId, messages: messageIds};
                            readlist.insert([newEntry], function (err, result) {
                                if (err) {
                                    log.error(err);
                                } else {
                                    log.info('User %s marked complete Thread with ID %d as read', username, threadId);
                                }
                            });
                        } else {
                            readlist.update(query, {$set: {messages: messageIds}}, function (err, numUpdated) {
                                if (err) {
                                    log.error(err);
                                } else if (numUpdated) {
                                    log.info('User %s marked complete Thread with ID %d as read', username, threadId);
                                } else {
                                    log.warn('No document found with query:', query);
                                }
                            });
                        }
                    });
                });
            });
        },
        /**
         * Create action
         */
        create: function (req, res, next) {
            if (req.params.subject === undefined || req.params.text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.createMessage(
                res,
                req.params.boardId,
                null,
                req.authorization.basic.username,
                req.authorization.basic.password,
                req.params.subject,
                req.params.text,
                req.params.notification,
                function (data, error) {
                    responses.json(res, data, error, next);
                }
            );
        },
        /**
         * Search action
         */
        search: function (req, res, next) {
            var phrase = req.params.phrase;
            if (phrase === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.searchThreads(res, req.params.boardId, phrase, function (threadList, error) {
                if (req.authorization.basic === undefined) {
                    responses.json(res, threadList, error, next);
                    return;
                }

                injectReadStatus(log, db, req, threadList, function (threadList) {
                    responses.json(res, threadList, error, next);
                });
            });
        }
    };
};
