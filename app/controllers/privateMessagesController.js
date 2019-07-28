/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var markPrivateMessagesAsRead = function(db, log, username, messageIds) {
    if (messageIds.length === 0) {
        return;
    }

    var readlist = db.get().collection('readlistPm');
    var query = {username: username};

    readlist.find(query).toArray(function (err, result) {
        if (err) {
            log.error(err);
        } else if (result.length === 0) {
            var newEntry = {username: username, messages: messageIds};
            readlist.insertOne(newEntry, function (err, result) {
                if (err) {
                    log.error(err);
                } else {
                    log.info('User %s marked %d private message(s) %s as read', username, messageIds.length, messageIds.join(', '));
                }
            });
        } else {
            var existingMessageIds = result[0].messages;
            var newMessageIds = messageIds.map(function (messageId) {
                return messageId;
            });

            if (!existingMessageIds) {
                existingMessageIds = newMessageIds;
            } else {
                existingMessageIds = existingMessageIds.concat(newMessageIds).unique();
            }

            readlist.updateOne(query, {$set: {messages: existingMessageIds}}, function (err, numUpdated) {
                if (err) {
                    log.error(err);
                } else if (numUpdated) {
                    log.info('User %s marked %d private message(s) %s as read', username, messageIds.length, messageIds.join(', '));
                } else {
                    log.warn('No document found with query:', query);
                }
            });
        }
    });
};

module.exports = function(log, client, db, responses) {
    return {
        /**
         * List User's Private Messages
         */
        index: function (req, res, next) {
            var username = req.authorization.basic.username;
            client.privateMessagesList(res, username, function (privateMessagesList, error) {
                var readlist = db.get().collection('readlistPm');
                readlist.find({username: username}).toArray(function (err, result) {
                    var privateMessageIDsToRead = [];
                    privateMessagesList.forEach(function(conversation) {
                        if (err) {
                            log.error(err);
                        } else if (privateMessagesList !== null) {
                            if (result.length) {
                                var readMessageIds = result[0].messages ? result[0].messages : [];
                                conversation.messages.forEach(function (message) {
                                    message.isRead = readMessageIds.indexOf(message.msgid) >= 0;
                                });
                            } else {
                                conversation.messages.forEach(function(message) {
                                    privateMessageIDsToRead.push(message.msgid);
                                    message.isRead = true;
                                });
                            }
                        }
                    });
                    markPrivateMessagesAsRead(db, log, username, privateMessageIDsToRead);
                    responses.json(res, privateMessagesList, error, next);
                });
            });
        },
        /**
         * Latest Private Messages from Sender
         */
        latest: function (req, res, next) {
            var username = req.authorization.basic.username;
            var sender = req.params.username;
            client.privateMessagesLatest(res, username, function (privateMessagesList, error) {
                if (error) {
                    responses.json(res, null, error, next);
                    return;
                }

                var readlist = db.get().collection('readlistPm');
                readlist.find({username: username}).toArray(function (err, result) {
                    var latestPrivateMessages = null;
                    if (err) {
                        log.error(err);
                    } else {
                        latestPrivateMessages = [];
                        privateMessagesList.forEach(function(privateMessage) {
                            var readMessageIds = result[0].messages ? result[0].messages : [];
                            if (privateMessage.username !== sender) {
                                return;
                            }

                            var isRead = readMessageIds.indexOf(privateMessage.msgid) >= 0;
                            if (!isRead) {
                                latestPrivateMessages.push(privateMessage);
                            }
                        });
                    }
                    responses.json(res, latestPrivateMessages, error, next);
                });
            });
        },
        /**
         * Show Content of Private Message
         */
        show: function (req, res, next) {
            var username = req.authorization.basic.username;
            var messageId = req.params.messageId;
            client.privateMessage(res, username, messageId, function (data, error) {
                responses.json(res, data, error, next);

                req.on('end', function() {
                    var messageId = req.params.messageId;
                    markPrivateMessagesAsRead(db, log, username, [messageId]);
                });
            });
        },
        /**
         * Delete Private Message
         */
        delete: function (req, res, next) {
            var username = req.authorization.basic.username;
            var messageId = req.params.messageId;

            if (!messageId) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.deletePrivateMessage(res, username, messageId, function (data, error) {
                responses.json(res, data, error, next);
            });
        },
        /**
         * Send Private Message
         */
        send: function (req, res, next) {
            var from = req.authorization.basic.username;
            var to = req.params.to;
            var subject = req.params.subject;
            var text = req.params.text;

            if (!to || !subject || !text) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.sendPrivateMessage(res, from, to, subject, text, function (response, error) {
                responses.json(res, response, error, next);
            });
        }
    };
};
