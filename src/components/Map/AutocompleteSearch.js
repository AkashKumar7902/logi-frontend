// src/components/Map/AutocompleteSearch.js

import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import axios from 'axios';
import PropTypes from 'prop-types';
import './AutocompleteSearch.css'; // Optional: For custom styling

const AutocompleteSearch = ({ label, onSelect }) => {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'sk.eyJ1IjoiYWthc2hrdW1hcjc5MDIiLCJhIjoiY20yZGFiNXYzMWI3dzJqcjI2NzRrcmF5ZyJ9.8d1Ub4RFmIJStFo2XYLlcg';

  const fetchSuggestions = async ({ value }) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json`,
        {
          params: {
            access_token: mapboxToken,
            autocomplete: true,
            limit: 5,
          },
        }
      );

      const places = response.data.features.map((feature) => ({
        name: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
      }));

      setSuggestions(places);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    fetchSuggestions({ value });
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = (suggestion) => suggestion.name;

  const renderSuggestion = (suggestion) => <div>{suggestion.name}</div>;

  const onChangeHandler = (event, { newValue }) => {
    setValue(newValue);
  };

  const onSuggestionSelected = (event, { suggestion }) => {
    onSelect({
      name: suggestion.name,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  };

  const inputProps = {
    placeholder: `Search for ${label} location`,
    value,
    onChange: onChangeHandler,
  };

  return (
    <div className="autocomplete-search">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} Location</label>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
      />
    </div>
  );
};

AutocompleteSearch.propTypes = {
  label: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default AutocompleteSearch;
