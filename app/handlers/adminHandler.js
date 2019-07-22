/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client, responses) {
    return function (req, res, next) {
        if (req.authorization.basic === undefined ||
            req.authorization.basic.username !== 'admin' ||
            req.authorization.basic.password !== process.env.ADMIN_KEY
        ) {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('need creds');
        } else {
            next();
        }
    };
};
