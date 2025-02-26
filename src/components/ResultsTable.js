const React = require('react');
const { useState, useEffect, Fragment } = React;
const eventBus = require('../eventBus');
const database = require('../database.cjs');
const AddToPlaylistDialog = require('./AddToPlaylistDialog');

function ResultsTable() {
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false);
  const [isAddAlbumToPlaylistDialogOpen, setIsAddAlbumToPlaylistDialogOpen] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState(null);
  const [albumToAdd, setAlbumToAdd] = useState(null);
  const resultsPerPage = 20; // Number of results per page

  useEffect(() => {
    eventBus.on('search', handleSearch);
    eventBus.on('playlistSelected', handlePlaylistSelected);
    eventBus.on('playlistCreated', loadPlaylists);
    eventBus.on('playlistDeleted', loadPlaylists);

    // Load playlists on mount
    loadPlaylists();

    return () => {
      eventBus.off('search', handleSearch);
      eventBus.off('clearResults', handleClearResults);
      eventBus.off('playlistSelected', handlePlaylistSelected);
      eventBus.off('playlistCreated', loadPlaylists);
      eventBus.off('playlistDeleted', loadPlaylists);
    };
  }, []);

  const loadPlaylists = async () => {
    try {
      const playlistsData = await database.getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleClearResults = () => { // New handler for clearResults event
    console.log('ResultsTable received clearResults event'); // Added log
    console.log('ResultsTable before setResults([])', results); // Log before setResults
    setResults([]); // Clear the results state
    setCurrentPage(1); // Reset to first page
    setTotalPages(0); // Reset total pages
    setTotalResults(0); // Reset total results
    console.log('ResultsTable after setResults([])', results); // Log after setResults
    setTimeout(() => { // Use setTimeout to set to empty array in next render cycle
      setResults([]); // Then set results to empty array
    }, 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchPage(newPage);
    }
  };

  const fetchPage = async (page) => {
    // Get the last search parameters from the results state or elsewhere
    const lastSearchParams = results.length > 0 ? results[0].lastSearchParams : null;
    if (lastSearchParams) {
      // Check if this is a playlist or a search
      if (lastSearchParams.playlistName) {
        // This is a playlist - fetch all tracks and paginate in memory
        const playlistTracks = await database.getPlaylistTracks(lastSearchParams.playlistName);
        
        if (playlistTracks.length > 0) {
          const totalResults = playlistTracks.length;
          const totalPages = Math.ceil(totalResults / resultsPerPage);
          
          // Get tracks for the requested page
          const startIndex = (page - 1) * resultsPerPage;
          const endIndex = Math.min(startIndex + resultsPerPage, totalResults);
          const pageTracks = playlistTracks.slice(startIndex, endIndex);
          
          // Add lastSearchParams to each track for pagination
          const tracksWithParams = pageTracks.map(track => ({
            ...track,
            lastSearchParams: { playlistName: lastSearchParams.playlistName }
          }));
          
          setResults(tracksWithParams);
          setTotalResults(totalResults);
          setTotalPages(totalPages);
          setCurrentPage(page);
        }
      } else {
        // This is a search - use the database pagination
        const { searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm } = lastSearchParams;
        const searchResults = await database.getTracks(searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm, page, resultsPerPage);
        setResults(searchResults.results);
        setTotalPages(searchResults.totalPages);
        setTotalResults(searchResults.totalResults);
        setCurrentPage(page);
      }
    }
  };

  const handlePlaylistSelected = async (playlistName) => {
    console.log('Playlist selected:', playlistName);
    try {
      // Clear existing results
      setResults([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalResults(0);
      
      // Fetch tracks for the selected playlist
      const playlistTracks = await database.getPlaylistTracks(playlistName);
      console.log('Playlist tracks:', playlistTracks);
      
      if (playlistTracks.length > 0) {
        // Apply pagination to playlist tracks
        const totalResults = playlistTracks.length;
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        
        // Get tracks for the first page
        const startIndex = 0;
        const endIndex = Math.min(resultsPerPage, totalResults);
        const firstPageTracks = playlistTracks.slice(startIndex, endIndex);
        
        // Add lastSearchParams to each track for pagination
        const tracksWithParams = firstPageTracks.map(track => ({
          ...track,
          lastSearchParams: { playlistName }
        }));
        
        setResults(tracksWithParams);
        setTotalResults(totalResults);
        setTotalPages(totalPages);
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  const handleAddTrackToPlaylist = (track) => {
    setTrackToAdd(track);
    setIsAddToPlaylistDialogOpen(true);
  };
  
  const handleAddAlbumToPlaylist = (track) => {
    // Extract album prefix from track ID
    const albumPrefix = track.id.split('_')[0];
    if (!albumPrefix) {
      alert('Could not determine album from track ID');
      return;
    }
    
    setAlbumToAdd({
      track,
      albumPrefix
    });
    setIsAddAlbumToPlaylistDialogOpen(true);
  };
  
  const handleAddToPlaylistDialogSave = async (selection) => {
    if (!trackToAdd) return;
    
    try {
      let playlistId;
      let playlistName;
      
      if (selection.createNew) {
        // Create new playlist
        const newPlaylist = await database.createPlaylist(selection.name);
        playlistId = newPlaylist.id;
        playlistName = newPlaylist.name;
        
        // Emit event to update playlists in sidebar
        eventBus.emit('playlistCreated', newPlaylist);
      } else {
        // Use existing playlist
        playlistId = selection.playlistId;
        playlistName = selection.name;
      }
      
      // Add track to playlist
      await database.addTrackToPlaylist(playlistId, trackToAdd.id, trackToAdd);
      
      console.log('Track added to playlist:', trackToAdd.id, 'to playlist:', playlistId);
      alert(`Track "${trackToAdd.title}" added to playlist "${playlistName}"`);
      
      // Reset state and return focus to the main window
      setTrackToAdd(null);
      document.getElementById('root').focus();
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      alert('Error adding track to playlist');
    }
  };
  
  const handleAddAlbumToPlaylistDialogSave = async (selection) => {
    if (!albumToAdd) return;
    
    try {
      let playlistId;
      let playlistName;
      
      if (selection.createNew) {
        // Create new playlist
        const newPlaylist = await database.createPlaylist(selection.name);
        playlistId = newPlaylist.id;
        playlistName = newPlaylist.name;
        
        // Emit event to update playlists in sidebar
        eventBus.emit('playlistCreated', newPlaylist);
      } else {
        // Use existing playlist
        playlistId = selection.playlistId;
        playlistName = selection.name;
      }
      
      // Get all tracks for this album - set limit to 1000 to ensure we get all tracks
      const searchResults = await database.getTracks('', 'All Tracks', 'id', albumToAdd.albumPrefix, 1, 1000);
      
      // Add all tracks to playlist
      const result = await database.addAlbumToPlaylist(playlistId, albumToAdd.albumPrefix, searchResults.results);
      
      console.log('Album added to playlist:', result);
      alert(`Album "${albumToAdd.albumPrefix}" added to playlist "${playlistName}" (${result.count} tracks)`);
      
      // Reset state and return focus to the main window
      setAlbumToAdd(null);
      document.getElementById('root').focus();
    } catch (error) {
      console.error('Error adding album to playlist:', error);
      alert('Error adding album to playlist');
    }
  };

  const handleSearch = async (data) => {
    console.log('Search Term:', data.searchTerm);
    console.log('Filter:', data.filter);
    console.log('ResultsTable received filter:', data.filter); // Added log
    console.log('Dropdown Column:', data.dropdownFilterColumn); // Added log
    console.log('Dropdown Search Term:', data.dropdownSearchTerm); // Added log
    setCurrentPage(1); // Reset to first page on new search
    const searchResults = await database.getTracks(data.searchTerm, data.filter, data.dropdownFilterColumn, data.dropdownSearchTerm, 1, resultsPerPage); // Pass pagination params
    setResults(searchResults.results);
    setTotalPages(searchResults.totalPages);
    setTotalResults(searchResults.totalResults);
  };

  return (
    React.createElement(Fragment, null,
      React.createElement('h2', null, 'Search Results'),
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'Title'),
            React.createElement('th', null, 'Description'),
            React.createElement('th', null, 'Actions') // New column for playlist actions
          )
        ),
        React.createElement('tbody', null,
          results.map(result => (
            React.createElement('tr', { key: result.id },
              React.createElement('td', null, result.id),
              React.createElement('td', null, result.title),
              React.createElement('td', null, result.description),
              React.createElement('td', null,
                React.createElement('div', { className: 'row-actions' },
                  React.createElement('button', {
                    onClick: () => handleAddTrackToPlaylist(result),
                    className: 'small-button'
                  }, 'Add to Playlist'),
                  React.createElement('button', {
                    onClick: () => handleAddAlbumToPlaylist(result),
                    className: 'small-button'
                  }, 'Add Album to Playlist')
                )
              )
            )
          ))
        )
      ),
      // Pagination controls - only show when there are results
      results.length > 0 && React.createElement('div', { className: 'pagination-controls' },
        React.createElement('div', { className: 'pagination-info' },
          `Showing page ${currentPage} of ${totalPages} (${totalResults} total results)`
        ),
        React.createElement('div', { className: 'pagination-buttons' },
          React.createElement('button', {
            onClick: () => handlePageChange(1),
            disabled: currentPage === 1
          }, 'First'),
          React.createElement('button', {
            onClick: () => handlePageChange(currentPage - 1),
            disabled: currentPage === 1
          }, 'Previous'),
          React.createElement('button', {
            onClick: () => handlePageChange(currentPage + 1),
            disabled: currentPage === totalPages
          }, 'Next'),
          React.createElement('button', {
            onClick: () => handlePageChange(totalPages),
            disabled: currentPage === totalPages
          }, 'Last')
        )
      ),
      
      // Add to Playlist Dialog
      React.createElement(AddToPlaylistDialog, {
        isOpen: isAddToPlaylistDialogOpen,
        onClose: () => {
          // Close the dialog and reset state
          setIsAddToPlaylistDialogOpen(false);
          setTimeout(() => {
            setTrackToAdd(null);
            // Return focus to the main window
            document.getElementById('root').focus();
          }, 100);
        },
        onSave: handleAddToPlaylistDialogSave,
        playlists: playlists,
        title: trackToAdd ? `Add "${trackToAdd.title}" to Playlist` : 'Add to Playlist'
      }),
      
      // Add Album to Playlist Dialog
      React.createElement(AddToPlaylistDialog, {
        isOpen: isAddAlbumToPlaylistDialogOpen,
        onClose: () => {
          // Close the dialog and reset state
          setIsAddAlbumToPlaylistDialogOpen(false);
          setTimeout(() => {
            setAlbumToAdd(null);
            // Return focus to the main window
            document.getElementById('root').focus();
          }, 100);
        },
        onSave: handleAddAlbumToPlaylistDialogSave,
        playlists: playlists,
        title: albumToAdd ? `Add Album "${albumToAdd.albumPrefix}" to Playlist` : 'Add Album to Playlist'
      })
    )
  );
}

module.exports = ResultsTable;