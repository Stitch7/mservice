/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var moment = require('moment');

module.exports = function(log, client, db, responses) {
    var settingsdb = db.get().collection('settings');
    return {
        /**
         * Get all
         */
        index: function (req, res, next) {
            settingsdb.find().toArray(function(err, result) {
                if (err) {
                    log.error(err);
                    responses.json(res, null, err, next);
                } else {
                    var data = [];
                    result.forEach(function(settingsEntry) {
                        var entry = {};
                        entry.username = settingsEntry.username;
                        entry.uuid = settingsEntry.uuid;
                        entry.date = settingsEntry.date;
                        entry.settings = settingsEntry.settings;
                        data.push(entry);
                    });
                    responses.json(res, data, null, next);
                }
            });
        },
        /**
         * Get all for user
         */
        getAllForUser: function (req, res, next) {
            var username = req.authorization.basic.username;
            var query = { username: username };
            settingsdb.find(query).toArray(function(err, result) {
                if (err) {
                    log.error(err);
                    responses.json(res, null, err, next);
                } else {
                    var data = [];
                    result.forEach(function(settingsEntry) {
                        var entry = {};
                        entry[settingsEntry.uuid] = settingsEntry.settings;
                        entry[settingsEntry.uuid].date = settingsEntry.date;
                        data.push(entry);
                    });
                    responses.json(res, data, null, next);
                }
            });
        },
        /**
         * Get all for uuid
         */
        getAllForUuid: function (req, res, next) {
            var username = req.authorization.basic.username;
            var uuid = req.params.uuid;
            var query = { username: username, uuid: uuid };
            settingsdb.findOne(query, function(err, result) {
                if (err) {
                    log.error(err);
                    responses.json(res, null, err, next);
                } else {
                    var data = result.settings;
                    data.date = result.date;
                    responses.json(res, data, null, next);
                }
            });
        },
        /**
         * Update
         */
        update: function (req, res, next) {
            var username = req.authorization.basic.username;
            var uuid = req.params.uuid;
            var date = moment().format();
            var settings = req.body;

            if (!settings) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            var query = { username: username, uuid: uuid };
            settingsdb.find(query).toArray(function(err, result) {
                if (err) {
                    log.error(err);
                    responses.json(res, null, err, next);
                } else if (result.length === 0) {
                    var newEntry = query;
                    newEntry.date = date;
                    newEntry.settings = settings;
                    settingsdb.insertOne(newEntry, function(err) {
                        if (err) {
                            log.error(err);
                            responses.json(res, null, err, next);
                            return;
                        }
                        responses.json(res, null, null, next);
                    });
                } else {
                    settingsdb.updateOne(query, { $set: { date: date, settings: settings } }, function(err) {
                        if (err) {
                            log.error(err);
                            responses.json(res, null, err, next);
                            return;
                        }
                        responses.json(res, null, null, next);
                    });
                }
            });
        }
    };
};
