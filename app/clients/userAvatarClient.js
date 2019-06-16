/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var http = require("http");

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, url, fn) {
        var cacheKey = 'userAvatar/' + url;
        var cacheTtl = 3600; // 1 hour


        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            console.log('fetchong image: ' + url);
            http.get(url, function(response) {

                console.log('got image');
            // httpClient.get(res, url, function (data, error) {
                fn(response);
            });
        });
    };
};
