**Drukkar.js** is an experiment to make a client-side JavaScript-based flat file blog engine that is compatible with [Drukkar](http://drukkar.sourceforge.net/). It is completely compatible with Drukkar's blog post files and attempts to have a configuration format identical to Drukkar's `config.xml` except where it does not make sense. It is currently a prototype.

Usage
=====

1\. Configure Drukkar.js through `drukkar.json`.
2\. Put your posts in `entries/` and files in `files/`.
3\. Run `make-post-list.sh`.
4\. Deploy.

Missing features
================

Compared to the original Drukkar Drukkar.js lacks

* Search;
* Tags;
* Pagination;
* Localization;
* A post editor and a file uploader. These two will not be implemented.

License
=======

MIT.
