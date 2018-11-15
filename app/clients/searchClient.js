/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, phrase, searchInBody, searchInSubject, username, board, days, fn) {
        var url = utils.domainFromUri(httpClient.baseUrl) + '/forum/search/search.php';

        var cacheKey = 'search/' + phrase + '/' + searchInBody + '/' + searchInSubject + '/' + username + '/' + board + '/' + days;
        var cacheTtl = 900; // 15 minutes

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
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
            httpClient.post(res, options, function(html) {
                var data = scrapers.search(html);
                fn(data, null);
            });
        });
    };
};
