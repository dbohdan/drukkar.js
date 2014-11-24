var htmlize = null;
var format_post_date = null;

(function() {
    'use strict';

    var config_override = {
        version: "0.0.1"
    };

    var debug = function(x) {
        console.log(JSON.stringify(x));
    }

    // Convert data to HTML from text or Markdown according to format.
    htmlize = function(data, format) {
        if (format === "text") {
            return _.escape(data);
        } else if (format === "markdown") {
            return marked(data);
        } else {
            // Assumet data is HTML.
            return data;
        }
    }

    format_post_date = function(date, date_format, time_zone) {
        var time_zone = time_zone || "UTC";
        return moment.unix(parseInt(date, 10)).zone(time_zone).format(date_format);
    }

    var Post = Backbone.Model.extend({
        defaults: {
            title: "",
            text: "",
            format: "html",
            files: "",
            date: "0",
            tags: ""
        },

        initialize: function() {
            var that = this;
            this.on("change:tags", function() {
                that.isExcluded = _.indexOf(that.get("tags"), "_excluded") > -1;
                that.isHidden = _.indexOf(that.get("tags"), "_hidden") > -1;
            });
        },

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
        },

        isHidden: false,

        isExcluded: false
    });

    var PostCollection = Backbone.Collection.extend({
        model: Post,

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
        url: 'drukkar.json'
    });

    var PageView = Backbone.View.extend({
        el: "body",

        config: null,

        template: _.template(document.querySelector("#container_template").textContent),

        filter: null,

        filter_default: function(post) {
            return !(post.isHidden || post.isExcluded);
        },

        initialize: function(options) {
            this.config = options.config;
            this.filter = this.filter_default;
            this.collection = new PostCollection();
            this.collection.url = this.config.attributes.entries_dir;
            var that = this;
            this.collection.on("update", function() {
                that.render();
            });
        },

        render: function() {
            this.el.innerHTML = this.template({config: this.config.attributes});
            _.each(this.collection.filter(this.filter), function(item) {
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

    var page = null;
    var BlogRouter = Backbone.Router.extend({
        routes: {
            "": "index",
            "page/:page": "page",
            "tag/:tag": "tag",
            ":id": "id",
            "search/:query": "search"
        },

        id: function(id) {
            page.filter = function(post) {
                return post.get("id") === id + ".xml";
            }
            page.render();
        },

        index: function() {
            page.filter = page.filter_default;
            page.render();
        },

        tag: function(tag) {
            if (tag === "_excluded" || tag === "_hidden") {
                // Do not search for the special tags.
                page.filter = function(post) {
                    return false;
                }
            } else {
                page.filter = function(post) {
                    if (post.isHidden) {
                        return false;
                    }
                    return _.some(post.attributes.tags, function(post_tag) {
                        return (post_tag === tag);
                    });
                }
            }
            page.render();
        },

        search: function(query) {
            var q = query.toLowerCase();
            page.filter = function(post) {
                if (post.isHidden) {
                    return false;
                }
                var plain_text = post.get("title") +
                        post.get("text") +
                        post.get("files").join();
                if (page.config.get("show_dates")) {
                    plain_text += format_post_date(post.get("date"),
                            page.config.get("date_format"),
                            page.config.get("time_zone"));
                }
                // TODO: strip out HTML and Markdown from text and title.
                return plain_text.toLowerCase().indexOf(q) > -1;
            }
            page.render();
        }
    });

    var config = new Config();
    config.on("sync", function() {
        page = new PageView({config: config});
        var router = new BlogRouter();
        Backbone.history.start();
        config.set(config_override);
        page.collection.fetch();
    });
    config.fetch();
})();
