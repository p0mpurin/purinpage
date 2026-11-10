# Internet Archive Movie Collection API Client

A typed TypeScript client for browsing and searching the [Internet Archive](https://archive.org/details/movies) public movie collection (Moving Image Archive).

## Features

- **No authentication required** — all endpoints are publicly accessible
- Full TypeScript typings for all requests and responses
- Four distinct API endpoints covered:
  1. `page_production` search (same API the site uses)
  2. `advancedsearch` (Lucene query language)
  3. `scrape` (cursor-based bulk export)
  4. `metadata` (per-item details + file list)
- Thumbnail image URLs via `services/img/{identifier}`
- Canonical `details` page URL generation

## Quick start

```bash
npm install
npx tsx api_client.ts
```

## APIs Covered

### 1. Page Production Search
`GET https://archive.org/services/search/beta/page_production/`

The main search endpoint used internally by the archive.org website. Supports free-text queries, pagination, and optional aggregation counts.

**Key parameters:**
| Parameter       | Description                              | Default    |
|-----------------|------------------------------------------|------------|
| `page_type`     | Always `collection_details`              | required   |
| `page_target`   | Collection ID, e.g. `movies`             | `movies`   |
| `user_query`    | Free-text search query                   | (all)      |
| `hits_per_page` | Results per page                         | `50`       |
| `page`          | 1-based page number                      | `1`        |
| `aggregations`  | Whether to include facet counts          | `false`    |

### 2. Advanced Search
`GET https://archive.org/advancedsearch.php`

Lucene-style query language search. Supports field filtering, year ranges, etc.

**Example queries:**
```
collection:movies mediatype:movies
collection:feature_films year:[1930 TO 1960]
collection:movies subject:(comedy) downloads:[1000000 TO *]
```

**Key parameters:**
| Parameter | Description                                 |
|-----------|---------------------------------------------|
| `q`       | Lucene query string                         |
| `fl[]`    | Fields to return (can be repeated)          |
| `rows`    | Results per page (default 50)               |
| `page`    | 1-based page number                         |
| `sort[]`  | Sort field, e.g. `downloads desc`           |
| `output`  | Always `json`                               |

### 3. Scrape API
`GET https://archive.org/services/search/v1/scrape`

Cursor-based bulk export. Minimum `count` is 100.

**Key parameters:**
| Parameter | Description                             |
|-----------|-----------------------------------------|
| `q`       | Lucene query string                     |
| `fields`  | Comma-separated list of fields          |
| `count`   | Batch size (min 100)                    |
| `cursor`  | Pagination cursor from previous result  |

### 4. Metadata API
`GET https://archive.org/metadata/{identifier}`

Returns full item information: all metadata fields plus the complete file listing.

`GET https://archive.org/metadata/{identifier}/metadata`

Returns only metadata fields (faster, no file list).

### 5. Thumbnail / Image Service
`GET https://archive.org/services/img/{identifier}`

Returns the item thumbnail image (JPEG or GIF). No parameters needed.

### 6. Canonical Details URL
`https://archive.org/details/{identifier}`

The human-readable archive.org page for any item.

## Usage Examples

```typescript
import { InternetArchiveClient } from './api_client.js';

const client = new InternetArchiveClient();

// Search for Chaplin movies
const results = await client.searchByTitle('chaplin', 1, 10);
console.log(results.response.body.hits.total); // e.g. 2759

// Get top downloads from feature_films collection
const topFilms = await client.listPublicDomainMovies(1, 20);
for (const doc of topFilms.response.docs) {
  console.log(doc.identifier, doc.title, doc.year);
}

// Get specific item metadata
const meta = await client.getItemMetadataOnly('his_girl_friday');
console.log(meta.title); // "His Girl Friday"

// Thumbnail URL (no fetch needed — just the URL)
const thumb = client.getThumbnailUrl('his_girl_friday');
// → "https://archive.org/services/img/his_girl_friday"

// Details page URL
const url = client.getDetailsUrl('his_girl_friday');
// → "https://archive.org/details/his_girl_friday"

// Bulk scrape with cursor pagination
let cursor: string | undefined;
do {
  const batch = await client.scrapeMovies({
    query: 'collection:feature_films mediatype:movies',
    fields: ['identifier', 'title', 'year'],
    count: 100,
    cursor,
  });
  for (const item of batch.items) {
    console.log(item.identifier, item.title);
  }
  cursor = batch.cursor;
} while (cursor);
```

## Notable Sub-collections

| Collection ID            | Description                        |
|--------------------------|------------------------------------|
| `movies`                 | Root Moving Image Archive          |
| `feature_films`          | Feature Films                      |
| `Comedy_Films`           | Comedy Films                       |
| `animationandcartoons`   | Animation & Cartoons               |
| `silent_films`           | Silent Films                       |
| `Film_Noir`              | Film Noir                          |
| `short_films`            | Short Films                        |
| `anime`                  | Anime                              |
| `classic_tv`             | Classic TV                         |
| `tvnews`                 | TV News                            |
| `prelinger`              | Prelinger Archives                 |
| `newsandpublicaffairs`   | News & Public Affairs              |

## Caveats

- The `page_production` endpoint returns a `uid` field in some captured traffic — this is **not required** for public requests and is omitted from client calls.
- The scrape API enforces a minimum `count` of 100; smaller values return a `RangeException` error.
- Thumbnail images at `services/img/{id}` redirect to actual stored files; the final URL varies by server.
- No authentication or cookies are required for any endpoint in this client.
