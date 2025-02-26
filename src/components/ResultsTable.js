const React = require('react');
const { useState, useEffect, Fragment } = React;
const eventBus = require('../eventBus');
const database = require('../database.cjs');

function ResultsTable() {
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 20; // Number of results per page

  useEffect(() => {
    eventBus.on('search', handleSearch);
    eventBus.on('playlistSelected', handlePlaylistSelected);

    return () => {
      eventBus.off('search', handleSearch);
      eventBus.off('clearResults', handleClearResults); // Remove clearResults listener on unmount
      eventBus.off('playlistSelected', handlePlaylistSelected);
    };
  }, []);

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
      const { searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm } = lastSearchParams;
      const searchResults = await database.getTracks(searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm, page, resultsPerPage);
      setResults(searchResults.results);
      setTotalPages(searchResults.totalPages);
      setTotalResults(searchResults.totalResults);
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
        setResults(playlistTracks);
        setTotalResults(playlistTracks.length);
        setTotalPages(Math.ceil(playlistTracks.length / resultsPerPage));
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  const handleAddTrackToPlaylist = (track) => {
    // Show a dialog to select a playlist or create a new one
    const playlistName = prompt('Enter playlist name to add track to:');
    if (!playlistName) return; // User cancelled
    
    // Check if playlist exists
    database.getPlaylists()
      .then(playlists => {
        const playlist = playlists.find(p => p.name === playlistName);
        
        if (playlist) {
          // Add track to existing playlist
          return database.addTrackToPlaylist(playlist.id, track.id, track);
        } else {
          // Create new playlist and add track
          return database.createPlaylist(playlistName)
            .then(newPlaylist => {
              return database.addTrackToPlaylist(newPlaylist.id, track.id, track);
            });
        }
      })
      .then(result => {
        console.log('Track added to playlist:', result);
        alert(`Track "${track.title}" added to playlist "${playlistName}"`);
      })
      .catch(error => {
        console.error('Error adding track to playlist:', error);
        alert('Error adding track to playlist');
      });
  };
  
  const handleAddAlbumToPlaylist = (track) => {
    // Extract album prefix from track ID
    const albumPrefix = track.id.split('_')[0];
    if (!albumPrefix) {
      alert('Could not determine album from track ID');
      return;
    }
    
    // Show a dialog to select a playlist or create a new one
    const playlistName = prompt(`Enter playlist name to add album "${albumPrefix}" to:`);
    if (!playlistName) return; // User cancelled
    
    // Check if playlist exists
    database.getPlaylists()
      .then(playlists => {
        const playlist = playlists.find(p => p.name === playlistName);
        
        if (playlist) {
          // Get all tracks for this album
          return database.getTracks('', 'All Tracks', 'id', albumPrefix)
            .then(searchResults => {
              // Add all tracks to existing playlist
              return database.addAlbumToPlaylist(playlist.id, albumPrefix, searchResults.results);
            });
        } else {
          // Create new playlist
          return database.createPlaylist(playlistName)
            .then(newPlaylist => {
              // Get all tracks for this album
              return database.getTracks('', 'All Tracks', 'id', albumPrefix)
                .then(searchResults => {
                  // Add all tracks to new playlist
                  return database.addAlbumToPlaylist(newPlaylist.id, albumPrefix, searchResults.results);
                });
            });
        }
      })
      .then(result => {
        console.log('Album added to playlist:', result);
        alert(`Album "${albumPrefix}" added to playlist "${playlistName}" (${result.count} tracks)`);
      })
      .catch(error => {
        console.error('Error adding album to playlist:', error);
        alert('Error adding album to playlist');
      });
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
      )
    )
  );
}

module.exports = ResultsTable;