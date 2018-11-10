/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

var markMessagesAsRead = function(db, log, username, threadId, messageIds) {
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
                    log.info('User %s marked %d message(s) %s in thread %d as read', username, messageIds.length, messageIds.join(', '), threadId);
                }
            });
        } else {
            var existingMessageIds = result[0].messages;
            var newMessageIds = messageIds.map(function (messageId) {
                return messageId.toString();
            });

            if (!existingMessageIds) {
                existingMessageIds = newMessageIds;
            } else {
                existingMessageIds = existingMessageIds.concat(newMessageIds).unique();
            }

            readlist.update(query, {$set: {messages: existingMessageIds}}, function (err, numUpdated) {
                if (err) {
                    log.error(err);
                } else if (numUpdated) {
                    log.info('User %s marked %d message(s) %s in Thread %d as read', username, messageIds.length, messageIds.join(', '), threadId);
                } else {
                    log.warn('No document found with query:', query);
                }
            });
        }
    });
};

var usersResponses = function(res, client, db, log, username, callback) {
    client.messageResponses(res, db, username, function (messageResponses, error) {
        var readlist = db.get().collection('readlist');

        var threadIds = [];
        messageResponses.forEach(function (message, key) {
            var threadId = message.threadId.toString();
            if(threadIds.indexOf(threadId) == -1)
            threadIds.push(threadId);
        });

        var query = {};
        query.username = username;
        query.$or = [];
        threadIds.forEach(function (threadId) {
            query.$or.push({'threadId': threadId});
        });

        readlist.find(query).toArray(function (err, results) {
            if (err) {
                log.error(err);
            }

            var readListEntries = {};
            if (results && results.length) {
                results.forEach(function (result) {
                    readListEntries[result.threadId] = result.messages;
                });
            }

            messageResponses.forEach(function (message, key) {
                message.isRead = false;
                var query = {
                    username: username,
                    threadId: message.threadId.toString()
                };

                var messageIds = readListEntries[message.threadId] || [];
                message.isRead = messageIds.indexOf(message.messageId.toString()) >= 0;
            });

            callback(messageResponses, error);
        });
    });
};

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Message list
         */
        index: function (req, res, next) {
            client.messageList(req, res, db, client.threadList, req.params.boardId, req.params.threadId, function (messages, error) {
                if (req.authorization.basic === undefined) {
                    responses.json(res, messages, error, next);
                    return;
                }

                var username = req.authorization.basic.username;
                var readlist = db.get().collection('readlist');
                readlist.find({username: username, threadId: req.params.threadId}).toArray(function (err, result) {
                    if (err) {
                        log.error(err);
                    } else if (messages !== null) {
                        if (result.length) {
                            var messageIds = result[0].messages ? result[0].messages : [];
                            messages.forEach(function(message) {
                                message.isRead = messageIds.indexOf(message.messageId.toString()) >= 0;
                            });
                        } else {
                            messages.forEach(function(message) {
                                message.isRead = false;
                            });
                        }
                    }
                    responses.json(res, messages, error, next);
                });
            });
        },
        /**
         * Show Message
         */
        show: function (req, res, next) {
            var username = req.authorization.basic !== undefined ? req.authorization.basic.username : false;
            client.message(res, username, req.params.boardId, req.params.messageId, function (message, error) {
                if (!username && !error) {
                    message.userBlockedByYou = null;
                    message.userBlockedYou = null;
                }
                responses.json(res, message, error, next);

                if (username) {
                    req.on('end', function() {
                        var threadId = req.params.threadId;
                        var messageId = req.params.messageId;
                        markMessagesAsRead(db, log, username, threadId, [messageId]);
                    });
                }
            });
        },
        /**
         * Text for edit Message
         */
        editText: function (req, res, next) {
            client.editTextMessage(res, req.params.boardId, req.params.messageId, function (quote, error) {
                responses.json(res, quote, error, next);
            });
        },
        /**
         * Quote Message
         */
        quote: function (req, res, next) {
            client.quoteMessage(res, req.params.boardId, req.params.messageId, function (quote, error) {
                responses.json(res, quote, error, next);
            });
        },
        /**
         * Get notification status
         */
        notificationStatus: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            client.notificationStatus(res, req.params.boardId, req.params.messageId, function (notificationStatus, error) {
                responses.json(res, notificationStatus, error, next);
            });
        },
        /**
         * Toggle notication status for given messageId
         */
        notification: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            client.notification(res, req.params.boardId, req.params.messageId, function (data, error) {
                responses.json(res, data, error, next);
            });
        },
        /**
         * Preview Message Text
         */
        preview: function (req, res, next) {
            var text = req.params.text;
            if (text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.previewMessage(res, req.params.boardId, text, function (message, error) {
                responses.json(res, message, error, next);
            });
        },
        /**
         * Creates a reply
         */
        create: function (req, res, next) {
            if (req.params.subject === undefined || req.params.text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.createMessage(
                res,
                req.params.boardId,
                req.params.threadId,
                req.params.messageId,
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
         * Edit a message
         */
        update: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            var subject = req.params.subject;
            var text = req.params.text;
            if (subject === undefined || text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.updateMessage(
                res,
                req.authorization.basic.username,
                req.params.boardId,
                req.params.threadId,
                req.params.messageId,
                subject,
                text,
                function (data, error) {
                    responses.json(res, data, error, next);
                }
            );
        },
        /**
         * Get Responses on Messages
         */
        responses: function (req, res, next) {
            var username = req.params.username;
            usersResponses(res, client, db, log, username, function (messageResponses, error) {
                responses.json(res, messageResponses, error, next);
            });
        },
        /**
         * Mark as read action
         */
        markAsRead: function (req, res, next) {
            responses.json(res, 'Ok', null, next);

            req.on('end', function() {
                var username = req.authorization.basic.username;
                var threadId = req.params.threadId;
                var messageId = req.params.messageId;
                markMessagesAsRead(db, log, username, threadId, [messageId]);
            });
        },
        /**
         * Mark all unread responses as read action
         */
        markUnreadResponsesAsRead: function (req, res, next) {
            var username = req.params.username;
            usersResponses(res, client, db, log, username, function (messageResponses, error) {
                if (error) {
                    log.error(error);
                    return;
                }

                var threads = {};
                messageResponses.forEach(function (message) {
                    if (message.isRead) {
                        return;
                    }

                    if (!(message.threadId in threads)) {
                        threads[message.threadId] = [];
                    }
                    threads[message.threadId].push(message.messageId.toString());
                });

                for (var threadId in threads) {
                    // console.log("therad: " + threadId + " -> messages cnt: " + threads[threadId].length);
                    markMessagesAsRead(db, log, username, threadId, threads[threadId]);
                }
                responses.json(res, 'Ok', null, next);
            });
        }
    };
};
