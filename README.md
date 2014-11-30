**Drukkar.js** is an experiment to make a client-side JavaScript-based flat file blog engine that is compatible with [Drukkar](http://drukkar.sourceforge.net/). It is completely compatible with Drukkar's blog post files and attempts to have a configuration format identical to Drukkar's `config.xml` except where it does not make sense. It is currently a prototype.

Usage
=====

1. Configure Drukkar.js through `drukkar.json`.
2. Put your posts in `entries/` and files in `files/`.
3. Run `make-post-list.sh`.
4. Deploy.

Missing features
================

Compared to the original Drukkar Drukkar.js lacks

* A post editor and a file uploader. These will not be implemented.

Changes from Drukkar
====================

* The configuration file is called `drukkar.json`. It uses JSON instead of XML.
* Rather than [PHP date formatting](http://php.net/manual/en/function.date.php) Drukkar.js uses Moment.js [formatting](http://momentjs.com/docs/#/displaying/format/) and [time zone syntax](http://momentjs.com/docs/#/manipulating/timezone-offset/).
* A new setting in the config file: `"refresh_posts_when_navigating_home"` and `"refresh_interval"`. If it is set to `true` Drukkar.js will try to fetch new posts when the user navigates to page zero (the homepage) of the blog but it will do so no more often than every (60 seconds by default).

License
=======

MIT.
