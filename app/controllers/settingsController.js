/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var moment = require('moment');
var fs = require('fs');
var path = require('path');

module.exports = function(log, client, db, responses) {
    var settingsdb = db.get().collection('settings');

    var accumulateAllSettingsFromDb = function (fn) {
        settingsdb.find().toArray(function(err, result) {
            if (err) {
                log.error(err);
                fn(err, null);
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
                fn(null, data);
            }
        });
    };

    var deleteSettingsFromDb = function (username, uuid, responses, res, next) {
        if (!username || !uuid) {
            responses.json(res, null, 'httpBadRequest');
            return;
        }

        settingsdb.deleteOne({ username: username, uuid: uuid }, function(err, collection) {
            if (err) {
                log.error(err);
                responses.json(res, null, err, next);
                return;
            }

            log.info('Successfully deleted settings record for user ' + username + ' with uuid ' + uuid);
            responses.json(res, null, null, next);
        });
    };

    return {
        /**
         * Get all
         */
        index: function (req, res, next) {
            accumulateAllSettingsFromDb(function (err, data) {
                responses.json(res, data, err, next);
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
        },
        /**
         * Delete
         */
        delete: function (req, res, next) {
            var username = req.authorization.basic.username;
            var uuid = req.params.uuid;
            deleteSettingsFromDb(username, uuid, responses, res, next);
        },
        /**
         * Delete (Admin)
         */
        deleteAdmin: function (req, res, next) {
            var username = req.params.username;
            var uuid = req.params.uuid;
            deleteSettingsFromDb(username, uuid, responses, res, next);
        },
        /**
         * Dashboard action
         */
        dashboard: function (req, res, next) {
            fs.readFile(path.resolve(__dirname, '../views/settings-dashboard.html'), 'utf8', function (error, html) {
                if (error) {
                    req.log.error({ req: req }, error);
                    responses.json(res, null, 'httpInternalServerError');
                    return;
                }

                accumulateAllSettingsFromDb(function (err, data) {
                    if (err) {
                        responses.json(res, null, err, next);
                        return;
                    }
                    html = html.replace(/'<%DATA%>'/, JSON.stringify(data));
                    responses.html(res, html, error, next);
                });
            });
        }
    };
};
