/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function () {
    return function (req, res, next) {
        if (req.log) {
            req.log.info({ req: req, res: res }, 'REQUEST');
        }
    };
};
