'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var PostCollection = require('../collections/postcollection');

module.exports = Backbone.Router.extend({
    pageView: null,

    routes: {
        "": "index",
        "page/:page": "page",
        "tag/:tag(/page/:page)": "tag",
        ":id": "id",
        "search/:query(/page/:page)": "search",
        "*path": "id"
    },

    initialize: function(pageView) {
        var that = this;
        this.pageView = pageView;
        this.pageView.searchHandler = function(query) {
            that.navigate("/search/" + encodeURIComponent(query), {
                trigger: true
            });
        }
    },

    index: function() {
        // Fetch new posts when the user decides to navigate to the homepage.
        // This action is rate limited by this.pageView.collection.fetch itself.
        if (_.has(this.pageView, "collection")) {
            if (this.pageView.config.get("refresh_posts_when_navigating_home")) {
                this.pageView.collection.fetch({ reset: true });
            }
        }
        this.page(0);
    },

    page: function(page) {
        this.pageView.filter = PostCollection.prototype.makeFilterDefault();
        this.pageView.currentPage = +page;
        this.pageView.kind = ["page"];
        this.pageView.render();
    },

    id: function(id) {
        this.pageView.filter = PostCollection.prototype.makeFilterId(id);
        this.pageView.currentPage = 0;
        this.pageView.kind = ["id", id];
        this.pageView.render();
    },

    tag: function(tag, page) {
        if (tag === "_excluded" || tag === "_hidden") {
            // Do not search for the special tags.
            this.pageView.filter = function() {
                return [];
            }
        } else {
            this.pageView.filter = PostCollection.prototype.makeFilterTag(tag);
            this.pageView.currentPage = +page;
        }
        this.pageView.kind = ["tag", tag];
        this.pageView.render();
    },

    search: function(query, page) {
        this.pageView.filter = PostCollection.prototype.makeFilterText(query.toLowerCase());
        this.pageView.kind = ["search", query];
        this.pageView.currentPage = +page;
        this.pageView.render();
    }
});
