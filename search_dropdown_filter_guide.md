# Implementation Guide for Dropdown Filters

## Overview

This guide outlines the implementation of a dropdown filter in the `SearchArea` component. This filter will allow users to search specific columns in the `tracks` table (id, title, composer, cd_title, library, version) in addition to the existing main search box and global filters (Vocal, Instrumental, Solo).

## UI Changes in `SearchArea.js`

1.  **Add Dropdown Select Element:**
    -   Introduce a `<select>` element for column selection with options: "id", "title", "composer", "cd_title", "library", "version".
    -   Add state to manage the selected column (e.g., `dropdownFilterColumn`).

2.  **Add Dropdown Search Input:**
    -   Introduce an `<input type="text">` element for the dropdown filter search term.
    -   Add state to manage the dropdown search term (e.g., `dropdownSearchTerm`).

3.  **Update `handleSearch` Function:**
    -   Read the `dropdownFilterColumn` and `dropdownSearchTerm` values.
    -   Construct the SQL query dynamically based on:
        -   `searchTerm` (from main search box)
        -   `filter` (global filters - Vocal, Instrumental, Solo)
        -   `dropdownFilterColumn` and `dropdownSearchTerm` (dropdown filter)
    -   Emit the 'search' event with all relevant search parameters.

## SQL Query Construction in `database.cjs`

1.  **Modify `getTracks` Function:**
    -   Receive `dropdownFilterColumn` and `dropdownSearchTerm` as parameters in addition to `searchTerm` and `filter`.
    -   Dynamically build the `WHERE` clause of the SQL query:
        -   Start with `WHERE` clause if `searchTerm` or any filter is present.
        -   Add `tracks_fts MATCH ?` condition for `searchTerm` if provided.
        -   Add `AND t.vocal = 1` or `AND t.vocal = 0` or `AND t.solo = 1` conditions based on `filter`.
        -   Add `AND LOWER(t.[dropdownFilterColumn]) LIKE LOWER('%[dropdownSearchTerm]%')` condition if `dropdownFilterColumn` and `dropdownSearchTerm` are provided.
        -   Ensure all `AND` conditions are correctly chained.
        -   Use `LOWER()` function for case-insensitive `LIKE` queries in the dropdown filter.

## SQL Query Examples

**1. Only dropdown input box contains a search term:**

```sql
SELECT t.*,
       bm25(tracks_fts, 1.0, 0.5, 0.5) AS rank
FROM tracks_fts
JOIN tracks t ON t.rowid = tracks_fts.rowid
WHERE LOWER(t.composer) LIKE LOWER('%PIPER%')
ORDER BY rank LIMIT 10;
```

**2. Main input box + a global filter:**

```sql
SELECT t.*,
       bm25(tracks_fts, 1.0, 0.5, 0.5) AS rank
FROM tracks_fts
JOIN tracks t ON t.rowid = tracks_fts.rowid
WHERE tracks_fts MATCH 'rock'
  AND t.vocal = 1
ORDER BY rank LIMIT 10;
```

**3. Main input box and dropdown box and global filter:**

```sql
SELECT t.*,
       bm25(tracks_fts, 1.0, 0.5, 0.5) AS rank
FROM tracks t
JOIN tracks_fts ON tracks_fts.rowid = t.rowid
WHERE tracks_fts MATCH 'rock'
  AND t.vocal = 1
  AND LOWER(t.composer) LIKE LOWER('%Reinwand%')
LIMIT 10;
```

## Testing

-   Test each dropdown filter individually.
-   Test dropdown filters in combination with the main search box.
-   Test dropdown filters in combination with global filters.
-   Test all three search types (main search, global filters, dropdown filters) together.
-   Verify case-insensitive search for dropdown filters.
-   Ensure correct SQL queries are generated and logged for each scenario.

This guide should provide a clear roadmap for implementing the dropdown filter feature.