/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, username, messageId, fn) {
        var cacheKey = 'private-message/' + username + '/' + messageId;
        var cacheTtl = 3600*24;
        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var url = httpClient.baseUrl + '?mode=privatemessage&msgid=' + messageId;
            var options = {
                uri: url,
                jar: res.jar
            };
            httpClient.get(res, options, function (html) {
                var privateMessage = scrapers.privateMessage(html);
                fn(privateMessage);
            });
        });
    };
};
