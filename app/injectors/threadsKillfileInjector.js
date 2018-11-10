/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, db, req, threadList, callback) {
    var username = req.authorization.basic.username;
    var threadKillfile = db.get().collection('threadKillfile');

    threadKillfile.findOne({ username: username }, function(err, result) {
        if (err) {
            log.error(err);
            callback(threadList);
            return;
        }

        if (!result || !result.threadIds) {
            callback(threadList);
            return;
        }

        var filteredThreadList = [];
        threadList.forEach(function(thread) {
            if (result.threadIds.indexOf(thread.id) === -1) {
                filteredThreadList.push(thread);
            }
        });
        callback(filteredThreadList);
    });
};