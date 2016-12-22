/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(httpClient, scrapers) {
    return function(res, boardId, phrase, fn) {
        var url = utils.domainFromUri(httpClient.baseUrl) + '/forum/include/Ajax/threadfilter.php';
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
            }

            fn(data, error);
        });
    };
};
