import React from 'react';
import PreviewCard from './PreviewCard';
import './SlidePreview.css';

const SlidePreview = ({ data, theme }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="preview-section">
      <h3>Preview Slides</h3>
      <div className="preview-grid">
        {data.slice(0, 3).map((row, idx) => (
          <PreviewCard key={idx} data={row} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export default SlidePreview;