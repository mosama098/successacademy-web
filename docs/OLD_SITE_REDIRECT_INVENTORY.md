# Old-site redirect preparation

This is a planning inventory only. Release 3 does not access, change, or redirect `successacademy.training`.

| Old content category | Eventual destination on `https://eg.successacademy.training` |
| --- | --- |
| English-course homepage and general course pages | Closest localized homepage (`/ar` or `/en`) |
| Placement Test | Matching localized `/[locale]/placement-test` |
| Plans or pricing | Matching localized `/[locale]/plans` |
| Corporate English training | Matching localized `/[locale]/business` |
| Valuable article with a verified equivalent | Closest matching `/[locale]/blog/[slug]` article |
| Article without a genuine equivalent | Relevant localized blog index or homepage; do not invent a one-to-one mapping |

Before shutdown, export the old site's real URL inventory and traffic/backlink data, then approve each redirect individually. Avoid redirect chains and preserve query strings only where they remain meaningful.
