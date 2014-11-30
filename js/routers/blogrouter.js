var app = app || {};

(function() {
    'use strict';

    app.BlogRouter = Backbone.Router.extend({
        routes: {
            "": "index",
            "page/:page": "page",
            "tag/:tag(/page/:page)": "tag",
            ":id": "id",
            "search/:query(/page/:page)": "search",
            "*path": "index"
        },

        index: function() {
            // Fetch new posts when the user decides to navigate to the homepage.
            // This action is rate limited by app.page.collection.fetch itself.
            if (_.has(app.page, "collection")) {
                if (app.page.config.get("refresh_posts_when_navigating_home")) {
                    app.page.collection.fetch({ reset: true });
                }
            }
            this.page(0);
        },

        page: function(page) {
            app.page.filter = app.page.makeFilterDefault();
            app.page.currentPage = +page;
            app.page.kind = ["page"];
            app.page.render();
        },

        id: function(id) {
            app.page.filter = app.page.makeFilterId(id);
            app.page.currentPage = 0;
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
                app.page.filter = app.page.makeFilterTag(tag);
                app.page.currentPage = +page;
            }
            app.page.kind = ["tag", tag];
            app.page.render();
        },

        search: function(query, page) {
            app.page.filter = app.page.makeFilterSearch(query.toLowerCase());
            app.page.kind = ["search", query];
            app.page.currentPage = +page;
            app.page.render();
        }
    });
})();
