[![Build status](https://travis-ci.org/dbohdan/drukkar.js.svg?branch=gh-pages)](https://travis-ci.org/dbohdan/drukkar.js)

**Drukkar.js** is an experiment to make a client-side JavaScript-based blog engine compatible with [Drukkar](http://drukkar.sourceforge.net/). It understands Drukkar's blog post files verbatim and attempts to have a configuration file format identical to Drukkar's `config.xml` except where it makes no sense. It only needs an HTTP server serving static files as a back end.

Live demo
=========

Available on [GitHub Pages](https://dbohdan.github.io/drukkar.js/).

Usage
=====

1. Configure Drukkar.js through `drukkar.json`. Be sure to set `base_location` to the correct value for your deployment.
2. Put your posts in `entries/` and your files in `files/`.
3. Run `./make-post-list.py entries/`.
4. Deploy.

Missing features
================

Compared to the original Drukkar Drukkar.js lacks

* A post editor and a file uploader. These will not be implemented.

Changes from Drukkar
====================

* The configuration file is called `drukkar.json`. It uses JSON instead of XML.
* Rather than [PHP date formatting](http://php.net/manual/en/function.date.php), Drukkar.js uses Moment.js [formatting](http://momentjs.com/docs/#/displaying/format/) and [UTC offset](http://momentjs.com/docs/#/manipulating/utc-offset/) (time zone) syntax.
* New settings in the config file: `"refresh_interval"`, `"cache_bust"`, `"navbar_links"`, `"sidebar"` and `"themes_dir"`.
 * When the user navigates to a new blog page Drukkar.js will try to fetch the relevant blog entries and/or the blog entry list from the server if they were last fetched more than *N* seconds ago. The value of *N* is determined by `"refresh_interval"`; it is 60 by default.
 * If `"cache_bust"` is set to `true`, Drukkar.js will attempt to bypass browser caching when it requests the entry list and the individual entry files from the server by appending `?cache=<unique number>` to their URLs. This can prevent the user being shown stale content, e.g., when you add a new blog entry. With the right web server configuration, however, you should not need to activate this feature. (E.g., if you add `Cache-Control: max-age=60` to the HTTP headers to prevent the browser from caching the content for longer than 60 seconds.)
 * `"navbar_links"` determines the hyperlinks in the blog's navbar. It is an array where each element is an object with two members: `"href"` for the link's destination and `"text"` for the link's text.
 * If the key `"sidebar"` is present, its value is treated as HTML and used as the contents of the sidebar. If it is absent, the sidebar will contain the children of the element `#sidebar` in `index.html`.
 * `"themes_dir"` tells Drukkar.js where the themes are located relative to the `"base_location"` path.
* The setting `"entries_per_page_for_tags_and_search"` has been removed. The value of `"entries_per_page"` is used when browsing posts by tag. Search returns every post that matches the search query.

License
=======

MIT.
