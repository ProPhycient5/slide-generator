import React, { useState } from "react";
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

  const resetAll = () => {
    setExcelData([]);
    setFileName("");
    setResetSignal((s) => s + 1);
  };

  const handleFileUpload = (file) => {
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGeneratePPT = async () => {
    if (!excelData.length) {
      alert("No Excel data found!");
      return;
    }

    try {
      console.log("Starting PPT generation...");
      await generatePPT(excelData, THEMES[selectedTheme], fileName);
      console.log("PPTX generation finished");
    } catch (err) {
      console.error("Failed to generate PPTX:", err);
      alert("Failed to generate PowerPoint. Check the browser console for details.");
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
              <SlidePreview data={excelData} theme={selectedTheme} />
              <DataPreview data={excelData} />

              <ThemeSelector
                themes={THEMES}
                selectedTheme={selectedTheme}
                onChange={setSelectedTheme}
              />
              
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
