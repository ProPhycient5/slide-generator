import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import FileDropZone from "./components/FileDropZone";
import ThemeSelector from "./components/ThemeSelector";
import SlidePreview from "./components/SlidePreview";
import DataPreview from "./components/DataPreview";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { generatePPT } from "./services/pptGenerator";
import { THEMES } from "./themes";
import "./App.css";

function App() {
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(() => Object.keys(THEMES)[0] || 'ocean');
  const [bgMode, setBgMode] = useState('gradient'); // 'gradient' | 'upload' | 'url'
  const [bgFile, setBgFile] = useState(null);
  const [bgUrl, setBgUrl] = useState('');
  const [bgDataUrl, setBgDataUrl] = useState(null);
  // Theme selector visibility is derived from bgMode === 'gradient'

  const resetAll = () => {
    setExcelData([]);
    setFileName("");
    setResetSignal((s) => s + 1);
    // clear background selections
    setBgMode('gradient');
    setBgFile(null);
    setBgUrl('');
    setBgDataUrl(null);
    // clear file input if present
    if (bgFileInputRef.current && 'value' in bgFileInputRef.current) {
      bgFileInputRef.current.value = null;
    }
    // reset theme to default
    setSelectedTheme(Object.keys(THEMES)[0] || 'ocean');
  };

  const handleFileUpload = (file) => {
    setFileName(file.name);

    // prefer Blob#arrayBuffer() over FileReader
    file.arrayBuffer().then((buf) => {
      const data = new Uint8Array(buf);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(json);
    }).catch((err) => {
      console.error('Failed to read Excel file as arrayBuffer', err);
      alert('Failed to read Excel file');
    });
  };

  const handleGeneratePPT = async () => {
    if (!excelData.length) {
      alert("No Excel data found!");
      return;
    }

    try {
      console.log("Starting PPT generation...");
      // resolve background preference: if user uploaded/provided an image, use that
      const bgToUse = bgMode === 'gradient' ? null : bgDataUrl;
      // when a custom background is used, switch to a neutral theme for text/colors
      const effectiveThemeKey = bgMode === 'gradient' ? selectedTheme : 'neutral';
      await generatePPT(excelData, THEMES[effectiveThemeKey], fileName, bgToUse);
      console.log("PPTX generation finished");
    } catch (err) {
      console.error("Failed to generate PPTX:", err);
      alert("Failed to generate PowerPoint. Check the browser console for details.");
    }
  };

  // Helpers to convert file or remote image to data URL
  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file as data URL'));
      reader.readAsDataURL(file);
    });
  };

  const fetchImageAsDataUrl = async (url) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const blob = await res.blob();
      return await fileToDataUrl(new File([blob], 'remote-image'));
    } catch (err) {
      console.error('Failed to fetch image as data URL', err);
      throw err;
    }
  };

  // Watch for user selecting a local file or entering URL and convert accordingly
  const handleBgFileChange = async (file) => {
    if (!file) return;
    setBgFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setBgDataUrl(dataUrl);
      setBgMode('upload');
    } catch (err) {
      console.error('Failed to read image file', err);
      alert('Failed to read image file');
    }
  };

  // ref for clearing the native file input when mode changes or on reset
  const bgFileInputRef = useRef(null);

  // When user changes background mode, clear any previously selected/uploaded data
  const handleBgModeChange = (newMode) => {
    // if selecting the same mode, no-op
    if (newMode === bgMode) return;
    setBgMode(newMode);
    // clear prior selections
    setBgFile(null);
    setBgUrl('');
    setBgDataUrl(null);
    // reset native file input value
    if (bgFileInputRef.current && 'value' in bgFileInputRef.current) {
      bgFileInputRef.current.value = null;
    }
    // if switching away from gradient, hide theme selector? keep current showThemeSelector state
    // When an image mode is chosen, theme selector is already conditionally hidden in render (bgMode==='gradient')
  };

  const handleBgUrlApply = async () => {
    if (!bgUrl) return alert('Enter an image URL');
    try {
      const dataUrl = await fetchImageAsDataUrl(bgUrl);
      setBgDataUrl(dataUrl);
      setBgMode('url');
    } catch (err) {
      console.error('Failed to fetch image URL', err);
      alert('Failed to fetch image URL. Check CORS and URL validity.');
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div className="content-card">
          <FileDropZone onFileUpload={handleFileUpload} resetSignal={resetSignal} />

          {fileName && <p className="filename">✅ Uploaded: {fileName}</p>}

          {excelData.length > 0 && (
            <>
              {/* use neutral theme for previews when background image/url is selected; pass bg image if set */}
              <SlidePreview data={excelData} theme={bgMode === 'gradient' ? selectedTheme : 'neutral'} bgImage={bgMode === 'gradient' ? null : bgDataUrl} />
              <DataPreview data={excelData} />

              {/* ThemeSelector is shown when using Theme Gradient background */}
              {bgMode === 'gradient' && (
                <ThemeSelector
                  themes={THEMES}
                  selectedTheme={selectedTheme}
                  onChange={setSelectedTheme}
                />
              )}
              
              <div className="bg-controls">
                <div className="bg-select-row">
                  <label className="bg-label">
                    Background
                    <select id="bg-mode-select" className="bg-select" value={bgMode} onChange={(e) => handleBgModeChange(e.target.value)}>
                      <option value="gradient">Theme Gradient</option>
                      <option value="upload">Upload Image</option>
                      <option value="url">Image URL</option>
                    </select>
                  </label>
                  {bgMode === 'upload' && (
                    <div className="bg-upload">
                      <input ref={bgFileInputRef} className="bg-file-input" type="file" accept="image/*" onChange={(e) => handleBgFileChange(e.target?.files?.[0])} />
                      {bgFile && <span className="bg-filename">{bgFile.name}</span>}
                    </div>
                  )}

                  {bgMode === 'url' && (
                    <div className="bg-url">
                      <input className="bg-url-input" type="text" placeholder="https://..." value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} />
                      <button className="bg-apply-btn" onClick={handleBgUrlApply}>Apply</button>
                    </div>
                  )}
                </div>
              </div>

              {/* background preview is applied directly to the preview cards; no separate thumbnail shown */}

              <div className="buttons-row">
                <button
                  className="btn-generate"
                  onClick={handleGeneratePPT}
                  disabled={!excelData.length}
                  title={excelData.length ? "Generate PPT from uploaded Excel" : "Upload an Excel file first"}
                >
                  📊 Generate PowerPoint
                </button>

                <button
                  className="btn-reset"
                  onClick={resetAll}
                  title="Reset / clear uploaded file and preview"
                >
                  ♻️ Reset
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
