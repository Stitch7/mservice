/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, phrase, searchInBody, searchInSubject, username, board, days, fn) {
        var url = utils.domainFromUri(httpClient.baseUrl) + '/forum/search/search.php';

        var cacheKey = 'search/' + phrase + '/' + searchInBody + '/' + searchInSubject + '/' + username + '/' + board + '/' + days;
        var cacheTtl = 900; // 15 minutes

        try {
            var searchResult = cache.get(cacheKey, true);
            fn(searchResult);
        } catch (error) {
            var options = {
                uri: url,
                form: {
                    autor: username,
                    board: board,
                    cbxBody: searchInBody,
                    cbxSubject: searchInSubject,
                    days: days,
                    phrase: phrase,
                    suche: 'durchsuchen'
                }
            };

            httpClient.post(res, options, function(html, response) {
                var data = scrapers.search(html);
                cache.set(cacheKey, data, cacheTtl, function(cacheErr, success) {
                    if (cacheErr || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });

                fn(data, null);
            });
        }
    };
};