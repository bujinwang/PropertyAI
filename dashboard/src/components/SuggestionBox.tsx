import React, { useState, useEffect } from 'react';

interface Suggestion {
  id: string;
  suggested_response: string;
}

interface SuggestionBoxProps {
  query: string;
  onSelect: (suggestion: string) => void;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ query, onSelect }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 2) {
        try {
          const response = await fetch(`/api/suggestions?query=${query}`);
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} onClick={() => onSelect(suggestion.suggested_response)}>
          {suggestion.suggested_response}
        </div>
      ))}
    </div>
  );
};

export default SuggestionBox;
