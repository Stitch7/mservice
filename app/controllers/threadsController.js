/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(client, responses) {
    return {
        /**
         * Index action
         */
        index: function (req, res, next) {
            client.threadList(res, req.params.boardId, function (threadList, error) {
                responses.json(res, threadList, error, next);
            });
        },
        /**
         * Create action
         */
        create: function (req, res, next) {
            if (req.params.subject === undefined || req.params.text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.createMessage(
                res,
                req.params.boardId,
                null,
                req.authorization.basic.username,
                req.authorization.basic.password,
                req.params.subject,
                req.params.text,
                req.params.notification,
                function (data, error) {
                    responses.json(res, data, error, next);
                }
            );
        },
        /**
         * Search action
         */
        search: function (req, res, next) {
            var phrase = req.params.phrase;
            if (phrase === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.searchThreads(res, req.params.boardId, phrase, function (threadList, error) {
                responses.json(res, threadList, error, next);
            });
        }
    };
};
