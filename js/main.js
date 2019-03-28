'use strict';


/*
 * Modules
 */

require('core-js/fn/object/assign');
const Immutable = require('immutable');
const m = require('mithril');
const marked = require('marked');
const moment = require('moment');
const Stream = require('mithril/stream');


/*
 * Globals used for cross-cutting concerns
 */

// Application configuration. Loaded once at the start.
const config = Stream({});
// The localization strings. Also loaded once at the start.
const loc = Stream({});
// After initialization contains a PostList object. The object is preserved when
// switching components.
const postList = Stream({});
// The search query input. Preserved when switching components.
const searchQueryInput = Stream('');
const version = '0.7.0';


/*
 * Utility functions
 */

const isDefined = (x) => typeof x !== 'undefined';

// Make plain text suitable for m.trust().
const escapeHtml = (text) => {
    return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
};

// Convert content to HTML from text or Markdown according to format.
const htmlize = (content, format='html') => {
    if (format === 'text') {
        return escapeHtml(content);
    } else if (format === 'markdown') {
        return marked(content);
    } else {
        // Assume the data is HTML.
        return content;
    }
};

// Return the plain text contained in html without the tags.
const stripTags = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
};

// Convert a UNIX date to a string according to the format set in the
// configuration file.
const formatDate = (date) => {
    return moment
            .unix(date)
            .utcOffset(config().time_zone)
            .format(config().date_format);
};


/*
 * RequestCache - a caching m.request wrapper
 */

const RequestCache = {
    cache: {},

    // Return a cached version of an m.request with the parameters in data if
    // the cache is fresh (no older than config().refresh_interval seconds);
    // otherwise, make a new request and return it.
    request(data, cacheBust=false) {
        const now = Date.now();
        // Note that we do not cache functions.
        const key = JSON.stringify(data);

        if (cacheBust) {
            data = Object.assign({}, data, {
                url: data.url + `?cache=${Date.now()}`
            });
        };

        if (!isDefined(this.cache[key])) {
            this.cache[key] = m.request(data);
            setTimeout(() => delete this.cache[key],
                       config().refresh_interval * 1000);
        };

        return this.cache[key];
    }
};


/*
 * Post - the blog entry model
 */

class Post extends Immutable.Record({filename: '', title: '', text: '',
                                     format: 'html', files: [], date: 0,
                                     tags: [], stub: false}) {
    constructor(data={}) {
        if (config().entry_date_from_file_name) {
            const datePrefix = data.filename.split(/-/)[0];
            data = Object.assign({}, data, {
                date: moment.utc(datePrefix, 'YYYYMMDDHHmmss').unix(),
            });
        };
        return super(data);
    };

    // Load a Post from url. Returns an m.request.
    static fetch(url) {
        // Convert an XML DOM for a blog entry to an object.
        const deserialize = (dataToDeserialize) => {
            const xml = (new DOMParser()).parseFromString(dataToDeserialize,
                                                        'text/xml');
            const map = (arraylike, callback) => {
                const result = [];
                for (var i = 0; i < arraylike.length; i++) {
                    result.push(callback(arraylike[i]));
                }
                return result;
            };
            const getAllValues = (nodes) => {
                return map(nodes, (el) => { return el.textContent })
            }
            const result = {};

            map(xml.querySelectorAll('entry > :not(file):not(tag)'), (el) => {
                result[el.tagName] = el.textContent
            });
            result.files = getAllValues(xml.querySelectorAll('entry > file'));
            result.tags = getAllValues(xml.querySelectorAll('entry > tag'));
            result.filename = url.substr(url.lastIndexOf('/') + 1);

            return result;
        };

        return RequestCache.request({
            deserialize,
            method: 'GET',
            type: Post,
            url: url,
        }, config().cache_bust);
    };
};


/*
 * PostList - a post stub collection that fetches full posts on demand
 */

class PostList extends Immutable.Record({baseUrl: '', posts: [], index: []}) {
    constructor({baseUrl, posts, index}) {
        super({baseUrl, posts, index: index || PostList.makeIndex(posts)});
    };

    fetchFullPost(index) {
        if (index < 0 || index >= this.posts.length) {
            return Promise.reject('wrong index');
        }
        return Post.fetch(this.baseUrl + this.posts[index].filename);
    };

    filenameToIndex(filename, appendExt=false) {
        const key = filename + (appendExt ? '.xml' : '');
        return key in this.index ? this.index[key] : -1;
    };

    filter(tag=null, withExcluded=false) {
        return this.posts.filter((post) => {
            return (post.tags.indexOf('_hidden') === -1) &&
                   (withExcluded || (post.tags.indexOf('_excluded') === -1)) &&
                   ((tag === null) || post.tags.indexOf(tag) > -1);
        });
    };

    page(n, tag=null) {
        const from = n * config().entries_per_page;
        const to = from + config().entries_per_page;

        const filtered = this.filter(tag, (tag !== null));
        const maxPage =
            Math.ceil(filtered.length / config().entries_per_page) - 1;
        const data = Promise.all(filtered.slice(from, to).map((post) => {
            return this.fetchFullPost(this.filenameToIndex(post.filename));
        }));
        return {data, maxPage};
    };

    postByFilename(filename) {
        return this.fetchFullPost(this.filenameToIndex(filename));
    };

    // Full text search.
    search(query=null) {
        let promises = [];
        for (let i = 0; i < this.posts.length; i++) {
            promises.push(this.fetchFullPost(i));
        };

        return Promise.all(promises).then((posts) => {
            return posts.filter((post) => {
                const plainText =
                    stripTags(
                        htmlize(post.title, post.format) + ' ' +
                        htmlize(post.text, post.format)
                    ) + ' ' +
                    post.files.join(' ') + ' ' +
                    (config().show_dates ? formatDate(post.date) : '');
                return plainText.toLowerCase().indexOf(
                    query.toLowerCase()
                ) > -1;
            });
        });
    };

    static fetch(baseUrl) {
        const deserialize = (dataToDeserialize) => {
            const postStubs = JSON.parse(dataToDeserialize);
            for (let i = 0; i < postStubs.length; i++) {
                postStubs[i].stub = true;
            };

            return {baseUrl, posts: postStubs};
        };

        return RequestCache.request({
            deserialize,
            method: 'GET',
            type: PostList,
            url: baseUrl + 'entries.json',
        }, config().cache_bust);
    };

    static makeIndex(posts) {
        const index = {};
        for (let i = 0; i < posts.length; i++) {
            index[posts[i].filename] = i;
        };
        return index;
    };
};


/*
 * Views
 */

const errorView = (message) => {
    return m('.errormessage', message);
};

// Format an individual blog post. post is a Post object.
const postView = (post) => {
    const fileList = [];
    for (let i = 0; i < post.files.length; i++) {
        const file = post.files[i];
        fileList.push(m('a', {
            href: config().files_dir + encodeURIComponent(file)
        }, file));
        fileList.push(m('br'));
    };

    const tagList = [];
    for (let i = 0; i < post.tags.length; i++) {
        const tag = post.tags[i];
        if (tag === '_excluded' || tag === '_hidden') {
            continue;
        };
        tagList.push(m('a', {
            href: '#!/tag/' + encodeURIComponent(tag)
        }, tag));
        tagList.push(m.trust(', '));
    };
    tagList.pop();

    const substValue = (locStr, value) => {
        const arr = locStr.split('%s', 2);
        return [m.trust(arr[0]), value, m.trust(arr[1])];
    };

    return m('.blogentry', [
        m('h2.entrytitle', [
            m('a.titlelink', {
                href: '#!/' + post.filename.substr(
                    0, post.filename.lastIndexOf('.')
                )
            }, m.trust(htmlize(post.title, post.format)))
        ]),
        m('.text', m.trust(htmlize(post.text, post.format))),
        m('p.files', fileList),
        (config().show_dates ? m('p.date', formatDate(post.date)) : null),
        m('p.tags', substValue(loc().tags, tagList))
    ]);
};

// Format a page worth of blog content.
const pageView = ({content, maxPage, page, pageType, query,
                          searchQueryInput, tag}) => {
    const navbar = config().navbar_enabled ?
            m('#navbar', config().navbar_links.map((item) => {
                return m('a', {href: item.href}, item.text);
            }))
            : null;
    const search = config().search_enabled ?
            m('#search', [
                m('form#searchformform', {
                    onsubmit(e) {
                        e.preventDefault();
                        if (searchQueryInput() !== '') {
                            m.route.set('/search/' + searchQueryInput());
                        };
                        return false;
                    }},[
                    m('#searchform', [
                        m('input#searchfield[type="text"][name="search"]' +
                          '[id="searchfield"][size="50"]', {
                            value: searchQueryInput(),
                            onchange: m.withAttr('value', (value) => {
                                searchQueryInput(value);
                            }),
                        }),
                        m.trust('&nbsp'),
                        m('input.button#searchbutton[type="submit"]', {
                            value: loc().search
                        })
                    ])
                ])
            ])
            : null;
    const sidebar = config().sidebar_enabled ?
                  m('#sidebar', m.trust(config().sidebar))
                  : null;

    let pageHrefPrefix = '#!';
    if (pageType === 'tag') {
        pageHrefPrefix += '/tag/' + tag;
    } else if (pageType === 'search') {
        pageHrefPrefix += '/search/' + query;
    };

    const pageLinks = m('#pagelinks', [
        (page > 0 ?
            m('a#prevpagelink', {
                href: pageHrefPrefix + (page == 1 ? '' : '/page/' + page)
            }, loc().prev_page)
            : null),
        (page < maxPage ?
            m('a#nextpagelink', {
                href: pageHrefPrefix + '/page/' + (page + 2)
            }, loc().next_page)
            : null)
    ]);

    return m('#container', [
        m('#header', [
            m('h1#title', m('a[id="blogtitle"][href="#!/"]', config().title)),
            m(
                'h2#subtitle',
                {visible: config().subtitle !== ''},
                config().subtitle
            )
        ]),
        navbar,
        search,
        sidebar,
        m('#content', content.concat(pageLinks)),
        m('#footer', [
            'Powered by ',
            m('a[href="https://github.com/dbohdan/drukkar.js"]', 'Drukkar.js'),
            ' ',
            version
        ])
    ]);
};

// Format the whole document.body for the blog and optionally update
// document.title.
const blogView = ({error, maxPage, pageType, page, posts, query,
                   searchQueryInput, setDocumentTitle, tag}) => {
    window.scrollTo(0, 0);
    let content = null;

    if (error) {
        if (pageType === 'post') {
            content = [errorView(loc().entry_not_found)];
        } else {
            content = [errorView(loc().no_matches)];
        }
    } else {
        posts = posts || [];
        content = posts.map(postView);
    };

    // Update the document title.
    const sep = ' | ';
    const withSeparator = function(s) {
        return s === '' ? '' : s + sep;
    };

    if (setDocumentTitle) {
        let title = '';
        if (pageType === 'tag') {
            title = loc().tag_title.replace(/%s/, tag);
        } else if (pageType === 'search') {
            title = loc().search_title.replace(/%s/, query);
        } else if (!error && (pageType === 'post') && (posts.length > 0)) {
            title = stripTags(posts[0].title);
        };
        if (page > 0) {
            title = withSeparator(title) + loc().page.replace(/%s/, page + 1);
        };
        title = withSeparator(title) + config().title;
        document.title = title;
    };

    return pageView({
        content,
        maxPage,
        page,
        query,
        searchQueryInput,
        tag,
    });
};


/*
 * Components
 */

let Timeline = {
    oninit(vnode) {
        vnode.state.error = false;
        vnode.state.page = +(vnode.attrs.page || 1) - 1;
        vnode.state.tag = vnode.attrs.tag || null;
        vnode.state.pageType = vnode.state.tag === null ? 'timeline' : 'tag';

        const key = 'timeline:page=' + vnode.state.page +
                    (vnode.attrs.tag === null ? '' : 'tag=' + vnode.state.tag);
        m.route.set(m.route.get(), null, {replace: true, state: {key}});

        return PostList.fetch(postList().baseUrl).then(postList).then(() => {
            const {data, maxPage} =
                postList().page(vnode.state.page, vnode.state.tag);
            vnode.state.maxPage = maxPage;
            return data;
        }).then((posts) => {
            vnode.state.error = vnode.state.page < 0 ||
                                vnode.state.page > vnode.state.maxPage ||
                                posts.length === 0;
            vnode.state.posts = posts;
        });
    },

    view(vnode) {
        return blogView({
            error: vnode.state.error,
            maxPage: vnode.state.maxPage,
            page: vnode.state.page,
            pageType: vnode.state.pageType,
            posts: vnode.state.posts,
            query: vnode.state.query,
            searchQueryInput,
            setDocumentTitle: true,
            tag: vnode.state.tag,
        });
    }
};

let SinglePost = {
    oninit(vnode) {
        vnode.state.error = false;
        vnode.state.pageType = 'post';

        const filename = vnode.attrs.id + '.xml';
        const key = 'post:filename=' + filename;
        m.route.set(m.route.get(), null, {replace: true, state: {key}});

        return PostList.fetch(postList().baseUrl).then(postList).then(() => {
            return postList().postByFilename(filename);
        }).then((post) => {
            vnode.state.posts = [post];
        }, (error) => {
            vnode.state.error = true;
            vnode.state.posts = [];
        });
    },

    view(vnode) {
        return Timeline.view(vnode);
    }
};

let Search = {
    oninit(vnode) {
        vnode.state.error = false;
        vnode.state.pageType = 'search';
        vnode.state.query = vnode.attrs.query || '';

        const key = 'search:query=' + vnode.state.query;
        m.route.set(m.route.get(), null, {replace: true, state: {key}});

        return PostList.fetch(postList().baseUrl).then(postList).then(() => {
            return postList().search(vnode.state.query);
        }).then((posts) => {
            vnode.state.error = posts.length === 0;
            vnode.state.posts = posts;
        });
    },

    view(vnode) {
        return Timeline.view(vnode);
    }
};


/*
 * Initialization
 */

// Download the config, the localization and the post list then set up routing.
m.request({url: 'drukkar.json'})
    .then(config)
    .then(() => {
        // Apply the theme.
        document.getElementById('page_style').href =
            config().base_location + config().themes_dir +
            config().theme + '/blog.css';

        config().sidebar = config().sidebar ||
                           document.getElementById('sidebar').innerHTML;

        return RequestCache.request({
            method: 'GET',
            url: config().base_location + `loc_${config().locale}.json`
        });
    })
    .then(loc)
    .then(() => {
        return PostList.fetch(config().base_location + config().entries_dir);
    })
    .then(postList)
    .then(() => {
        m.route(document.body, '/', {
            '/:id': SinglePost,
            '/': Timeline,
            '/page/:page': Timeline,
            '/tag/:tag': Timeline,
            '/tag/:tag/page/:page': Timeline,
            '/search/:query': Search,
        });
    });
