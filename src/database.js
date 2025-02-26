const client = require('../db');

const getTracks = async () => {
  try {
    const result = await client.query('SELECT * FROM tracks_search ORDER BY releasedate DESC, id ASC LIMIT 20');
    return result.rows;
  } catch (err) {
    console.error('Error fetching tracks', err);
    throw err;
  }
};

const getPlaylists = async () => {
  try {
    const result = await client.query('SELECT * FROM playlists ORDER BY created_at ASC');
    return result.rows;
  } catch (err) {
    console.error('Error fetching playlists', err);
    throw err;
  }
};

const createPlaylist = async (name) => {
  try {
    const result = await client.query('INSERT INTO playlists (created_at, name) VALUES (NOW(), $1) RETURNING *', [name]);
    return result.rows[0];
  } catch (err) {
    console.error('Error creating playlist', err);
    throw err;
  }
};

const createDefaultPlaylist = async () => {
  try {
    const playlists = await getPlaylists();
    if (playlists.length === 0) {
      const result = await client.query('INSERT INTO playlists (created_at, name) VALUES (NOW(), $1) RETURNING *', ['Default Playlist']);
      return result.rows[0];
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