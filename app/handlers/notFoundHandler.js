/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client, responses) {
    return function (req, res, next) {
        if (req.log) {
            req.log.warn({ req: req }, 'NotFound');
        }
        responses.json(res, null, 'httpNotFound');
    };
};
