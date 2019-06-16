/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, from, to, text, fn) {
        var options = {
            jar: res.jar,
            form: {
                mode: 'privatemessagesave',
                toid: '2615',
                subject: 'subject',
                body: text,
            }
        };

        httpClient.post(res, options, function (html, response) {
            var error = null;

            var title = scrapers.title(html);
            if (title !== httpClient.errors.maniacBoardTitles.confirm) {
                error = 'unknown';
                if (title === httpClient.errors.maniacBoardTitles.error) {
                    var maniacErrorMessage = scrapers.errorMessage(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage];
                    }
                } else if (title === httpClient.errors.maniacBoardTitles.edit) {
                    var maniacErrorMessage2 = scrapers.errorMessage2(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage2] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage2];
                    }
                }
            }

            if (!error) {
                var cacheKey = 'private-messages' + '/' + from;
                sharedCache.del(cacheKey);
            }

            fn(null, error);
        });
    };
};
