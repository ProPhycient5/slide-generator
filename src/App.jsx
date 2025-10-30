import React, { useState } from "react";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import FileDropZone from "./components/FileDropZone";
import "./App.css";

function App() {
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  const resetAll = () => {
    setExcelData([]);
    setFileName("");
    // bump a signal so FileDropZone can clear its internal file input value
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

  const generatePPT = async () => {
    if (!excelData.length) {
      alert("No Excel data found!");
      return;
    }

    try {
      console.log("Starting PPT generation...");
      const pptx = new PptxGenJS();

      // global slide defaults (optional)
      pptx.layout = "LAYOUT_WIDE"; // 16:9

      excelData.forEach((row, index) => {
        const slide = pptx.addSlide();

        const keys = Object.keys(row || {});
        // Determine a title: prefer 'Title' or the first field
        const titleField = keys.find((k) => /title/i.test(k)) || keys[0];
        const titleText = titleField ? String(row[titleField] ?? `Slide ${index + 1}`) : `Slide ${index + 1}`;

        // Title box
        slide.addText(titleText, {
          x: 0.5,
          y: 0.35,
          w: 8.5,
          h: 0.9,
          bold: true,
          fontSize: 26,
          color: "1F4E78",
          align: "center",
        });

        // Subtitle / small meta (optional)
        slide.addText(`Row ${index + 1}${fileName ? ` • ${fileName}` : ""}` , {
          x: 0.5,
          y: 1.05,
          w: 8.5,
          fontSize: 10,
          color: "556677",
          align: "center",
        });

        // Prepare bullet list for the rest of the fields
        const bulletLines = keys
          .filter((k) => k !== titleField)
          .map((k) => `${k}: ${row[k] ?? ""}`)
          .filter((t) => t.trim().length > 0);

        if (bulletLines.length > 0) {
          // Render each field as a separate line: "Header - Value" with font size 18.
          // Join with newlines and use bullet:true so each line becomes a bullet item.
          const fields = keys.filter((k) => k !== titleField);
          const textString = fields.map((h) => `${h} - ${row[h] ?? ""}`).join("\n");

          slide.addText(textString, {
            x: 0.7,
            y: 1.6,
            w: 8.3,
            h: 4.0,
            fontSize: 18,
            color: "363636",
            lineSpacing: 20,
            align: "left",
            bullet: true,
            bulletColor: "007bff",
          });
        } else {
          // fallback: small center text if there are no other fields
          slide.addText("(No additional data)", { x: 1, y: 2, fontSize: 12, color: "999999" });
        }
      });

      console.log("Calling writeFile to generate PPTX...");
      await pptx.writeFile({ fileName: "Excel_to_PPT.pptx" });
      console.log("PPTX generation finished");
    } catch (err) {
      console.error("Failed to generate PPTX:", err);
      // Surface a helpful alert, but encourage checking console for full details
      alert("Failed to generate PowerPoint. Check the browser console for details.");
    }
  };
  return (
    <div className="app-container">
      <div className="content-card">
        <h1>🧠 Excel ➜ PowerPoint Converter</h1>
  <FileDropZone onFileUpload={handleFileUpload} resetSignal={resetSignal} />

        {fileName && <p className="filename">✅ Uploaded: {fileName}</p>}

        {excelData.length > 0 && (
          <div className="preview-section">
            <h3>Preview (First 5 Rows)</h3>
            <p style={{marginTop:6, color:'#556'}}>{excelData.length} rows loaded</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {Object.keys(excelData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="buttons-row">
            <button
              className="btn-generate"
              onClick={generatePPT}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
