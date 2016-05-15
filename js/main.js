'use strict';


/*
 * Modules
 */

let m = require('mithril');
let marked = require('marked');
let moment = require('moment');


/*
 * Globals used for cross-cutting concerns
 */

// Application configuration. Loaded once at the start.
let config = m.prop({});
// The localization strings. Also loaded at the start.
let loc = m.prop({});
let version = "0.5.0";


/*
 * Utility functions
 */

 let isDefined = function (x) {
    return typeof x !== 'undefined';
 };

// Make plain text suitable for m.trust().
let escapeHtml = function (text) {
    return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
};

// Convert content to HTML from text or Markdown according to format.
let htmlize = function (content, format="html") {
    if (format === "text") {
        return escapeHtml(content);
    } else if (format === "markdown") {
        return marked(content);
    } else {
        // Assume the data is HTML.
        return content;
    }
};

let substValue = function (locStr, value) {
    let arr = locStr.split('%s', 2);
    return [m.trust(arr[0]), value, m.trust(arr[1])];
};

// Return the plain text contained in html without the tags.
let stripTags = function (html) {
    let div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
};

// Convert a UNIX date to a string according to the format set in the configuration file.
let formatDate = function (date) {
    return moment.unix(date)
            .utcOffset(config().time_zone)
            .format(config().date_format);
};

// Return an array consisting of those elements in arr for which the function test() returns true.
let filter = function (arr, test=null) {
    if (test === null) {
        return arr;
    };

    let result = [];
    for (let i = 0; i < arr.length; i++) {
        if (test(arr[i])) {
            result.push(arr[i]);
        };
    };
    return result;
};


/*
 * BlogPost - the blog entry model
 */

let BlogPost = function (data) {
    data = data || {};
    this.id = m.prop(data.id || "");
    this.title = m.prop(data.title || "");
    this.text = m.prop(data.text || "");
    this.format = m.prop(data.format || "html");
    this.files = m.prop(data.files || []);
    this.date = m.prop(data.date || "0");
    if (config().entry_date_from_file_name) {
        let datePrefix = this.id().split(/-/)[0];
        this.date(moment.utc(datePrefix, 'YYYYMMDDHHmmss').unix());
    };
    this.tags = m.prop(data.tags || []);
};

// Load a BlogPost from data.url. Returns an m.request.
BlogPost.get = function (data) {
    // Convert an XML DOM to an object.
    let deserialize = (dataToDeserialize) => {
        let xml = (new DOMParser()).parseFromString(dataToDeserialize, "text/xml");
        let map = (arraylike, callback) => {
            let result = [];
            for (var i = 0; i < arraylike.length; i++) {
                result.push(callback(arraylike[i]));
            }
            return result;
        };
        let getAllValues = (nodes) => {
            return map(nodes, (el) => { return el.textContent })
        }
        let result = {};

        map(xml.querySelectorAll('entry > :not(file):not(tag)'), (el) => {
            result[el.tagName] = el.textContent
        });
        result.files = getAllValues(xml.querySelectorAll('entry > file'));
        result.tags = getAllValues(xml.querySelectorAll('entry > tag'));
        result.id = data.url.substr(data.url.lastIndexOf('/') + 1);

        return result;
    };

    return RequestCache.request({
        method: "GET",
        url: data.url,
        type: BlogPost,
        deserialize
    });
};

// data.baseUrl
BlogPost.list = function (data) {
    return RequestCache.request({
        method: "GET",
        url: data.baseUrl + "entries.json",
    });
};


/*
 * RequestCache - a caching m.request wrapper
 */

let RequestCache = {
    cache: {}
};
// Return a cached version of an m.request with the parameters in data if the cache is fresh (no
// older than config().refresh_interval seconds); otherwise, make a new request and return it.
RequestCache.request = function (data) {
    //return m.request(data);

    let now = Date.now();
    let key = JSON.stringify(data); // Note that this does not cache functions.

    if (!isDefined(this.cache[key]) ||
            now - this.cache[key].updated > config().refresh_interval * 1000) {
        this.cache[key] = { request: m.request(data), updated: now };
    };

    return this.cache[key].request;
};


/*
 * Views
 */

// data.message
let errorView = function (data) {
    return m('.errormessage', data.message);
};


// Format an individual blog post. Data is a BlogPost object.
let postView = function (data) {
    let fileList = [];
    for (let i = 0; i < data.files().length; i++) {
        let file = data.files()[i];
        fileList.push(m('a', {href: config().files_dir + encodeURIComponent(file)}, file));
        fileList.push(m('br'));
    };

    let tagList = [];
    for (let i = 0; i < data.tags().length; i++) {
        let tag = data.tags()[i];
        if (tag === "_excluded" || tag === "_hidden") {
            continue;
        };
        tagList.push(m('a', {href: "#/tag/" + encodeURIComponent(tag)}, tag));
        tagList.push(m.trust(', '));
    };
    tagList.pop();

    return m('.blogentry', [
        m('h2.entrytitle', [
            m('a.titlelink', {href: "#/" + data.id().substr(0, data.id().lastIndexOf('.'))},
                    m.trust(htmlize(data.title(), data.format())))
        ]),
        m('.text', m.trust(htmlize(data.text(), data.format()))),
        m('p.files', fileList),
        (config().show_dates ? m('p.date', formatDate(data.date())) : null),
        m('p.tags', substValue(loc().tags, tagList))
    ]);
};


// Format a page worth of blog content.
// data.page
// data.maxPage
// data.content
// data.tag
// data.query
// data.searchQueryInput
let pageView = function (data) {
    let navbar = config().navbar_enabled ?
            m('#navbar', config().navbar_links.map((item) => {
                return m('a', {href: item.href}, item.text);
            }))
            : null;
    let searchRoute = function () {
        m.route('/search/' + data.searchQueryInput());
    };
    let search = config().search_enabled ?
            m('#search', [
                m('form#searchformform', [
                    m('#searchform', [
                        m('input#searchfield[type="text"][name="search"]' +
                                '[id="searchfield"][size="50"]', {
                                value: data.searchQueryInput(),
                                onchange: m.withAttr("value", (value) => {
                                    data.searchQueryInput(value);
                                }),
                            }),
                        m.trust('&nbsp'),
                        m('input.button#searchbutton[type="submit"]', {
                            onclick: () => {
                                searchRoute();
                                return false;
                            },
                            value: loc().search
                        })
                    ])
                ])
            ])
            : null;
    let sidebar = config().sidebar_enabled ?
            m('#sidebar', m.trust(document.getElementById('sidebar').innerHTML))
            : null;

    let pageHrefPrefix = '#';
    if (data.pageType === 'tag') {
        pageHrefPrefix += '/tag/' + data.tag;
    } else if (data.pageType === 'search') {
        pageHrefPrefix += '/search/' + data.query;
    };
    let pageLinks = m('#pagelinks', [
        (data.page > 0 ?
            m('a#prevpagelink', {
                href: pageHrefPrefix + "/page/" + (data.page - 1)
            }, loc().prev_page)
            : null),
        (data.page < data.maxPage ?
            m('a#nextpagelink', {
                href: pageHrefPrefix + "/page/" + (data.page + 1)
            }, loc().next_page)
            : null)
    ]);

    return m("#container", [
        m('#header', [
            m('h1#title', m('a[id="blogtitle][href="#"]', config().title)),
            m('h2#subtitle', {visible: config().subtitle !== ""}, config().subtitle)
        ]),
        navbar,
        search,
        sidebar,
        m('#content', data.content.concat(pageLinks)),
        m('#footer', [
            'Powered by ',
            m('a[href="https://github.com/dbohdan/drukkar.js"]', 'Drukkar.js'),
            ' ',
            version
        ])
    ]);
};


/*
 * App - the application core
 */

let App = {};

App.controller = function () {
    let pageType = '';
    if (isDefined(m.route.param('query'))) {
        pageType = 'search';
    } else if (isDefined(m.route.param('tag'))) {
        pageType = 'tag';
    } else if (isDefined(m.route.param('id'))) {
        pageType = 'id';
    };
    const page = isDefined(m.route.param('page')) ? +m.route.param('page') : 0;
    let maxPage = m.prop(null);
    let id = null;
    let tag = null;
    let query = null;
    let searchQueryInput = m.prop('');
    let postList = null;

    if (pageType === 'id') {
        id = m.route.param('id') + '.xml';
        postList = m.deferred().resolve([{filename: id, tags: []}]).promise;
    } else {
        if (pageType === 'tag') {
            tag = m.route.param('tag');
        } else if (pageType === 'search') {
            query = m.route.param('query');
            searchQueryInput(query);
        };
        postList = BlogPost.list({baseUrl: config().base_location + config().entries_dir});
    };

    const from = pageType === 'search' ? 0 : page * config().entries_per_page;
    const count = pageType === 'search' ? 1000000 : config().entries_per_page;

    // Remove hidden and (optionally) excluded posts, find posts with a tag.
    let filterMetadata = function (metadata, tag=null, withExcluded=false) {
        return filter(metadata, (post) => {
            return (post.tags.indexOf('_hidden') === -1) &&
                    (withExcluded || (post.tags.indexOf('_excluded') === -1)) &&
                    ((tag === null) || post.tags.indexOf(tag) > -1);
        });
    };
    let filterByText = function (posts, query=null) {
        if (query === null) {
            return posts;
        };

        return filter(posts, (post) => {
            let plainText = stripTags(htmlize(post.title(), post.format()) + " " +
                    htmlize(post.text(), post.format())) + " " +
                    post.files().join(" ") + " " +
                    (config().show_dates ? formatDate(post.date()) : "");
            return plainText.toLowerCase().indexOf(query.toLowerCase()) > -1;
        });
    };
    let postsFromMetadata = function (metadata, from, count) {
        let requests = metadata.slice(from, from + count).map((post) => {
            return BlogPost.get({
                url: config().base_location + config().entries_dir + post.filename
            });
        });
        return m.sync(requests);
    };

    let posts = postList.then((metadata) => {
        let filtered = filterMetadata(metadata, tag, (tag !== null) || (query !== null));
        return postsFromMetadata(filtered, from, count).then(
            (x) => {
                if (pageType === 'search') {
                    return filterByText(x, query);
                } else {
                    maxPage(Math.ceil(filtered.length / config().entries_per_page) - 1);
                    return x;
                };
            },
            (x) => {
                // On error return a empty post list.
                return [];
            }
        );
    });
    return { pageType, id, posts, page, maxPage, tag, query, searchQueryInput,
            setDocumentTitle: true };
};

App.view = function (ctrl) {
    let content = null;
    let error = true;
    if (ctrl.posts().length > 0) {
        error = false;
        content = ctrl.posts().map(postView);
    } else if (ctrl.pageType === 'id') {
        content = [errorView({message: loc().entry_not_found})];
    } else {
        content = [errorView({message: loc().no_matches})];
    };

    let sep = ' | ';
    let withSeparator = function(s) {
        return s === '' ? '' : s + sep;
    };

    if (ctrl.setDocumentTitle) {
        let title = '';
        if (ctrl.pageType === 'tag') {
            title = loc().tag_title.replace(/%s/, ctrl.tag);
        } else if (ctrl.pageType === 'search') {
            title = loc().search_title.replace(/%s/, ctrl.query);
        } else if (!error && (ctrl.pageType === 'id')) {
            title = stripTags(ctrl.posts()[0].title());
        };
        if (ctrl.page > 0) {
            title = withSeparator(title) + loc().page.replace(/%s/, ctrl.page);
        };
        title = withSeparator(title) + config().title;
        document.title = title;
    };

    return pageView({
        content,
        pageType: ctrl.pageType,
        page: ctrl.page,
        maxPage: ctrl.maxPage(),
        tag: ctrl.tag,
        query: ctrl.query,
        searchQueryInput: ctrl.searchQueryInput
    });
};

// Download the config and the localization then set up routing.
m.request({url: "drukkar.json"})
    .then(config)
    .then(() => {
        // Apply the theme.
        document.getElementById('page_style').href = config().base_location +
            config().themes_dir + config().theme + '/blog.css';

        RequestCache.request({
            method: "GET",
            url: config().base_location + `loc_${config().locale}.json`
        }).then(loc);

        m.route.mode = "hash";
        m.route(document.body, "/", {
            "/:id": App,
            "/": App,
            "/page/:page": App,
            "/tag/:tag": App,
            "/tag/:tag/page/:page": App,
            "/search/:query": App,
            "/search/:query/page/:page": App
        });
    });
