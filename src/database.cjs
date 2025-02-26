const db = require('../db.cjs');

const getTracks = async (searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm, page = 1, limit = 20) => {
  console.log('getTracks called with: searchTerm:', searchTerm, 'filter:', filter, 'dropdownFilterColumn:', dropdownFilterColumn, 'dropdownSearchTerm:', dropdownSearchTerm, 'page:', page, 'limit:', limit); // Added log
  return new Promise((resolve, reject) => {
    let baseQuery = `SELECT t.*,
                       bm25(tracks_fts, 1.0, 0.5, 0.5) AS rank
                FROM tracks_fts
                JOIN tracks t ON t.rowid = tracks_fts.rowid`;
    let countQuery = `SELECT COUNT(*) as total
                FROM tracks_fts
                JOIN tracks t ON t.rowid = tracks_fts.rowid`;
    let params = [];
    let whereClauses = [];

    if (searchTerm) {
      whereClauses.push(`tracks_fts MATCH ?`);
      params.push(`${searchTerm}`);
    }

    if (filter === 'Vocal') {
      whereClauses.push(`t.vocal = 1`);
    } else if (filter === 'Instrumental') {
      whereClauses.push(`t.vocal = 0`);
    } else if (filter === 'Solo') {
      whereClauses.push(`t.solo = 1`);
    }

    if (dropdownFilterColumn && dropdownSearchTerm) {
      whereClauses.push(`LOWER(t.${dropdownFilterColumn}) LIKE LOWER('%${dropdownSearchTerm}%')`);
    }

    let whereClause = '';
    if (whereClauses.length > 0) {
      whereClause = ' WHERE ' + whereClauses.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` ORDER BY rank DESC
               LIMIT ${limit} OFFSET ${offset}`;

    console.log('SQL Query:', baseQuery);
    console.log('SQL Params:', params);

    // First get the total count
    db.get(countQuery, params, (err, countRow) => {
      if (err) {
        console.error('Error counting tracks', err);
        reject(err);
        return;
      }

      const totalResults = countRow.total;
      const totalPages = Math.ceil(totalResults / limit);

      // Then get the results for the current page
      db.all(baseQuery, params, (err, rows) => {
        if (err) {
          console.error('Error fetching tracks', err);
          reject(err);
        } else {
          // Add the search parameters to each result for use in pagination
          const resultsWithParams = rows.map(row => ({
            ...row,
            lastSearchParams: { searchTerm, filter, dropdownFilterColumn, dropdownSearchTerm }
          }));

          resolve({
            results: resultsWithParams,
            totalResults,
            totalPages,
            currentPage: page
          });
        }
      });
    });
  });
};

const getPlaylists = async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM playlists ORDER BY created_at ASC', (err, rows) => {
      if (err) {
        console.error('Error fetching playlists', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const createPlaylist = async (name) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO playlists (created_at, name) VALUES (DATETIME("now"), ?)', [name], function(err) {
      if (err) {
        console.error('Error creating playlist', err);
        reject(err);
      } else {
        db.get('SELECT * FROM playlists WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching new playlist', err);
            reject(err);
          } else {
            resolve(row);
          }
        });
      }
    });
  });
};

const createDefaultPlaylist = async () => {
  try {
    const playlists = await getPlaylists();
    if (playlists.length === 0) {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO playlists (created_at, name) VALUES (DATETIME("now"), ?)', ['Default Playlist'], function(err) {
          if (err) {
            console.error('Error creating default playlist', err);
          } else {
            db.get('SELECT * FROM playlists WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                console.error('Error fetching new playlist', err);
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        });
      });
    }
    return null;
  } catch (err) {
    console.error('Error creating default playlist', err);
    throw err;
  }
};

const deletePlaylist = async (playlistId) => {
  return new Promise((resolve, reject) => {
    // First, delete associated tracks from playlist_tracks
    db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlistId], (err) => {
      if (err) {
        console.error('Error deleting playlist tracks', err);
        reject(err);
        return;
      }
      
      // Then, delete the playlist itself
      db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err) {
        if (err) {
          console.error('Error deleting playlist', err);
          reject(err);
        } else {
          resolve({ id: playlistId, changes: this.changes });
        }
      });
    });
  });
};

const getPlaylistTracks = async (playlistName) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT t.*, p.name as playlist_name
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      JOIN playlists p ON pt.playlist_id = p.id
      WHERE p.name = ?
      ORDER BY pt.ordering ASC
    `;
    
    db.all(query, [playlistName], (err, rows) => {
      if (err) {
        console.error('Error fetching playlist tracks', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const addTrackToPlaylist = async (playlistId, trackId, trackData) => {
  return new Promise((resolve, reject) => {
    // Get the highest ordering value for this playlist
    db.get('SELECT MAX(ordering) as maxOrder FROM playlist_tracks WHERE playlist_id = ?', [playlistId], (err, row) => {
      if (err) {
        console.error('Error getting max ordering', err);
        reject(err);
        return;
      }
      
      const nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 0;
      
      // Insert the track into the playlist
      const { title, duration, library, cd_title, filename } = trackData || {};
      db.run(
        'INSERT INTO playlist_tracks (playlist_id, track_id, duration, title, library, cd_title, filename, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [playlistId, trackId, duration || 0, title || '', library || '', cd_title || '', filename || '', nextOrder],
        function(err) {
          if (err) {
            console.error('Error adding track to playlist', err);
            reject(err);
          } else {
            resolve({ id: this.lastID, playlistId, trackId, ordering: nextOrder });
          }
        }
      );
    });
  });
};

const addAlbumToPlaylist = async (playlistId, albumPrefix, tracks) => {
  return new Promise((resolve, reject) => {
    // Start a transaction
    db.run('BEGIN TRANSACTION', async (err) => {
      if (err) {
        console.error('Error beginning transaction', err);
        reject(err);
        return;
      }
      
      try {
        // Get all tracks with IDs matching the album prefix
        const albumTracks = tracks.filter(track => track.id.startsWith(albumPrefix));
        
        // Get the highest ordering value for this playlist
        const row = await new Promise((resolve, reject) => {
          db.get('SELECT MAX(ordering) as maxOrder FROM playlist_tracks WHERE playlist_id = ?', [playlistId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        let nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 0;
        
        // Add each track to the playlist
        for (const track of albumTracks) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO playlist_tracks (playlist_id, track_id, duration, title, library, cd_title, filename, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [playlistId, track.id, track.duration || 0, track.title || '', track.library || '', track.cd_title || '', track.filename || '', nextOrder++],
              function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
              }
            );
          });
        }
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction', err);
            reject(err);
          } else {
            resolve({ success: true, count: albumTracks.length });
          }
        });
      } catch (error) {
        // Rollback the transaction on error
        db.run('ROLLBACK', () => {
          console.error('Transaction rolled back due to error', error);
          reject(error);
        });
      }
    });
  });
};

module.exports = {
  getTracks,
  getPlaylists,
  createPlaylist,
  createDefaultPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  addAlbumToPlaylist,
};