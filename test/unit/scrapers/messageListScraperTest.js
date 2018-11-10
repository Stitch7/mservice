/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('./../../helpers.js');
var scrapers = helpers.scrapers;
var loadHtmlRessource = helpers.loadHtmlRessource;
var loadJsonRessource = helpers.loadJsonRessource;

describe('messageListScraper', function() {
    it('it should parse html and return an array of messages', function(done) {
        loadHtmlRessource('messageList', function (errorHtml, html) {
            loadJsonRessource('messageList', function (errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var messageList = scrapers.messageList(html);
                expect(messageList).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});
