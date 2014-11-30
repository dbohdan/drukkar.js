var app = app || {};

(function() {
    'use strict';

    app.PageView = Backbone.View.extend({
        el: "body",

        events: {
            "submit": function() {
                var query = document.querySelector("#searchfield").value;
                if (query === "") {
                    return false;
                } else {
                    app.router.navigate("/search/" + query, {trigger: true});
                }
            }
        },

        config: null,

        template: _.template(document.querySelector("#container_template").textContent),

        errorTemplate: _.template(document.querySelector("#error_template").textContent),

        filter: null,

        filter_default: function(post) {
            return !(post.isHidden || post.isExcluded);
        },
        currentPage: 0,

        initialize: function(options) {
            this.config = options.config;
            this.localization = new app.Localization();
            this.localization.url = "loc_" + this.config.get("locale") + ".json";
            this.localization.fetch();

            this.filter = this.filter_default;

            this.collection = new app.PostCollection();
            this.collection.url = this.config.get("entries_dir");
            this.collection.fetch = _.debounce(
                this.collection.fetch,
                this.config.get("refresh_interval") * 1000,
                true);
            this.collection.fetch();

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
                loc: this.localization.attributes,
                page: this.currentPage,
                max_page: Math.ceil(posts.length / per_page) - 1,
                route_prefix: route_prefix
            });
            if (posts_on_current_page.length > 0) {
                _.each(posts_on_current_page, function(post) {
                    this.renderPost(post);
                }, this);
            } else {
                if (this.kind[0] === "id") {
                    this.renderError(this.localization.get("entry_not_found"));
                } else {
                    this.renderError(this.localization.get("no_matches"));
                }
            }
        },

        renderPost: function(item) {
            var post_view = new app.PostView({
                model: item
            });
            post_view.config = this.config;
            post_view.localization = this.localization;
            this.append(post_view.render().el);
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
})();
