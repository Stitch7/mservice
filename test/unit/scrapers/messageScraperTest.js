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

describe('messageScraper', function() {
    it('it should parse html and return a user a message', function(done) {
        loadHtmlRessource('message', function (errorHtml, html) {
            loadJsonRessource('message', function (errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var messageId = 3320238;
                var message = scrapers.message(scrapers, messageId, html);
                expect(message).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});
