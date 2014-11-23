**Drukkar.js** is an experiment to make a client-side JavaScript-based flat file blog engine that is compatible with [Drukkar](http://drukkar.sourceforge.net/). It is completely compatible with Drukkar's blog post files and will attempt to have a configuration format identical to Drukkar's `config.xml` except where it does not make sense. It is currently a prototype.

Usage
=====

1\. Configure Drukkar.js (not yet).
2\. Put your posts in `entries/` and files in `files/`.
3\. Run `make-post-list.sh`.
4\. Deploy.

Missing features
================

Compared to the original Drukkar Drukkar.js lacks

* Search;
* Tags;
* Pagination;
* Configuration;
* A post editor and a file uploader. These will not be implemented.

License
=======

MIT.
