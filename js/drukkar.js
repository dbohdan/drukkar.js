var app = app || {};

// Convert data to HTML from text or Markdown according to format.
var htmlize = function(data, format) {
    if (format === "text") {
        return _.escape(data);
    } else if (format === "markdown") {
        return marked(data);
    } else {
        // Assume the data is HTML.
        return data;
    }
};

var format_post_date = function(date, date_format, time_zone) {
    var time_zone = time_zone || "UTC";
    return moment.unix(parseInt(date, 10)).zone(time_zone).format(date_format);
};

var debug = function(x) {
    console.log(JSON.stringify(x));
};

(function() {
    'use strict';

    app.config_override = {
        version: "0.1.0"
    };

    app.config = new app.Config();
    app.config.on("sync", function() {
        app.page = new app.PageView({config: app.config});
        app.router = new app.BlogRouter();
        Backbone.history.start();
        app.config.set(app.config_override);
        app.page.collection.fetch(); // TODO: fetch at interval to make updates show up.
    });
    app.config.fetch();
})();
