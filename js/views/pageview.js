var app = app || {};

(function() {
    'use strict';

    var add_if_not_blank = function(s1, s2) {
        return (s1 === "" ? "" : s1 + s2);
    }

    app.PageView = Backbone.View.extend({
        el: "body",

        events: {
            "submit": function(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }

                var query = document.querySelector("#searchfield").value;
                if (query === "") {
                    return false;
                } else {
                    app.router.navigate("/search/" + encodeURIComponent(query), {trigger: true});
                }
            }
        },

        config: null,

        template: _.template(document.querySelector("#container_template").textContent),

        errorTemplate: _.template(document.querySelector("#error_template").textContent),

        filter: null,

        makeFilterDefault: function() {
            return function(post) {
                return !(post.isHidden || post.isExcluded);
            };
        },

        makeFilterId: function(id) {
            return function(post) {
                return post.get("id") === id + ".xml";
            };
        },

        makeFilterTag: function(tag) {
            return function(post) {
                if (post.isHidden) {
                    return false;
                }
                return _.some(post.attributes.tags, function(post_tag) {
                    return post_tag === tag;
                });
            }
        },

        makeFilterSearch: function(query) {
            return function(post) {
                if (post.isHidden) {
                    return false;
                }
                var plain_text = post.getPlainText("title") +
                        post.getPlainText("text") +
                        (post.get("files").join());
                if (app.page.config.get("show_dates")) {
                    plain_text += format_post_date(
                        post.get("date"),
                        app.page.config.get("date_format"),
                        app.page.config.get("time_zone")
                    );
                }
                // TODO: strip out HTML and Markdown from text and title.
                return plain_text.toLowerCase().indexOf(query) > -1;
            }
        },

        currentPage: 0,

        initialize: function(options) {
            this.config = options.config;

            var that = this;

            var cont = function() {
                // Message localization.
                that.localization = new app.Localization();
                that.localization.url = "loc_" + that.config.get("locale") + ".json";
                that.localization.fetch();

                // Posts.
                that.filter = that.filterDefault;

                that.collection = new app.PostCollection();
                that.collection.url = that.config.get("entries_dir");
                that.collection.fetch = _.debounce(
                    that.collection.fetch,
                    that.config.get("refresh_interval") * 1000,
                    true);
                that.collection.fetch();

                that.collection.on("update", function() {
                    that.render();
                });
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

        render: function() {
            // Do not render the page before there are posts loaded.
            if (!_.has(this, "collection") || this.collection.size() === 0) {
                return false;
            }

            // Get the posts that match the current filter.
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

            // Set the document title.
            if (posts_on_current_page.length > 0) {
                this.updateTitle(posts_on_current_page);
            }

            // Render the template.
            this.el.innerHTML = this.template({
                config: this.config.attributes,
                loc: this.localization.attributes,
                page: this.currentPage,
                max_page: Math.ceil(posts.length / per_page) - 1,
                route_prefix: route_prefix,
                search_query: (this.kind[0] === "search" ? this.kind[1] : "")
            });
            if (posts_on_current_page.length > 0) {
                _.each(posts_on_current_page, function(post) {
                    this.renderPost(post);
                }, this);
            } else {
                // Display an appropriate error message if there are no posts to show.
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
