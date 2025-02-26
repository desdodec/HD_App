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

    return () => {
      eventBus.off('search', handleSearch);
      eventBus.off('clearResults', handleClearResults); // Remove clearResults listener on unmount
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
            React.createElement('th', null, 'Description')
          )
        ),
        React.createElement('tbody', null,
          results.map(result => (
            React.createElement('tr', { key: result.id },
              React.createElement('td', null, result.id),
              React.createElement('td', null, result.title),
              React.createElement('td', null, result.description)
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