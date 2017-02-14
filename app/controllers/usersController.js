/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Login
         */
        login: function (req, res, next) {
            responses.json(res,'OK', null, next);
        },
        /**
         * Show user profile
         */
        profile: function (req, res, next) {
            client.userProfile(res, req.params.userId, function (userProfile, error) {
                responses.json(res, userProfile, error, next);
            });
        },
        /**
         * Fetch latest user
         */
        latest: function (req, res, next) {
            client.latestUser(res, function (latestUser, error) {
                responses.json(res, latestUser, error, next);
            });
        },
        /**
         * Import lists of messages in form [threadId: [messageId]]
         */
        importReadList: function (req, res, next) {
            var username = req.authorization.basic.username;
            var readListToImport = JSON.parse(req.body);

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

            var makeHandler = function(threadId, messageIds) {
                return function (err, result) {
                    if (err) {
                        log.error(err);
                    } else if (result.length === 0) {
                        var newEntry = {username: username, threadId: threadId, messages: messageIds};
                        readlist.insert([newEntry], function (err, result) {
                            if (err) {
                                log.error(err);
                            } else {
                                log.info('User %s marked %d messages as read in Thread with ID %d during ReadList import', username, messageIds.length, threadId);
                            }
                        });
                    } else if (result[0].messages) {
                        var mergedMessages = result[0].messages.concat(messageIds).map(function(messageId) {
                            return messageId.toString();
                        }).unique();

                        if (result[0].messages.length !== mergedMessages.length) {
                            readlist.update(query, {$set: {messages: mergedMessages}}, function (err, numUpdated) {
                                if (err) {
                                    log.error(err);
                                } else if (numUpdated) {
                                var updatedMessages = mergedMessages.length - result[0].messages.length;
                                    log.info('User %s marked %d messages as read in Thread with ID %d during ReadList import', username, updatedMessages, threadId);
                                } else {
                                    log.warn('No document found with query:', query);
                                }
                            });
                        }
                    }
                };
            };

            for (var threadId in readListToImport) {
                var messageIds = readListToImport[threadId];

                var readlist = db.get().collection('readlist');
                var query = {username: username, threadId: threadId};

                readlist.find(query).toArray(makeHandler(threadId, messageIds));
            }

            responses.json(res, 'Ok', null, next);
        }
    };
};
