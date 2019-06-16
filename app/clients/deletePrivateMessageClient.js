/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, username, messageId, fn) {
        var url = httpClient.baseUrl + '?mode=privatemessagedelete&msgid=' + messageId;
            var options = {
                uri: url,
                jar: res.jar
            };
            httpClient.get(res, options, function (html) {
                var cacheKey = 'private-messages' + '/' + username;
                sharedCache.del(cacheKey);
                fn();
            });
    };
};
