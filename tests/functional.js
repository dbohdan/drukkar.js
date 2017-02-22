const Nightmare = require('nightmare');
const assert = require('chai').assert;

const baseUrl = 'http://localhost:8080/drukkar.js/';
const defaultOpts = {show: false};
const postTitles = '.blogentry > .entrytitle > .titlelink';


const start = (subpath='', extraOpts={}) => {
    return Nightmare(Object.assign({}, defaultOpts, extraOpts))
        .goto(baseUrl + subpath)
};

const getText = function(selector) {
    const nodes = document.querySelectorAll(selector);
    const result = [];
    for (let i = 0; i < nodes.length; i++) {
        result.push(nodes[i].textContent);
    };
    return result;
};

Nightmare.action('text', function(selector, done) {
    this.evaluate_now(getText, done, selector);
});


describe('User visits a timeline page', () => {
    it('should display paginated blog posts', () => {
        let acc = [];
        const nm = start();
        return nm
            .wait(postTitles)
            .text(postTitles)
            .then((x) => {
                acc = acc.concat(x);
                return nm
                    .click('#nextpagelink')
                    .wait(100) // Hack!
                    .wait(postTitles)
                    .text(postTitles)
                    .end();
            })
            .then((x) => {
                acc = acc.concat(x);
                assert.deepEqual(acc, [
                    "Welcome to Drukkar\n",
                    "Welcome\n",
                    "The manual\n",
                    "Changelog",
                ]);
            });
    });

    it('should have clickable post titles', () => {
        const nm = start();
        return nm
            .wait(postTitles)
            .click('.blogentry:nth-child(1) > .entrytitle > .titlelink')
            .wait(100) // Hack!
            .wait(postTitles)
            .title()
            .then((x) => assert.equal(x, 'Welcome to Drukkar' +
                                      ' | Blog title here'));
    });

    it('should have clickable tag links', () => {
        const nm = start();
        return nm
            .wait(postTitles)
            .click('.blogentry:nth-child(2) > .tags > a:nth-child(1)')
            .wait(postTitles)
            .title()
            .then((x) => assert.equal(x, "Posts tagged 'hello'" +
                                      ' | Blog title here'));
    });

    it('should have working search', () => {
        let docTitle = null;
        const nm = start();
        return nm
            .wait(postTitles)
            .type('#searchfield', 'f1.ext')
            .click('#searchbutton')
            .wait(100) // Hack!
            .wait(postTitles)
            .title()
            .then((x) => {
                docTitle = x;
                return nm
                    .text(postTitles)
                    .end();
            })
            .then((foundPosts) => {
                assert.equal(docTitle, "Searching for 'f1.ext'" +
                             ' | Blog title here');
                assert.deepEqual(foundPosts, ["Welcome to Drukkar\n"]);
            });
    });
});

const assertChangelogPost = (nm) => {
    return nm
        .wait(postTitles)
        .text('.text')
        .then((x) => {
            assert.match(x[0], new RegExp(
                '^\n  2.0.0:\n    The big change this release is'
            ));
        });
};

describe('User visits a post page', () => {
    it('should display the post', () => {
        const nm = start('#!/0-changelog');
        return assertChangelogPost(nm);
    });
});

describe('User visits a tag page', () => {
    it('should display posts with the tag', () => {
        const nm = start('#!/tag/changelog');
        return assertChangelogPost(nm);
    });
});

describe('User visits a search page', () => {
    it('should display posts matching the query', () => {
        const nm = start('#!/search/changelog');
        return assertChangelogPost(nm);
    });
});
