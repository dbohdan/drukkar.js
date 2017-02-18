**Drukkar.js** is an experiment to make a client-side JavaScript-based blog engine compatible with [Drukkar](http://drukkar.sourceforge.net/). It is fully compatible with Drukkar's blog post files and attempts to have a configuration file format identical to Drukkar's `config.xml` except where it doesn't make sense. It only needs an HTTP server serving static files as a back end.

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
* Rather than [PHP date formatting](http://php.net/manual/en/function.date.php) Drukkar.js uses Moment.js [formatting](http://momentjs.com/docs/#/displaying/format/) and [UTC offset](http://momentjs.com/docs/#/manipulating/utc-offset/) (time zone) syntax.
* New settings in the config file: `"cache_bust"`, `"navbar_links"`, `"refresh_interval"`, `"sidebar"` and `"themes_dir"`.
 * If `"cache_bust"` is set to `true`, Drukkar.js will attempt to bypass browser caching for the entry list and the individual entry files it requests from the server by appending `?cache=<unique number>` to their URLs. The purpose of this is to show the user new or updated blog content as soon as you deploy it. You should not need to activate this feature if you can configure your web server's HTTP headers. (E.g., add the field `Cache-Control: max-age=60` to the headers to prevent the browser from caching the content for longer than 60 seconds.)
 * When the value of `"refresh_interval"` is set to *N*, Drukkar.js will try to reload the relevant blog entries and/or the blog entry list from the server if they were last fetched more than *N* seconds ago when the user navigates to a new blog page. The value is 60 by default.
 * `"navbar_links"` determines the hyperlinks in the blog's navbar. It is an array where each element is an object with two members: `"href"` for the link's destination and `"text"` for the link's text.
 * If the key `"sidebar"` is present, its value is treated as HTML and used as the contents of the sidebar. If it is absent, the sidebar will contain the children of the element `#sidebar` in `index.html`.
 * `"themes_dir"` tells Drukkar.js where relative to the `"base_location"` path the theme files are located.
* The setting `"entries_per_page_for_tags_and_search"` has been removed. The value of `"entries_per_page"` is used when browsing posts by tag. Search returns every post that matches the search query.

License
=======

MIT.
