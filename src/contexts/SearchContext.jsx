import { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    console.log('Performing search for:', query);
    setIsSearching(true);
    setSearchPerformed(true);
    
    try {
      // Import the search service
      const { searchAllCollections } = await import('../services/searchService');
      console.log('Search service imported successfully');
      const results = await searchAllCollections(query);
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const value = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchPerformed,
    performSearch,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 