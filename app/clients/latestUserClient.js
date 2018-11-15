/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, fn) {
        var cacheKey = 'latest-user';
        var cacheTtl = 86400; // 1 day
        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            httpClient.get(res, {}, function (html) {
                fn(scrapers.latestUser(html));
            });
        });
    };
};
