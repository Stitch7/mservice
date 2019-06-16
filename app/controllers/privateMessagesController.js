/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var markPrivateMessagesAsRead = function(db, log, username, receiver, messageIds) {
    var readlist = db.get().collection('readlistPm');
    var query = {username: username, receiver: receiver};

    readlist.find(query).toArray(function (err, result) {
        if (err) {
            log.error(err);
        } else if (result.length === 0) {
            var newEntry = {username: username, receiver: receiver, messages: messageIds};
            readlist.insertOne(newEntry, function (err, result) {
                if (err) {
                    log.error(err);
                } else {
                    log.info('User %s marked %d private message(s) %s for receiver %d as read', username, messageIds.length, messageIds.join(', '), receiver);
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
                    log.info('User %s marked %d private message(s) %s for receiver %d as read', username, messageIds.length, messageIds.join(', '), receiver);
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
         * List Private Messages from User
         */
        index: function (req, res, next) {
            var username = req.authorization.basic.username;
            client.privateMessagesList(res, username, function (privateMessagesList, error) {
                var readlist = db.get().collection('readlistPm');
                readlist.find({username: username}).toArray(function (err, result) {
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
                                privateMessagesList.forEach(function(conversation) {
                                    conversation.messages.forEach(function(message) {
                                        message.isRead = false;
                                    });
                                });
                            }
                        }
                    });
                    responses.json(res, privateMessagesList, error, next);
                });
            });
        },
        /**
         * Show Context of Private Message
         */
        show: function (req, res, next) {
            var username = req.authorization.basic.username;
            var messageId = req.params.messageId;
            client.privateMessage(res, username, messageId, function (data, error) {
                responses.json(res, data, error, next);

                req.on('end', function() {
                    var messageId = req.params.messageId;
                    var receiver = data.userId;
                    markPrivateMessagesAsRead(db, log, username, receiver, [messageId]);
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
            var text = req.params.text;
            client.sendPrivateMessage(res, from, to, text, function (response, error) {
                responses.json(res, response, error, next);
            });
        }
    };
};
