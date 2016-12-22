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

describe('boardsScraper', function() {
    it('it should parse html and return all boards', function(done) {
        loadHtmlRessource('boardList', function (errorHtml, html) {
            loadJsonRessource('boards', function (errorJson, json) {              
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var boards = scrapers.boards(html);                
                expect(boards).to.have.lengthOf(8);
                expect(boards).to.eql(JSON.parse(json));                

                done();
            });        
        });
    });
});
