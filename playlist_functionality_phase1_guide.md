# Playlist Functionality Implementation Guide - Phase 1: Playlist Sidebar Initialization

## 1. Data Model and Database Functions (`database.cjs`):

*   **`getPlaylists()`:** 
    *   Fetch all playlists from the `playlists` table, ordered by `created_at`.
    *   Return an array of playlist objects, each containing `id`, `name`, and `created_at`.
*   **`createPlaylist(name)`:**
    *   Insert a new playlist into the `playlists` table with the given `name` and current timestamp for `created_at`.
    *   Return the newly created playlist object (including the generated `id`).
*   **`deletePlaylist(playlistId)`:**
    *   Delete a playlist from the `playlists` table based on `playlistId`.
    *   Also, delete associated entries in `playlist_tracks` table for the deleted playlist to maintain data integrity.
*   **`getPlaylistTracks(playlistName)`:**
    *   Fetch tracks associated with a specific playlist `playlistName`.
    *   Use the provided SQL query to join `tracks_fts`, `playlist_tracks`, and `playlists` tables.
    *   Return an array of track objects for the playlist.

## 2. Event Handling (`eventBus.js`):**

*   Define events for playlist actions:
    *   `'playlistsLoaded'`: Emitted after playlists are loaded from the database.
    *   `'playlistCreated'`: Emitted after a new playlist is created.
    *   `'playlistDeleted'`: Emitted after a playlist is deleted.
    *   `'playlistSelected'`: Emitted when a playlist is selected in the sidebar, passing the `playlistName` as data.

## 3. Playlist Sidebar Component (`PlaylistSidebar.js`):**

*   **Load Playlists on Startup:**
    *   In `useEffect` hook, call `database.getPlaylists()` to fetch playlists on component mount.
    *   Emit `'playlistsLoaded'` event with the fetched playlists data using `eventBus.emit`.
*   **Display Playlist Buttons:**
    *   Map over the loaded playlists and dynamically create buttons in the sidebar for each playlist.
    *   Each button should display the `playlist.name`.
    *   Attach `playlist.name` as a data attribute (e.g., `data-playlist-name`) to each button.
*   **"Create Playlist" Button and Modal Dialog:**
    *   Add a "Create Playlist" button in the sidebar.
    *   When clicked, open a modal dialog with:
        *   Input field for playlist name.
        *   "Create" and "Cancel" buttons.
    *   On "Create" button click:
        *   Call `database.createPlaylist(playlistName)` to create a new playlist.
        *   Emit `'playlistCreated'` event with the new playlist data.
        *   Close the modal dialog.
    *   On "Cancel" button click:
        *   Close the modal dialog.
*   **"Delete Playlist" Button (per playlist button):**
    *   Add a "Delete" button next to each playlist button in the sidebar.
    *   When clicked:
        *   Open a confirmation dialog ("Are you sure you want to delete playlist [playlistName]?").
        *   If confirmed:
            *   Get the `playlistId` from the data attribute of the clicked playlist button.
            *   Call `database.deletePlaylist(playlistId)` to delete the playlist.
            *   Emit `'playlistDeleted'` event with the deleted `playlistId`.
*   **Playlist Selection:**
    *   When a playlist button is clicked:
        *   Get the `playlistName` from the data attribute of the clicked button.
        *   Emit `'playlistSelected'` event with the `playlistName` using `eventBus.emit`.

## 4. Results Table Component (`ResultsTable.js`):**

*   **Handle `'playlistSelected'` Event:**
    *   In `useEffect` hook, listen for the `'playlistSelected'` event.
    *   Implement a handler function to:
        *   Clear existing search results (if any).
        *   Call `database.getPlaylistTracks(playlistName)` to fetch tracks for the selected playlist.
        *   Update the `results` state with the fetched playlist tracks.

## 5. Modular Code Structure:**

*   Create a new directory `src/modules/playlist` to encapsulate playlist-related components and logic (if needed for larger scale).
*   Ensure clear separation of concerns between UI components, data access logic, and event handling.
*   Document all new functions and components clearly.

## Questions for Clarification:**

1.  **Modal Dialog for Playlist Creation:** Do you have any specific preferences for the modal dialog library or implementation (e.g., using a simple HTML dialog or a React library)?
2.  **Confirmation Dialog for Playlist Deletion:**  Same as above, any preference for the confirmation dialog?
3.  **Playlist Sorting and Filtering in Sidebar (Phase 1):** The prompt mentions "sorting and filtering via a search box" in the sidebar for Phase 1. Is this required for the initial implementation, or can it be added in a later phase? For now, I'll focus on loading, displaying, creating, deleting, and selecting playlists.
4.  **Drag-and-Drop Reordering:** Drag-and-drop reordering is mentioned in the prompt, but it seems to be a more complex feature. Should I include basic drag-and-drop functionality in Phase 1, or focus on the core playlist loading, creation, deletion, and selection first? For now, I'll leave drag-and-drop out of Phase 1 to keep it manageable.