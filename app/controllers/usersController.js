/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(client, responses) {
    return {
        /**
         * Login
         */
        login: function (req, res, next) {
            responses.json(res,'OK', null, next);
        },
        /**
         * Show user profile
         */
        profile: function (req, res, next) {
            client.userProfile(res, req.params.userId, function (userProfile, error) {
                responses.json(res, userProfile, error, next);
            });
        },
        /**
         * Fetch latest user
         */
        latest: function (req, res, next) {
            client.latestUser(res, function (latestUser, error) {
                responses.json(res, latestUser, error, next);
            });
        }
    };
};
