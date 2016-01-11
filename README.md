**Drukkar.js** is an experiment to make a client-side JavaScript-based flat file blog engine that is compatible with [Drukkar](http://drukkar.sourceforge.net/). It is completely compatible with Drukkar's blog post files and attempts to have a configuration format identical to Drukkar's `config.xml` except where it does not make sense. It is currently a prototype.

Usage
=====

1. Configure Drukkar.js through `drukkar.json`.
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
* New settings in the config file: `"navbar_links"` and `"refresh_interval"`. When the user navigates to a blog post that was last fetched more than N seconds ago Drukkar.js will try to reload its content from the server. The value of N is set in `"refresh_interval"` and is 60 by default. The value of `"navbar_links"` determines the hyperlinks in the blog's navbar. It is an array where each element is an object with two members: `"href"` for the link's destination and `"text"` for the link's text.
* The setting `"entries_per_page_for_tags_and_search"` has been removed. The value of `"entries_per_page"` is used when browsing posts by tag. Search returns every post that matches the search query.

License
=======

MIT.
