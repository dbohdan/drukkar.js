var app = app || {};

(function() {
    'use strict';

    app.PostCollection = Backbone.Collection.extend({
        model: app.Post,

        comparator: function(post1, post2) {
            // Sort by XML file name (=== id) like the original.
            return (post1.attributes.id < post2.attributes.id ? 1 : -1);
        },

        initialize: function(posts, options) {
        },

        makeFilterDefault: function() {
            return function(that) {
                return that.filter(function(post) {
                    return !(post.isHidden || post.isExcluded);
                });
            };
        },

        makeFilterId: function(id) {
            return function(that) {
                return that.filter(function(post) {
                    return post.get("id") === id + ".xml";
                });
            };
        },

        makeFilterTag: function(tag) {
            return function(that) {
                return that.filter(function(post) {
                    if (post.isHidden) {
                        return false;
                    }
                    return _.some(post.attributes.tags, function(post_tag) {
                        return post_tag === tag;
                    });
                });
            };
        },

        makeFilterText: function(text) {
            return function(that) {
                return that.filter(function(post) {
                    if (post.isHidden) {
                        return false;
                    }
                    var plain_text = post.getPlainText("title") +
                            post.getPlainText("text") +
                            (post.get("files").join());
                    if (app.config.get("show_dates")) {
                        plain_text += format_post_date(
                            post.get("date"),
                            app.config.get("date_format"),
                            app.config.get("time_zone")
                        );
                    }
                    // TODO: strip out HTML and Markdown from text and title.
                    return plain_text.toLowerCase().indexOf(text) > -1;
                });
            };
        },

        parse: function(response) {
            var split = response.split("\n");
            var that = this;
            // Fetch and parse models.
            var parsed = _.map(split.slice(0, split.length - 1), function(id) {
                var post = new app.Post({
                    id: id
                });
                post.collection = that;
                return post;
            });
            return parsed;
        },

        fetch: function(options) {
            options = options || {};
            options.dataType = 'text';
            options.url = this.url + 'postlist.txt';
            options.cache = false;
            return Backbone.Collection.prototype.fetch.call(this, options);
        },

        fetchItems: function(options) {
            options = options || {};

            var deferreds = this.map(function(post) {
                return post.refresh();
            });
            return $.when(deferreds);
        }
    });
})();
