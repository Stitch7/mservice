/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    text,
    textHtml,
    textHtmlWithEmbeddedImages
) {
    this.previewText = text;
    this.previewTextHtml = textHtml;
    this.previewTextHtmlWithImages = textHtmlWithEmbeddedImages;
};
