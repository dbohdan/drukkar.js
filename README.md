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

* Localization support;
* A post editor and a file uploader. These two will not be implemented.

Changes from Drukkar
====================

* The configuration file is called `drukkar.json`. It uses JSON instead of XML.
* Rather than [PHP date formatting](http://php.net/manual/en/function.date.php) Drukkar.js uses Moment.js [formatting](http://momentjs.com/docs/#/displaying/format/) and [time zone syntax](http://momentjs.com/docs/#/manipulating/timezone-offset/).

License
=======

MIT.
