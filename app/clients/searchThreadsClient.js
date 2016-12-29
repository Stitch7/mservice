/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, boardId, phrase, fn) {
        var url = utils.domainFromUri(httpClient.baseUrl) + '/forum/include/Ajax/threadfilter.php';

        var cacheKey = 'search-threads/' + boardId + '/' + phrase;
        var cacheTtl = 300; // 5 minutes

        try {
            var searchResult = cache.get(cacheKey, true);
            fn(searchResult);
        } catch(error) {
            var options = {
                uri: url,
                form: {
                    boardid: boardId,
                    phrase: phrase
                },
                headers: {
                    'User-Agent': 'M!service',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            httpClient.post(res, options, function (html, response) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'boardId';
                } else {
                    data = scrapers.threadList(html);
                    cache.set(cacheKey, data, function(cacheErr, success) {
                        if (error || !success) {
                            log.error('Failed to cache data for key: ' + cacheKey);
                        }
                    });
                }

                fn(data, error);
            });
        }
    };
};
