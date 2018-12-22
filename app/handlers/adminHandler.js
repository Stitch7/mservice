/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client, responses) {
    return function (req, res, next) {
        if (req.authorization.basic === undefined ||
            req.authorization.basic.username != 'admin' ||
            req.authorization.basic.password != process.env.ADMIN_KEY)
        {
            return responses.json(res, null, 'login', null);
        }

        next();
    };
};
