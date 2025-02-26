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

module.exports = {
  getTracks,
  getPlaylists,
  createPlaylist,
  createDefaultPlaylist,
};