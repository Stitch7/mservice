/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function (client) {
    return function (req, res, next) {
        if (req.authorization.basic === undefined) {
            return next();
        }

        var username = req.authorization.basic.username.replace('--COLON--', ':');
        var password = req.authorization.basic.password;
        client.login(res, username, password, function (res) {
            next();
        });
    };
};
