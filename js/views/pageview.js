var app = app || {};

(function() {
    'use strict';

    app.PageView = Backbone.View.extend({
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
            this.collection = new app.PostCollection();
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
            var post_view = new app.PostView({
                model: item
            });
            post_view.config = this.config;
            this.el.querySelector("#content").appendChild(post_view.render().el);
        }
    });
})();
