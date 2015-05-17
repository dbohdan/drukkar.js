'use strict';

var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var moment = require('moment');
var marked = require('marked');

module.exports = Backbone.Model.extend({
    defaults: {
        title: "",
        text: "",
        format: "html",
        files: [],
        date: "0",
        tags: []
    },

    lastUpdated: null,

    refreshInterval: 0,

    initialize: function() {
        var that = this;
        this.on("change:tags", function() {
            that.isExcluded = _.indexOf(that.get("tags"), "_excluded") > -1;
            that.isHidden = _.indexOf(that.get("tags"), "_hidden") > -1;
        });
    },

    parse: function(response) {
        var parsed = {files: [], tags: []};
        _.each(response.querySelectorAll('entry > :not(file):not(tag)'), function(el) {
            parsed[el.tagName] = el.textContent;
        });
        parsed.files = _.map(response.querySelectorAll('entry > file'), function(el) {
            return el.textContent;
        });
        parsed.tags = _.map(response.querySelectorAll('entry > tag'), function(el) {
            return el.textContent;
        });
        return parsed;
    },

    fetch: function(options) {
        options = options || {};
        options.dataType = "xml";
        return Backbone.Model.prototype.fetch.call(this, options);
    },

    refresh: function(fetchOptions) {
        var currentSeconds = moment().seconds();

        if (_.isNull(this.lastUpdated) ||
                (currentSeconds - this.lastUpdated > this.refreshInterval)) {
            this.lastUpdated = currentSeconds;
            return this.fetch(fetchOptions);
        } else {
            return $.when();
        }
    },

    htmlize: function(data, format) {
        // Convert data to HTML from text or Markdown according to format.
        if (format === "text") {
            return _.escape(data);
        } else if (format === "markdown") {
            return marked(data);
        } else {
            // Assume the data is HTML.
            return data;
        }
    },

    getPlainText: function(attribute) {
        return _.stripTags(this.htmlize(this.get(attribute), this.get("format")));
    },

    isHidden: false,

    isExcluded: false
});
