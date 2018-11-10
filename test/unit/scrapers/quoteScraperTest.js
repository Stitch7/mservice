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

describe('quoteScraper', function() {
    it('it should parse message html and return a quote model', function(done) {
        loadHtmlRessource('quote', function (errorHtml, html) {
            loadJsonRessource('quote', function (errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var quote = scrapers.quote(html);
                expect(quote).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});
