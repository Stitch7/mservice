/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Message list
         */
        index: function (req, res, next) {
            client.messageList(res, req.params.boardId, req.params.threadId, function (messages, error) {
                if (req.authorization.basic === undefined) {
                    responses.json(res, messages, error, next);
                    return;
                }

                var username = req.authorization.basic.username;
                var readlist = db.get().collection('readlist');
                readlist.find({username: username, threadId: req.params.threadId}).toArray(function (err, result) {
                    if (err) {
                        log.error(err);
                    } else if (result.length) {
                        var messageIds = result[0].messages ? result[0].messages : [];
                        messages.forEach(function (message) {
                            message.isRead = messageIds.indexOf(message.messageId.toString()) >= 0;
                        });
                    } else {
                        messages.forEach(function (message) {
                            message.isRead = false;
                        });
                    }

                    responses.json(res, messages, error, next);
                });
            });
        },
        /**
         * Show Message
         */
        show: function (req, res, next) {
            client.message(res, req.params.boardId, req.params.messageId, function (message, error) {
                responses.json(res, message, error, next);

                if (req.authorization.basic === undefined) {
                    return;
                }

                req.on('end', function() {
                    var username = req.authorization.basic.username;
                    var threadId = req.params.threadId;
                    var messageId = req.params.messageId;

                    var readlist = db.get().collection('readlist');
                    var query = {username: username, threadId: threadId};

                    readlist.find(query).toArray(function (err, result) {
                        if (err) {
                            log.error(err);
                        } else if (result.length === 0) {
                            var newEntry = {username: username, threadId: threadId, messages: [messageId]};
                            readlist.insert([newEntry], function (err, result) {
                                if (err) {
                                    log.error(err);
                                } else {
                                    log.info('User %s marked Message %d in Thread %d as read', username, messageId, threadId);
                                }
                            });
                        } else {
                            var messages = result[0].messages;
                            if (messages.indexOf(messageId) === -1) {
                                messages.push(messageId);
                                readlist.update(query, {$set: {messages: messages}}, function (err, numUpdated) {
                                    if (err) {
                                        log.error(err);
                                    } else if (numUpdated) {
                                        log.info('User %s marked Message %d in Thread %d as read', username, messageId, threadId);
                                    } else {
                                        log.warn('No document found with query:', query);
                                    }
                                });
                            }
                        }
                    });
                });
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
            client.messageResponses(res, req.params.username, function (user, error) {
                responses.json(res, user, error, next);

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

                var readlist = db.get().collection('readlist');
                var query = {username: username, threadId: threadId};

                readlist.find(query).toArray(function (err, result) {
                    if (err) {
                        log.error(err);
                    } else if (result.length === 0) {
                        var newEntry = {username: username, threadId: threadId, messages: [messageId]};
                        readlist.insert([newEntry], function (err, result) {
                            if (err) {
                                log.error(err);
                            } else {
                                log.info('User %s marked Message %d in Thread %d as read', username, messageId, threadId);
                            }
                        });
                    } else {
                        var messages = result[0].messages;
                        if (messages.indexOf(messageId) === -1) {
                            messages.push(messageId);
                            readlist.update(query, {$set: {messages: messages}}, function (err, numUpdated) {
                                if (err) {
                                    log.error(err);
                                } else if (numUpdated) {
                                    log.info('User %s marked Message %d in Thread %d as read', username, messageId, threadId);
                                } else {
                                    log.warn('No document found with query:', query);
                                }
                            });
                        }
                    }
                });
            });
        }
    };
};
