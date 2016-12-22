/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client, responses) {
    return function (req, res, next) {       
        if (req.log) {
            req.log.warn({ req: req }, 'MethodNotAllowed');
        }
        responses.json(res, null, 'httpMethodNotAllowed');
    };
};
