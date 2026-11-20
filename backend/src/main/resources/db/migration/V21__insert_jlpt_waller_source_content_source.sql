-- Source for the JLPT word lists loaded by V22/V23. Shown on the public /sources page.
-- shortcut: the CC BY licence is taken from repos that redistribute Waller's lists; tanos.co.uk was
-- unreachable, so the version is unverified. Verify before any of these words become REVIEWED.
INSERT INTO content_source (content_key, name, url, license, license_url, attribution)
VALUES ('jlpt-waller',
        'JLPT vocabulary lists (Jonathan Waller)',
        'https://github.com/jamsinclair/open-anki-jlpt-decks',
        'CC BY (version unverified)',
        'https://creativecommons.org/licenses/',
        'JLPT N5/N4 word lists and levels from Jonathan Waller''s JLPT Resources (tanos.co.uk), via the'
            || ' open-anki-jlpt-decks project. Vietnamese meanings are AI-drafted by LearnFlow.')
ON CONFLICT (content_key) DO NOTHING;
