# Music Track Database Search Functionality Documentation

This document details the SQL queries used for searching music tracks in the desktop music application. The database is SQLite, named `roo-sqlite.db`, located in the `data/db` folder.

## Database Schema

*   **tracks Table:** Contains the main track metadata.
    *   `id` (TEXT, PRIMARY KEY)
    *   `title` (TEXT)
    *   `composer` (TEXT)
    *   `version` (TEXT)
    *   `keywords` (TEXT)
    *   `cdtitle` (TEXT)
    *   `description` (TEXT)
    *   `library` (TEXT)
    *   `released_at` (DATE)
    *   `vocal` (INTEGER) - 0 or 1
    *   `solo` (INTEGER) - 0 or 1
    *   `duration` (INTEGER) - Duration in seconds
    *   `filename` (TEXT)
*   **tracks_fts FTS Table:** An FTS (Full Text Search) table based on the tracks table, optimized for performing AND-based, case-insensitive searches.

## Search Scenarios and SQL Queries

### 1. Main Search Box

The user enters multiple terms (e.g., 'happy funk'). The following SQL query is used to search the `tracks_fts` table:

```sql
SELECT t.*
FROM tracks_fts f
JOIN tracks t ON f.rowid = t.id
WHERE tracks_fts MATCH 'happy funk'
ORDER BY bm25(tracks_fts) DESC
LIMIT 20;
```

This query performs a full-text search using the `tracks_fts MATCH` syntax. The `bm25` function is used to rank the results based on relevance.

### 2. Global Filter Buttons (Vocal/Instrumental)

The global filter buttons (vocal = 0 or vocal = 1) modify the main search query.

*   **Vocal Filter Enabled (vocal = 1):**

    ```sql
    SELECT t.*
    FROM tracks_fts f
    JOIN tracks t ON f.rowid = t.id
    WHERE tracks_fts MATCH 'happy funk' AND t.vocal = 1
    ORDER BY bm25(tracks_fts) DESC
    LIMIT 20;
    ```

*   **Instrumental Filter Enabled (vocal = 0):**

    ```sql
    SELECT t.*
    FROM tracks_fts f
    JOIN tracks t ON f.rowid = t.id
    WHERE tracks_fts MATCH 'happy funk' AND t.vocal = 0
    ORDER BY bm25(tracks_fts) DESC
    LIMIT 20;
    ```

*   **Only Global Filter is used (vocal = 1):**

    ```sql
    SELECT *
    FROM tracks
    WHERE vocal = 1
    ORDER BY id ASC
    LIMIT 20;
    ```

### 3. Dropdown Filter (e.g., Title Contains)

The dropdown filter (e.g., `t.title LIKE '%vinyl scratch%'`) can be used independently or in conjunction with the main search.

*   **Dropdown Filter Used Independently (Title Contains 'vinyl scratch'):**

    ```sql
    SELECT *
    FROM tracks
    WHERE title LIKE '%vinyl scratch%'
    ORDER BY id ASC
    LIMIT 20;
    ```

*   **Dropdown Filter Used with Main Search (Title Contains 'vinyl scratch' and Main Search is 'rock'):**

    ```sql
    SELECT t.*
    FROM tracks_fts f
    JOIN tracks t ON f.rowid = t.id
    WHERE tracks_fts MATCH 'rock' AND t.title LIKE '%vinyl scratch%'
    ORDER BY bm25(tracks_fts) DESC
    LIMIT 20;
    ```

### 4. Combined Search

This example demonstrates the combination of the main search box, global filter buttons, and the dropdown filter. Searching for 'rock' with the 'vocal' filter enabled and the 'library' dropdown filter set to 'CPM'.

```sql
SELECT t.*
FROM tracks_fts f
JOIN tracks t ON f.rowid = t.id
WHERE tracks_fts MATCH 'rock' AND t.vocal = 1 AND t.library = 'CPM'
ORDER BY bm25(tracks_fts) DESC
LIMIT 20;
```

This query combines the following conditions:

*   `tracks_fts MATCH 'rock'`: Searches for tracks where the title, composer, version, keywords, or description contains 'rock'.
*   `t.vocal = 1`: Filters for tracks with vocals.
*   `t.library = 'CPM'`: Filters for tracks from the 'CPM' library.

The results are ordered by `bm25(tracks_fts)` in descending order and limited to 20 records.