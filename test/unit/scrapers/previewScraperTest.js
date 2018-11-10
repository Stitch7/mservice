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

describe('previewScraper', function() {
    it('it should parse html and return a user a preview', function(done) {
        loadHtmlRessource('preview', function (errorHtml, html) {
            loadJsonRessource('preview', function (errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var preview = scrapers.preview(html);
                expect(preview).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});
