'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var Post = require('../models/post');
var moment = require('moment');

var PostView = Backbone.View.extend({
    model: Post,

    config: null,

    localization: null,

    template: _.template(document.querySelector("#post_template").textContent),

    formatDate: function(date, date_format, time_zone) {
        var time_zone = time_zone || "UTC";
        return moment.unix(parseInt(date, 10)).utcOffset(time_zone).format(date_format);
    },

    formatTags: function(tags, sep) {
        var sep = sep || ", ";
        return _(tags).filter(function(tag) {
            return !(tag === "_excluded" || tag === "_hidden");
        }).map(function(tag) {
            return '<a href="#/tag/' + encodeURIComponent(tag) + '">' + _.escape(tag) + '</a>';
        }).join(sep);
    },

    render: function() {
        this.el.innerHTML = this.template(
            _.extend(_.clone(this.model.attributes), {
                config: this.config.attributes,
                loc: this.localization.attributes,
                htmlize: Post.prototype.htmlize,
                format_post_date: this.formatDate,
                format_post_tags: this.formatTags
            })
        );
        return this;
    }
});

module.exports = PostView;
