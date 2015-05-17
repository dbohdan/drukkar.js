'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var moment = require('moment');
var underscoreString = require('underscore.string');
_.mixin(underscoreString.exports());

var Config = require('./models/config');
var PageView = require('./views/pageview');
var BlogRouter = require('./routers/blogrouter');

var config = new Config();
var config_override = {
    version: "0.3.0"
};

config.fetch().then(function() {
    var page = new PageView({config: config});
    var router = new BlogRouter(page);
    config.set(config_override);
    Backbone.history.start();
});
