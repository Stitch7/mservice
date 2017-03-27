/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var errors = require('./../errors.js');
var utils = require('./../utils.js');

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Favorite List
         */
        index: function (req, res, next) {
            var username = req.authorization.basic.username;
            var favorites = db.get().collection('favorites');

            favorites.findOne({username: username}, function (err, result) {
                if (err) {
                    log.error(err);
                    return;
                }

                var data = [];
                var threadIds = result.threadIds;

                threadIds.forEach(function(threadId, i) {
                    console.log(threadId);

                    client.threadList(req, res, boardId, function (threadList, error) {
                        threadList.forEach(function(thread) {
                            if (thread.id == threadId) {
                                data.push(thread.subject);
                            }
                        });
                    });

                    responses.json(res, data, null, next);
                });
            });
        },
        /**
         * Add thread to favorites
         */
        add: function (req, res, next) {
            var username = req.authorization.basic.username;
            var favorites = db.get().collection('favorites');
            var threadId = req.params.threadId;

            if (!utils.isNumeric(threadId)) {
                var error = { error: 'threadId is malformed' };
                responses.json(res, error, 'httpBadRequest', next);
                return;
            }
            threadId = utils.toInt(threadId);

            var query = {username: username};
            favorites.findOne(query, function (err, result) {
                if (err) {
                    log.error(err);
                    return;
                }

                if (!result) {
                    var newEntry = {username: username, threadIds: [threadId]};
                    favorites.insert([newEntry], function (err, result) {
                        if (err) {
                            log.error(err);
                        } else {
                            log.info('User %s added Thread with ID %d to his favorites', username, threadId);
                        }
                    });
                    responses.json(res, [threadId], null, next);
                }
                else {
                    var threadIds = result.threadIds;
                    if (threadIds.indexOf(threadId) === -1) {
                        threadIds.push(threadId);
                        favorites.update(query, {$set: {threadIds: threadIds}}, function (err, numUpdated) {
                            if (err) {
                                log.error(err);
                            } else if (numUpdated) {
                                log.info('User %s added Thread with ID %d to his favorites', username, threadId);
                            } else {
                                log.warn('No favorites found with query:', query);
                            }
                        });
                    }
                    responses.json(res, threadIds, null, next);
                }
            });
        },
        /**
         * Remove thread from favorites
         */
        remove: function (req, res, next) {
            var username = req.authorization.basic.username;
            var favorites = db.get().collection('favorites');
            var threadId = req.params.threadId;

            if (!utils.isNumeric(threadId)) {
                var error = { error: 'threadId is malformed' };
                responses.json(res, error, 'httpBadRequest', next);
                return;
            }
            threadId = utils.toInt(threadId);

            var query = {username: username};
            favorites.findOne(query, function (err, result) {
                if (err) {
                    log.error(err);
                    return;
                }

                if (result) {
                    var threadIds = result.threadIds;
                    var index = threadIds.indexOf(5);
                    if (threadIds.indexOf(threadId) === -1) {
                        responses.json(res, null, 'threadId', next);
                    } else {
                        threadIds.splice(index, 1);
                        favorites.update(query, {$set: {threadIds: threadIds}}, function (err, numUpdated) {
                            if (err) {
                                log.error(err);
                            } else if (numUpdated) {
                                log.info('User %s removed Thread with ID %d from his favorites', username, threadId);
                            } else {
                                log.warn('No favorites found with query:', query);
                            }
                        });
                        responses.json(res, threadIds, null, next);
                    }
                }
            });
        }
    };
};
