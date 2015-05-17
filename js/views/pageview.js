'use strict';

var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');

var Localization = require('../models/localization');
var PostCollection = require('../collections/postcollection');
var PostView = require('../views/postview');

var add_if_not_blank = function(s1, s2) {
    return (s1 === "" ? "" : s1 + s2);
}

module.exports = Backbone.View.extend({
    el: "body",

    searchHandler: null,

    events: {
        "submit": function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            var query = document.querySelector("#searchfield").value;
            if (query === "") {
                return false;
            } else {
                this.searchHandler(query);
            }
        }
    },

    config: null,

    template: _.template(document.querySelector("#container_template").textContent),

    errorTemplate: _.template(document.querySelector("#error_template").textContent),

    filter: null,

    currentPage: 0,

    initialize: function(options) {
        this.config = options.config;

        var that = this;

        var cont = function() {
            // Message localization.
            that.localization = new Localization();
            that.localization.url = "loc_" + that.config.get("locale") + ".json";
            that.localization.fetch();

            // Posts.
            that.collection = new PostCollection([], {
                config: that.config
            });
            that.collection.url = that.config.get("entries_dir");
            that.collection.fetch = _.debounce(
                that.collection.fetch,
                that.config.get("refresh_interval") * 1000,
                true);
            that.collection.fetch().done(function() {
                that.render();
            });

            that.kind = ["page"];
            that.filter = that.collection.makeFilterDefault();
        }

        // Load blog theme and continue.
        $('#page_style').load(cont).attr({
            href: "themes/" + this.config.get("theme") + "/blog.css"
        });
    },

    updateTitle: function(posts, title_sep) {
        var title_sep = title_sep || " | ";

        var title = '';
        if (this.kind[0] === "id") {
            title = posts[0].getPlainText("title");
        } else if (this.kind[0] === "search") {
            title = _.sprintf(this.localization.get("search_title"), this.kind[1]);
        } else if (this.kind[0] === "tag") {
            title = _.sprintf(this.localization.get("tag_title"),this.kind[1]);
        }

        if (this.currentPage > 0) {
            title = add_if_not_blank(title, title_sep) +
                    _.sprintf(this.localization.get("page"), this.currentPage)
        }

        document.title = add_if_not_blank(title, title_sep) + this.config.get("title");
    },

    postsOnCurrentPage: null,

    render: function() {
        var that = this;

        // Do not render the page before the posts list has loaded.
        if (!_.has(that, "collection")) {
            return false;
        }

        var cont = function() {
            var posts = that.filter(that.collection);
            that.postsOnCurrentPage = posts.slice(
                that.currentPage * per_page,
                (that.currentPage + 1) * per_page
            );

            // Set the document title.
            if (that.postsOnCurrentPage.length > 0) {
                that.updateTitle(that.postsOnCurrentPage);
            }

            // Render the template.
            that.el.innerHTML = that.template({
                config: that.config.attributes,
                loc: that.localization.attributes,
                page: that.currentPage,
                max_page: Math.ceil(posts.length / per_page) - 1,
                route_prefix: route_prefix,
                search_query: (that.kind[0] === "search" ? that.kind[1] : "")
            });
            if (that.postsOnCurrentPage.length > 0) {
                // Refresh and render all post for the page.
                _.each(that.postsOnCurrentPage, function(post) {
                    post.refresh().done(function() {
                        that.renderPost(post);
                    });
                }, that);
            } else {
                // Display an appropriate error message if there are no posts to show.
                if (that.kind[0] === "id") {
                    that.renderError(that.localization.get("entry_not_found"));
                } else {
                    that.renderError(that.localization.get("no_matches"));
                }
            };
        };

        // Get the posts that match the current filter.
        var route_prefix = "";
        var per_page = null;
        if (that.kind[0] === "tag" || that.kind[0] === "search") {
            route_prefix = that.kind.join("/") + "/";
            per_page = that.config.get("entries_per_page_for_tags_and_search");
            that.collection.fetchItems().done(cont);
        } else {
            per_page = that.config.get("entries_per_page");
            cont();
        }
    },

    renderPost: function(item) {
        var that = this;

        var post_view = new PostView({
            model: item
        });
        post_view.config = that.config;
        post_view.localization = that.localization;
        that.append(post_view.render().el);
    },

    renderError: function(message) {
        var error = document.createElement('div');
        error.innerHTML = this.errorTemplate({
            message: message,
            config: this.config.attributes,
            loc: this.localization.attributes
        });
        this.append(error);
    },

    append: function(node) {
        var content = this.el.querySelector("#content");
        var after_entries = content.querySelector("#pagelinks");
        content.insertBefore(node, after_entries);
    }
});
