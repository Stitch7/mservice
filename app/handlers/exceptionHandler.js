/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client, responses) {
    return function (req, res, route, err) {
        if (req.log) {
            req.log.error({ req: req, route: route }, err);
        }
        responses.json(res, null, 'httpInternalServerError');
    };
};
