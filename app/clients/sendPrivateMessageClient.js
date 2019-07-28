/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, from, to, subject, text, fn) {
        var options = {
            jar: res.jar,
            form: {
                mode: 'privatemessagesave',
                toid: to,
                subject: subject,
                body: text,
            }
        };

        httpClient.post(res, options, function (html, response) {
            var error = null;
            var title = scrapers.title(html);
            if (title !== httpClient.errors.maniacBoardTitles.confirm) {
                error = 'unknown';
                if (html.includes('Incorrect string value:')) {
                    error = 'emoji';
                } else if (title === httpClient.errors.maniacBoardTitles.error) {
                    var maniacErrorMessage = scrapers.errorMessage(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage];
                    }
                }
            }

            if (!error) {
                sharedCache.del('private-messages' + '/' + from);
                sharedCache.del('private-messages' + '/' + to);
            }

            fn(null, error);
        });
    };
};
