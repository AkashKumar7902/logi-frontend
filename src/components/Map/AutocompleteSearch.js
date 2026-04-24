import React, { useState } from "react";
import Autosuggest from "react-autosuggest";
import axios from "axios";
import PropTypes from "prop-types";
import { FaMapMarkerAlt } from "react-icons/fa";
import { mapboxToken } from "../../config";

const theme = {
  container: "relative",
  input:
    "w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-ink-200 bg-white text-ink-900 placeholder-ink-400 outline-none transition-shadow focus:border-brand-500 focus:shadow-focus dark:bg-ink-800 dark:border-ink-700 dark:text-ink-50 dark:placeholder-ink-500",
  suggestionsContainer:
    "absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-ink-200 rounded-lg shadow-pop overflow-hidden max-h-60 overflow-y-auto dark:bg-ink-800 dark:border-ink-700",
  suggestionsContainerOpen: "",
  suggestionsList: "list-none m-0 p-0",
  suggestion: "px-3 py-2 text-sm text-ink-800 cursor-pointer dark:text-ink-100",
  suggestionHighlighted: "bg-brand-50 text-brand-800 dark:bg-brand-500/20 dark:text-brand-100",
};

const AutocompleteSearch = ({ label, onSelect }) => {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async ({ value: query }) => {
    if (!query || !mapboxToken) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: { access_token: mapboxToken, autocomplete: true, limit: 5 },
        },
      );
      const places = response.data.features.map((feature) => ({
        name: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
      }));
      setSuggestions(places);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const getSuggestionValue = (s) => s.name;

  const renderSuggestion = (s, { isHighlighted }) => (
    <div className="flex items-start gap-2">
      <FaMapMarkerAlt
        className={`mt-0.5 shrink-0 ${
          isHighlighted ? "text-brand-500" : "text-ink-400"
        }`}
      />
      <span className="truncate">{s.name}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
        {label} location
      </label>
      <div className="relative">
        <FaMapMarkerAlt
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm z-10"
        />
        <Autosuggest
          theme={theme}
          suggestions={suggestions}
          onSuggestionsFetchRequested={fetchSuggestions}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          onSuggestionSelected={(_, { suggestion }) =>
            onSelect({
              name: suggestion.name,
              latitude: suggestion.latitude,
              longitude: suggestion.longitude,
            })
          }
          inputProps={{
            placeholder: `Search for ${label.toLowerCase()} location`,
            value,
            onChange: (_, { newValue }) => setValue(newValue),
          }}
        />
      </div>
    </div>
  );
};

AutocompleteSearch.propTypes = {
  label: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default AutocompleteSearch;
