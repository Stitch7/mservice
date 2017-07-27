/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, db, req, threadList, callback) {
    var username = req.authorization.basic.username;
    var favorites = db.get().collection('favorites');

    favorites.findOne({ username: username }, function(err, result) {
        if (err) {
            log.error(err);
            callback(threadList);
            return;
        }

        threadList.forEach(function(thread) {
            var isFavorite = false;
            if (result && result.threadIds) {
                isFavorite = result.threadIds.indexOf(thread.id) >= 0;
            }

            thread.isFavorite = isFavorite;
        });

        callback(threadList);
    });
};