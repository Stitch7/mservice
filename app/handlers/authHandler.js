/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(client, responses) {
    return function(req, res, next) {
        if (req.authorization.basic === undefined) {
            return responses.json(res, null, 'login', null);
        }

        var username = unescape(req.authorization.basic.username);
        var password = unescape(req.authorization.basic.password);

        client.login(res, username, password, function(res) {
            next();
        });
    };
};