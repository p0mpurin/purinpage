/**
 * Internet Archive Movie Collection API Client
 *
 * Covers public endpoints for browsing and searching the Moving Image Archive.
 * No authentication required — all endpoints are publicly accessible.
 *
 * APIs:
 *  - Search (page_production)   https://archive.org/services/search/beta/page_production/
 *  - Advanced Search            https://archive.org/advancedsearch.php
 *  - Scrape (cursor-based)      https://archive.org/services/search/v1/scrape
 *  - Item Metadata              https://archive.org/metadata/{identifier}
 *  - Thumbnail Image URL        https://archive.org/services/img/{identifier}
 *  - Canonical Details URL      https://archive.org/details/{identifier}
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchHitFields {
  identifier: string;
  title?: string;
  description?: string;
  subject?: string[];
  creator?: string[];
  collection?: string[];
  date?: string;
  year?: number;
  type?: string;
  mediatype?: string;
  licenseurl?: string;
  num_favorites?: number;
  num_reviews?: number;
  avg_rating?: number;
  item_size?: number;
  files_count?: number;
  downloads?: number;
  week?: number;
  month?: number;
  addeddate?: string;
  publicdate?: string;
  reviewdate?: string;
  language?: string[];
  indexflag?: string[];
  item_count?: number;
  collection_size?: number;
  collection_files_count?: number;
}

export interface SearchHit {
  index: string;
  service_backend: string;
  hit_type: string;
  fields: SearchHitFields;
  highlight: null | Record<string, string[]>;
  _score: null | number;
}

export interface SearchHits {
  total: number;
  returned: number;
  hits: SearchHit[];
}

export interface CollectionExtraInfo {
  item_size?: number;
  files_count?: number;
  month?: number;
  week?: number;
  downloads?: number;
  num_favorites?: number;
  title_message?: string | null;
  primary_collection?: string | null;
  thumbnail_url?: string;
  has_items_with_searchable_text?: boolean;
  item_count?: number;
  collection_size?: number;
  collection_files_count?: number;
  forum_identifier?: string;
  forum_count?: number;
  review_count?: number;
  contributor_details?: ContributorDetail[];
  public_metadata?: Record<string, unknown>;
  reviews_metadata?: unknown[];
}

export interface ContributorDetail {
  screen_name: string;
  useritem: string;
  is_archivist: boolean;
}

export interface PageProductionResponse {
  version: string;
  response: {
    header: { succeeded: boolean };
    body: {
      collection_titles?: Record<string, string>;
      hits: SearchHits;
      aggregations: unknown[];
      collection_extra_info?: CollectionExtraInfo;
    };
  };
}

export interface AdvancedSearchDoc {
  identifier: string;
  title?: string;
  description?: string;
  subject?: string[];
  creator?: string[];
  year?: number;
  mediatype?: string;
  language?: string[];
  avg_rating?: number;
  downloads?: number;
  date?: string;
}

export interface AdvancedSearchResponse {
  responseHeader: {
    status: number;
    QTime: number;
    params: Record<string, unknown>;
  };
  response: {
    numFound: number;
    start: number;
    docs: AdvancedSearchDoc[];
  };
}

export interface ScrapeItem {
  identifier: string;
  title?: string;
  description?: string;
  year?: number;
  creator?: string;
  mediatype?: string;
}

export interface ScrapeResponse {
  items: ScrapeItem[];
  count: number;
  cursor?: string;
  total?: number;
  error?: string;
}

export interface ItemMetadata {
  identifier: string;
  title?: string;
  mediatype?: string;
  description?: string;
  date?: string;
  year?: string;
  subject?: string;
  creator?: string;
  director?: string;
  runtime?: string;
  color?: string;
  sound?: string;
  type?: string;
  licenseurl?: string;
  collection?: string[];
  publicdate?: string;
  addeddate?: string;
  language?: string;
  avg_rating?: number;
  num_reviews?: number;
  [key: string]: unknown;
}

export interface ItemMetadataResponse {
  result: ItemMetadata;
}

export interface ItemFullMetadata {
  created: number;
  d1: string;
  dir: string;
  files: ItemFile[];
  metadata: ItemMetadata;
  server: string;
  workable_servers?: string[];
}

export interface ItemFile {
  name: string;
  source: string;
  format?: string;
  size?: string;
  mtime?: string;
  md5?: string;
  sha1?: string;
  title?: string;
  creator?: string;
  bitrate?: string;
  length?: string;
  height?: string;
  width?: string;
}

// ---------------------------------------------------------------------------
// Search options
// ---------------------------------------------------------------------------

export interface PageProductionSearchOptions {
  /** Free-text search query */
  userQuery?: string;
  /** Collection to search within (default: "movies") */
  pageTarget?: string;
  /** Results per page (default: 50) */
  hitsPerPage?: number;
  /** 1-based page number */
  page?: number;
  /** Whether to include aggregation counts */
  aggregations?: boolean;
  /** Number of aggregation buckets */
  aggregationsSize?: number;
}

export interface AdvancedSearchOptions {
  /** Lucene query string, e.g. "collection:movies mediatype:movies" */
  query: string;
  /** Fields to return (default set provided) */
  fields?: string[];
  /** Results per page (default: 50) */
  rows?: number;
  /** 1-based page number */
  page?: number;
  /** Sort field, e.g. "downloads desc" */
  sort?: string;
}

export interface ScrapeOptions {
  /** Lucene query string */
  query: string;
  /** Fields to return */
  fields?: string[];
  /** Cursor for pagination (returned in previous response) */
  cursor?: string;
  /** Number of items (minimum 100) */
  count?: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class InternetArchiveClient {
  private readonly baseUrl = "https://archive.org";

  private defaultFields: string[] = [
    "identifier",
    "title",
    "description",
    "creator",
    "subject",
    "year",
    "date",
    "mediatype",
    "collection",
    "avg_rating",
    "num_reviews",
    "num_favorites",
    "downloads",
    "week",
    "month",
    "addeddate",
    "publicdate",
    "licenseurl",
    "language",
  ];

  /**
   * Search movies using the page_production endpoint (same API the website uses).
   * Supports free-text queries and pagination.
   */
  async searchMovies(options: PageProductionSearchOptions = {}): Promise<PageProductionResponse> {
    const {
      userQuery,
      pageTarget = "movies",
      hitsPerPage = 50,
      page = 1,
      aggregations = false,
      aggregationsSize = 10,
    } = options;

    const params = new URLSearchParams({
      page_type: "collection_details",
      page_target: pageTarget,
      hits_per_page: String(hitsPerPage),
      page: String(page),
      aggregations: String(aggregations),
    });

    if (userQuery) {
      params.set("user_query", userQuery);
    }
    if (aggregations) {
      params.set("aggregations_size", String(aggregationsSize));
    }

    const url = `${this.baseUrl}/services/search/beta/page_production/?${params}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArchiveClient/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`page_production search failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<PageProductionResponse>;
  }

  /**
   * Advanced search using the Lucene-style query language.
   * Supports filtering by collection, mediatype, year, etc.
   *
   * @example
   *   await client.advancedSearch({
   *     query: 'collection:movies mediatype:movies year:[1930 TO 1950]',
   *     fields: ['identifier', 'title', 'year', 'creator'],
   *     rows: 20,
   *   })
   */
  async advancedSearch(options: AdvancedSearchOptions): Promise<AdvancedSearchResponse> {
    const {
      query,
      fields = this.defaultFields,
      rows = 50,
      page = 1,
      sort,
    } = options;

    const params = new URLSearchParams({
      q: query,
      rows: String(rows),
      page: String(page),
      output: "json",
    });

    for (const field of fields) {
      params.append("fl[]", field);
    }

    if (sort) {
      params.set("sort[]", sort);
    }

    const url = `${this.baseUrl}/advancedsearch.php?${params}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArchiveClient/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Advanced search failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<AdvancedSearchResponse>;
  }

  /**
   * Cursor-based scrape for bulk retrieval.
   * count must be >= 100.
   */
  async scrapeMovies(options: ScrapeOptions): Promise<ScrapeResponse> {
    const {
      query,
      fields = ["identifier", "title", "year", "creator", "description", "mediatype"],
      cursor,
      count = 100,
    } = options;

    if (count < 100) {
      throw new Error("scrapeMovies: count must be >= 100");
    }

    const params = new URLSearchParams({
      q: query,
      count: String(count),
      fields: fields.join(","),
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const url = `${this.baseUrl}/services/search/v1/scrape?${params}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArchiveClient/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<ScrapeResponse>;
  }

  /**
   * Retrieve full metadata for a single archive item.
   * Returns files list, server info, and all metadata fields.
   */
  async getItemMetadata(identifier: string): Promise<ItemFullMetadata> {
    const url = `${this.baseUrl}/metadata/${encodeURIComponent(identifier)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArchiveClient/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Metadata fetch failed for "${identifier}": ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<ItemFullMetadata>;
  }

  /**
   * Retrieve only the metadata fields (not files) for a single archive item.
   * Faster than getItemMetadata when you don't need the file list.
   */
  async getItemMetadataOnly(identifier: string): Promise<ItemMetadata> {
    const url = `${this.baseUrl}/metadata/${encodeURIComponent(identifier)}/metadata`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArchiveClient/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Metadata fetch failed for "${identifier}": ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ItemMetadataResponse;
    return data.result;
  }

  /**
   * Returns the thumbnail image URL for an item (does not fetch it).
   * The URL resolves to a JPEG/GIF image.
   */
  getThumbnailUrl(identifier: string): string {
    return `${this.baseUrl}/services/img/${encodeURIComponent(identifier)}`;
  }

  /**
   * Returns the canonical archive.org details page URL for an item.
   */
  getDetailsUrl(identifier: string): string {
    return `${this.baseUrl}/details/${encodeURIComponent(identifier)}`;
  }

  /**
   * Convenience: search for movies by title keyword within the movies collection.
   */
  async searchByTitle(
    titleQuery: string,
    page = 1,
    hitsPerPage = 20
  ): Promise<PageProductionResponse> {
    return this.searchMovies({
      userQuery: titleQuery,
      pageTarget: "movies",
      hitsPerPage,
      page,
    });
  }

  /**
   * Convenience: list movies from a specific sub-collection within the movies archive.
   * e.g. "feature_films", "Comedy_Films", "animationandcartoons"
   */
  async listCollectionMovies(
    collectionId: string,
    page = 1,
    hitsPerPage = 50
  ): Promise<PageProductionResponse> {
    return this.searchMovies({
      pageTarget: collectionId,
      hitsPerPage,
      page,
    });
  }

  /**
   * Convenience: search movies by year range.
   * Uses the page_production endpoint which correctly indexes the year field.
   */
  async searchByYearRange(
    fromYear: number,
    toYear: number,
    page = 1,
    hitsPerPage = 20
  ): Promise<PageProductionResponse> {
    return this.searchMovies({
      userQuery: `year:[${fromYear} TO ${toYear}]`,
      pageTarget: "movies",
      hitsPerPage,
      page,
    });
  }

  /**
   * Convenience: list all public domain movies (movies with a licenseurl containing publicdomain).
   */
  async listPublicDomainMovies(page = 1, rows = 20): Promise<AdvancedSearchResponse> {
    return this.advancedSearch({
      query: `collection:feature_films mediatype:movies`,
      fields: ["identifier", "title", "year", "creator", "description", "avg_rating", "downloads"],
      rows,
      page,
      sort: "downloads desc",
    });
  }
}

// ---------------------------------------------------------------------------
// Main — example usage
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const client = new InternetArchiveClient();

  console.log("=== Internet Archive Movie Collection API Client ===\n");

  // 1. Search for Chaplin movies (uses page_production endpoint)
  console.log("1. Searching for 'chaplin' movies...");
  const searchResults = await client.searchByTitle("chaplin", 1, 5);
  const hits = searchResults.response.body.hits;
  console.log(`   Total matches: ${hits.total}`);
  console.log("   First 5 results:");
  for (const hit of hits.hits) {
    const f = hit.fields;
    console.log(`     - [${f.identifier}] ${f.title ?? "(no title)"} (${f.year ?? "?"}) mediatype=${f.mediatype}`);
    console.log(`       Thumbnail: ${client.getThumbnailUrl(f.identifier)}`);
    console.log(`       Details:   ${client.getDetailsUrl(f.identifier)}`);
  }

  console.log();

  // 2. Year range search — movies from 1930-1950
  console.log("2. Year range search — movies from 1930-1950...");
  const advResults = await client.searchByYearRange(1930, 1950, 1, 5);
  const rangeHits = advResults.response.body.hits;
  console.log(`   Total matches: ${rangeHits.total}`);
  for (const hit of rangeHits.hits) {
    const f = hit.fields;
    console.log(`     - [${f.identifier}] ${f.title ?? "(no title)"} (${f.year ?? "?"})`);
  }

  console.log();

  // 3. Get item metadata for a specific classic film
  console.log("3. Fetching metadata for 'his_girl_friday'...");
  const meta = await client.getItemMetadataOnly("his_girl_friday");
  console.log(`   Title:       ${meta.title}`);
  console.log(`   Year:        ${meta.year}`);
  console.log(`   Director:    ${meta.director ?? "N/A"}`);
  console.log(`   Runtime:     ${meta.runtime ?? "N/A"}`);
  console.log(`   Description: ${String(meta.description ?? "").substring(0, 100)}...`);
  console.log(`   Thumbnail:   ${client.getThumbnailUrl("his_girl_friday")}`);
  console.log(`   Details URL: ${client.getDetailsUrl("his_girl_friday")}`);

  console.log();

  // 4. Scrape API — cursor-based bulk fetch
  console.log("4. Scrape API — bulk fetch of feature_films collection...");
  const scrapeResult = await client.scrapeMovies({
    query: "collection:feature_films mediatype:movies",
    fields: ["identifier", "title", "year", "creator"],
    count: 100,
  });
  console.log(`   Total items in collection: ${scrapeResult.total ?? "unknown"}`);
  console.log(`   Fetched this batch:        ${scrapeResult.count}`);
  console.log(`   Next cursor:               ${scrapeResult.cursor ? scrapeResult.cursor.substring(0, 40) + "..." : "none"}`);
  console.log("   First 3 items:");
  for (const item of scrapeResult.items.slice(0, 3)) {
    console.log(`     - [${item.identifier}] ${item.title ?? "(no title)"} (${item.year ?? "?"})`);
  }

  console.log("\n=== All checks passed ✓ ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
