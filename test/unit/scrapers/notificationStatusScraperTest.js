/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('./../../helpers.js');
var scrapers = helpers.scrapers;
var loadHtmlRessource = helpers.loadHtmlRessource;
var loadJsonRessource = helpers.loadJsonRessource;

describe('notificationStatusScraper', function() {
    it('it should parse html and return notification status', function(done) {
        loadHtmlRessource('message', function (error, html) {
            expect(error).to.be.null;

            var notificationStatus = scrapers.notificationStatus(html);
            expect(notificationStatus).to.eql({notification: true});

            done();
        });
    });
});
