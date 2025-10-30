import React, { useRef, useEffect } from "react";
import "./FileDropZone.css";

export default function FileDropZone({ onFileUpload, resetSignal = 0 }) {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const name = String(file.name || "").toLowerCase();
    if (!(name.endsWith('.xlsx') || name.endsWith('.xls'))) {
      alert('Unsupported file type. Please upload an Excel file (.xls or .xlsx).');
      return;
    }
    onFileUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const name = String(file.name || "").toLowerCase();
    if (!(name.endsWith('.xlsx') || name.endsWith('.xls'))) {
      alert('Unsupported file type. Please drop an Excel file (.xls or .xlsx).');
      return;
    }
    onFileUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Clear the input value when resetSignal changes so selecting the same file again
  // will fire the change event.
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, [resetSignal]);

  return (
    <div
      className="dropzone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <p>📂 Drag & Drop or Click to Upload Excel File</p>
    </div>
  );
}
