import React from 'react';
import './DataPreview.css';

const DataPreview = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <h3 style={{marginTop: 24}}>Data Preview</h3>
      <p style={{marginTop:6, color:'#556'}}>{data.length} rows loaded</p>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPreview;