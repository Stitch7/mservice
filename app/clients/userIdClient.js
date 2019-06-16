/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, username, fn) {
        // var cacheKey = 'userId/' + username;
        // var cacheTtl = 3600; // 1 hour

        // sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var mode = 'usersearch';
            var url = httpClient.baseUrl + '?mode=' + mode;
            var options = {
                uri: url,
                form: {
                    mode: mode,
                    nick: username
                }
            };
            httpClient.post(res, options, function (html) {
                var data = null;
                var error = null;

                data = scrapers.userId(username, html);

                fn(data, error);
            });
        // });
    };
};
