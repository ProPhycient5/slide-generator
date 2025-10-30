import React from 'react';
import './ThemeSelector.css';

const ThemeSelector = ({ themes, selectedTheme, onChange }) => {
  return (
    <div className="theme-selector-container">
      <label className="theme-label">📋 Select Theme:</label>
      <div className="theme-options">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-option ${selectedTheme === key ? 'selected' : ''}`}
            onClick={() => onChange(key)}
            title={theme.name}
          >
            <div className="theme-preview">
              <div 
                className="gradient-preview" 
                style={{ 
                  background: `linear-gradient(${theme.colors.gradient.angle || 90}deg, #${theme.colors.gradient.start}, #${theme.colors.gradient.end})` 
                }} 
              />
              <div className="color-boxes">
                <div 
                  className="color-swatch gradient-start" 
                  style={{ backgroundColor: `#${theme.colors.gradient.start}` }} 
                  title="Gradient Start Color"
                />
                <div 
                  className="color-swatch gradient-end" 
                  style={{ backgroundColor: `#${theme.colors.gradient.end}` }} 
                  title="Gradient End Color"
                />
              </div>
            </div>
            <span className="theme-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;