var app = app || {};

(function() {
    'use strict';

    app.BlogRouter = Backbone.Router.extend({
        routes: {
            "": "index",
            "page/:page": "page",
            "tag/:tag(/page/:page)": "tag",
            ":id": "id",
            "search/:query(/page/:page)": "search"
        },

        index: function() {
            this.page(0);
        },

        page: function(page) {
            app.page.filter = app.page.filter_default;
            app.page.currentPage = +page;
            app.page.kind = ["page"];
            app.page.render();
        },

        id: function(id) {
            app.page.filter = function(post) {
                return post.get("id") === id + ".xml";
            }
            app.page.kind = ["id", id];
            app.page.render();
        },

        tag: function(tag, page) {
            if (tag === "_excluded" || tag === "_hidden") {
                // Do not search for the special tags.
                app.page.filter = function(post) {
                    return false;
                }
            } else {
                app.page.filter = function(post) {
                    if (post.isHidden) {
                        return false;
                    }
                    return _.some(post.attributes.tags, function(post_tag) {
                        return (post_tag === tag);
                    });
                }
                app.page.currentPage = +page;
            }
            app.page.kind = ["tag", tag];
            app.page.render();
        },

        search: function(query, page) {
            var q = query.toLowerCase();
            app.page.filter = function(post) {
                if (post.isHidden) {
                    return false;
                }
                var plain_text = post.get("title") +
                        post.get("text") +
                        post.get("files").join();
                if (app.page.config.get("show_dates")) {
                    plain_text += format_post_date(post.get("date"),
                            app.page.config.get("date_format"),
                            app.page.config.get("time_zone"));
                }
                // TODO: strip out HTML and Markdown from text and title.
                return plain_text.toLowerCase().indexOf(q) > -1;
            }
            app.page.kind = ["search", query];
            app.page.currentPage = +page;
            app.page.render();
        }
    });
})();
