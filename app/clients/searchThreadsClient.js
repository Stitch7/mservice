/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, boardId, phrase, fn) {
        var cacheKey = 'search-threads/' + boardId + '/' + phrase;
        var cacheTtl = 300; // 5 minutes

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var options = {
                uri: utils.domainFromUri(httpClient.baseUrl) + '/forum/include/Ajax/threadfilter.php',
                form: {
                    boardid: boardId,
                    phrase: phrase
                },
                headers: {
                    'User-Agent': 'm!service',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            httpClient.post(res, options, function(html, response) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'boardId';
                } else {
                    data = scrapers.threadList(html, boardId);
                }

                fn(data, error);
            });
        });
    };
};
