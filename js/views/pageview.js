var app = app || {};

(function() {
    'use strict';

    app.PageView = Backbone.View.extend({
        el: "body",

        events: {
            "submit #searchformform": function() {
                app.router.navigate("/search/" + document.querySelector("#searchfield").value,
                    {trigger: true});
            }
        },

        config: null,

        template: _.template(document.querySelector("#container_template").textContent),

        filter: null,

        filter_default: function(post) {
            return !(post.isHidden || post.isExcluded);
        },

        currentPage: 0,

        initialize: function(options) {
            this.config = options.config;
            this.filter = this.filter_default;
            this.collection = new app.PostCollection();
            this.collection.url = this.config.attributes.entries_dir;
            var that = this;
            this.collection.on("update", function() {
                that.render();
            });
        },

        render: function() {
            if (this.collection.size() === 0) {
                return false;
            }

            var route_prefix = "";
            var per_page = null;
            if (this.kind[0] === "tag" || this.kind[0] === "search") {
                route_prefix = this.kind.join("/") + "/";
                per_page = this.config.get("entries_per_page_for_tags_and_search");
            } else {
                per_page = this.config.get("entries_per_page");
            }

            var posts = this.collection.filter(this.filter);
            var posts_on_current_page = posts.slice(
                this.currentPage * per_page,
                (this.currentPage + 1) * per_page
            )

            this.el.innerHTML = this.template({
                config: this.config.attributes,
                page: this.currentPage,
                max_page: Math.ceil(posts.length / per_page) - 1,
                route_prefix: route_prefix
            });
            if (posts_on_current_page.length > 0) {
                _.each(posts_on_current_page, function(post) {
                    this.renderPost(post);
                }, this);
            } else {
                if (this.kind[0] === "id") { // TODO: display these in the page.
                    debug("The entry you've specified doesn't exist.");
                } else {
                    debug("No matching entries found.");
                }
            }
        },

        renderPost: function(item) {
            var post_view = new app.PostView({
                model: item
            });
            post_view.config = this.config;
            var content = this.el.querySelector("#content");
            var after_entries = content.querySelector("#pagelinks");
            content.insertBefore(post_view.render().el, after_entries);
        }
    });
})();
