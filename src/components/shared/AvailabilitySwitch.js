import React from "react";
import PropTypes from "prop-types";
import Toggle from "./Toggle";

const AvailabilitySwitch = ({ isOnline, handleToggle }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            isOnline ? "bg-success-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" : "bg-ink-300 dark:bg-ink-600"
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {isOnline ? "You're online" : "You're offline"}
          </p>
          <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
            {isOnline ? "Receiving booking requests" : "Go online to accept jobs"}
          </p>
        </div>
      </div>
      <Toggle checked={isOnline} onChange={handleToggle} aria-label="Toggle availability" />
    </div>
  );
};

AvailabilitySwitch.propTypes = {
  isOnline: PropTypes.bool.isRequired,
  handleToggle: PropTypes.func.isRequired,
};

export default AvailabilitySwitch;
