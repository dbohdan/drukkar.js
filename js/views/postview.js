var app = app || {};

(function() {
    'use strict';

    app.PostView = Backbone.View.extend({
        model: app.Post,

        config: null,

        localization: null,

        template: _.template(document.querySelector("#post_template").textContent),

        render: function() {
            this.el.innerHTML = this.template(
                _.extend(_.clone(this.model.attributes),{
                    config: this.config.attributes,
                    loc: this.localization.attributes
                })
            );
            return this;
        }
    });
})();
