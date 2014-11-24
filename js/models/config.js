var app = app || {};

(function() {
    'use strict';

    app.Config = Backbone.Model.extend({
        url: 'drukkar.json'
    });
})();
