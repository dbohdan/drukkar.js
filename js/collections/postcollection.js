var app = app || {};

(function() {
    'use strict';

    app.PostCollection = Backbone.Collection.extend({
        model: app.Post,

        updateCounter: 0,

        comparator: function(post1, post2) {
            // Sort by XML file name (=== id) like the original.
            return (post1.attributes.id < post2.attributes.id ? 1 : -1);
        },

        initialize: function(posts, options) {
            var that = this;
            this.on("change", function(post) {
                if (that.size() === that.updateCounter) {
                    that.trigger("update");
                }
            });
        },

        parse: function(response) {
            var split = response.split("\n");
            var that = this;
            // that.updateCounter = 0;
            // Fetch and parse models.
            var parsed = _.map(split.slice(0, split.length - 1),function(id) {
                var post = new app.Post({
                    id: id
                });
                post.collection = that;
                post.once("change", function(post) {
                    that.updateCounter++;
                });
                post.fetch();
                return post;
            });
            return parsed;
        },

        fetch: function(options) {
            options = options || {};
            options.dataType = "text";
            options.url = this.url + 'postlist.txt';
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });
})();
