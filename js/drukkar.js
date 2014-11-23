(function() {
    'use strict';

    function debug(x) {
        console.log(JSON.stringify(x));
    }

    var Post = Backbone.Model.extend({
        parse: function(response) {
            var parsed = {files: [], tags: []};
            _.each(response.querySelectorAll('entry > :not(file):not(tag)'), function(el) {
                parsed[el.tagName] = el.textContent;
            });
            parsed.files = _.map(response.querySelectorAll('entry > file'), function(el) {
                return el.textContent;
            });
            parsed.tags = _.map(response.querySelectorAll('entry > tag'), function(el) {
                return el.textContent;
            });
            return parsed;
        },

        fetch: function(options) {
            options = options || {};
            options.dataType = "xml";
            return Backbone.Model.prototype.fetch.call(this, options);
        }
    });

    var PostCollection = Backbone.Collection.extend({
        model: Post,

        updateCounter: 0,

        comparator: function(post) {
            // Sort by XML file name (=== id) like the original.
            return post.date // FIXME
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
            var parsed = _.map(split.slice(0, split.length - 1).reverse(),function(id) {
                var post = new Post({
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
            options.url = this.url + '/postlist.txt';
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    var PostView = Backbone.View.extend({
        model: Post,

        config: null,

        template: _.template(document.querySelector("#post_template").textContent),

        render: function() {
            this.el.innerHTML = this.template(
                _.extend(_.clone(this.model.attributes),
                        {config: this.config.attributes})
            );
            return this;
        }
    });

    var Config = Backbone.Model.extend({
        urlRoot: '/',

        url: 'drukkar.json',
    });

    var PageView = Backbone.View.extend({
        el: "body",

        config: null,

        template: _.template(document.querySelector("#container_template").textContent),

        initialize: function() {
            this.collection = new PostCollection();
        },

        render: function() {
            this.el.innerHTML = this.template({config: this.config.attributes});
            this.collection.each(function(item) {
                this.renderPost(item);
            }, this);
        },

        renderPost: function(item) {
            var post_view = new PostView({
                model: item
            });
            post_view.config = this.config;
            this.el.querySelector("#content").appendChild(post_view.render().el);
        }
    });

    var BlogRouter = Backbone.Router.extend({});

    // Backbone.history.start();
    var config = new Config();
    config.on("sync", function() {
        var page = new PageView();
        page.config = config;
        config.set({version: "0.0.1"});
        page.collection.url = config.attributes.entries_dir;
        page.collection.fetch();
        page.collection.on("update", function() {
            page.render();
        })
    });
    config.fetch();
})();
