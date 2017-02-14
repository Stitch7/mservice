/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(client, responses) {
    return {
        /**
         * Message list
         */
        index: function (req, res, next) {
            client.messageList(res, req.params.boardId, req.params.threadId, function (messages, error) {
                responses.json(res, messages, error, next);
            });
        },
        /**
         * Show Message
         */
        show: function (req, res, next) {
            client.message(res, req.params.boardId, req.params.messageId, function (messages, error) {
                responses.json(res, messages, error, next);
            });
        },
        /**
         * Quote Message
         */
        quote: function (req, res, next) {
            client.quoteMessage(res, req.params.boardId, req.params.messageId, function (quote, error) {
                responses.json(res, quote, error, next);
            });
        },
        /**
         * Get notification status
         */
        notificationStatus: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            client.notificationStatus(res, req.params.boardId, req.params.messageId, function (notificationStatus, error) {
                responses.json(res, notificationStatus, error, next);
            });
        },
        /**
         * Toggle notication status for given messageId
         */
        notification: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            client.notification(res, req.params.boardId, req.params.messageId, function (data, error) {
                responses.json(res, data, error, next);
            });
        },
        /**
         * Preview Message Text
         */
        preview: function (req, res, next) {
            var text = req.params.text;
            if (text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.previewMessage(res, req.params.boardId, text, function (message, error) {
                responses.json(res, message, error, next);
            });
        },
        /**
         * Creates a reply
         */
        create: function (req, res, next) {
            if (req.params.subject === undefined || req.params.text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.createMessage(
                res,
                req.params.boardId,
                req.params.threadId,
                req.params.messageId,
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
         * Edit a message
         */
        update: function (req, res, next) {
            if (res.jar === undefined) {
                // TODO
            }

            var subject = req.params.subject;
            var text = req.params.text;
            if (subject === undefined || text === undefined) {
                responses.json(res, null, 'httpBadRequest');
                return;
            }

            client.updateMessage(
                res,
                req.params.boardId,
                req.params.threadId,
                req.params.messageId,
                subject,
                text,
                function (data, error) {
                    responses.json(res, data, error, next);
                }
            );
        },
        /**
         * Get Responses on Messages
         */
        responses: function (req, res, next) {
            client.messageResponses(res, req.params.username, function (user, error) {
                responses.json(res, user, error, next);
            });
        }
    };
};
