/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, boardId, threadId, messageId, username, password, subject, text, notification, fn) {
        var options = {
            form: {
                mode: 'messagesave',
                brdid: boardId,
                nick: username,
                pass: password,
                subject: subject,
                body: text,
                notification: notification
            }
        };
        if (messageId) {
            options.form.msgid = messageId;
        }

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
                } else if (title === httpClient.errors.maniacBoardTitles.edit) {
                    var maniacErrorMessage2 = scrapers.errorMessage2(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage2] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage2];
                    }
                }
            }

            if (!error) {
                sharedCache.del('threadList/' + boardId);
                if (threadId) {
                    sharedCache.del('messageList/' + threadId);
                }
            }

            fn(null, error);
        });
    };
};
