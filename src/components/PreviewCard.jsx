import React from 'react';
import { THEMES } from '../themes';
import './PreviewCard.css';

const PreviewCard = ({ data, theme: themeName }) => {
  const keys = Object.keys(data || {});
  const titleField = keys.find(k => /title/i.test(k)) || keys[0];
  const titleText = titleField ? String(data[titleField] ?? 'Untitled Slide') : 'Untitled Slide';
  
  const theme = THEMES[themeName] || THEMES[Object.keys(THEMES)[0]];
  const gradient = theme.colors && theme.colors.gradient ? theme.colors.gradient : { start: 'FFFFFF', end: 'FFFFFF', angle: 90, opacity: 1 };
  const gradientStyle = {
    background: `linear-gradient(${gradient.angle || 315}deg, #${gradient.start} 0%, #${gradient.end} 100%)`,
    opacity: gradient.opacity || 1
  };
  
  // Get 2-3 bullet points from remaining fields
  const bulletPoints = keys
    .filter(k => k !== titleField)
    .slice(0, 3)
    .map(k => `${k}: ${data[k] ?? ''}`);

  return (
    <div className={`preview-card ${themeName}`} style={gradientStyle}>
      <h4 className="preview-title" style={{ color: `#${theme.colors.title}` }}>{titleText}</h4>
      <ul className="preview-bullets">
        {bulletPoints.map((point, idx) => (
          <li key={idx} style={{ color: `#${theme.colors.text}` }}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

export default PreviewCard;