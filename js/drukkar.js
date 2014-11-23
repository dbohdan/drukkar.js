(function() {
    'use strict';

    function debug(x) {
        console.log(JSON.stringify(x));
    }

    var Post = Backbone.Model.extend({
        urlRoot: '/entries',

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
    //var Config = Backbone.Model.extend({});

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
                    that.trigger("updated");
                }
            });
        },

        parse: function(response) {
            var split = response.split("\n");
            var that = this;
            // that.updateCounter = 0;
            // Fetch and parse models.
            var parsed = _.map(split.slice(0, split.length - 1).reverse(),function(id) {
                var post = new Post({id: id});
                post.once("change", function(post) {
                    that.updateCounter++;
                });
                post.fetch();
                return post;
            });
            debug(parsed);
            return parsed;
        },

        fetch: function(options) {
            options = options || {};
            options.dataType = "text";
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    var PostView = Backbone.View.extend({
        model: Post,

        template: _.template(document.querySelector("#post_template").textContent),

        render: function() {
            this.el.innerHTML = this.template(this.model.attributes);
            return this;
        }
    });

    var PageView = Backbone.View.extend({
        el: "body",

        config: {
            version: "0.0.1"
        },

        initialize: function() {
            this.collection = new PostCollection();
            this.render();
        },

        render: function() {
            this.el.innerHTML = this.template(this.config);
            this.collection.each(function(item) {
                this.renderPost(item);
            }, this);
        },

        renderPost: function(item) {
            var post_view = new PostView({
                model: item
            });
            this.el.querySelector("#content").appendChild(post_view.render().el);
        },

        template: _.template(document.querySelector("#container_template").textContent),
    });

    var BlogRouter = Backbone.Router.extend({});

    // Backbone.history.start();

    var page = new PageView();
    page.collection.url = '/entries/postlist.txt';
    page.collection.fetch();
    page.collection.on("updated", function() {
        page.render();
    })
})();
