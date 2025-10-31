import React from 'react';
import PreviewCard from './PreviewCard';
import './SlidePreview.css';

const SlidePreview = ({ data, theme, bgImage }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="preview-section">
      <h3>Preview Slides</h3>
      <div className="preview-grid">
        {data.slice(0, 3).map((row, idx) => (
          <PreviewCard key={idx} data={row} theme={theme} bgImage={bgImage} />
        ))}
      </div>
    </div>
  );
};

export default SlidePreview;