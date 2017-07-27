/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(threadList, callback) {
    var sortedThreadList = threadList.sort(function(a, b) {
        var aDate = a.lastMessageDate || a.date;
        var bDate = b.lastMessageDate || b.date;
        return new Date(bDate) - new Date(aDate);
    });
    callback(sortedThreadList);
};