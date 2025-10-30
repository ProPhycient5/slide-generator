import React, { useState } from "react";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import FileDropZone from "./components/FileDropZone";
import PreviewCard from "./components/PreviewCard";
import ThemeSelector from "./components/ThemeSelector";
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

    // Create a gradient PNG data URL that we can insert as a full-slide background image
    const createGradientDataUrl = (gradient, width = 1600, height = 900) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Convert the CSS angle (clockwise from top) to canvas angle (counterclockwise from right)
        const cssAngle = gradient.angle ?? 90; // default to 90deg if not specified
        // Convert to radians and adjust coordinate system
        const angleInRadians = (450 - cssAngle) % 360 * Math.PI / 180;
        
        // Calculate diagonal length to ensure gradient covers the entire canvas
        const diagonalLength = Math.sqrt(width * width + height * height);
        
        // Calculate gradient start and end points from the center
        const centerX = width / 2;
        const centerY = height / 2;
        const startX = centerX + Math.cos(angleInRadians) * diagonalLength;
        const startY = centerY + Math.sin(angleInRadians) * diagonalLength;
        const endX = centerX - Math.cos(angleInRadians) * diagonalLength;
        const endY = centerY - Math.sin(angleInRadians) * diagonalLength;
        
        const g = ctx.createLinearGradient(startX, startY, endX, endY);
        g.addColorStop(0, `#${gradient.start}`);
        g.addColorStop(1, `#${gradient.end}`);

        ctx.fillStyle = g;
        ctx.globalAlpha = gradient.opacity ?? 1;
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Could not create gradient canvas, falling back to solid color', e);
        return null;
      }
    };

  const generatePPT = async () => {
    if (!excelData.length) {
      alert("No Excel data found!");
      return;
    }

    try {
      console.log("Starting PPT generation...");
      const pptx = new PptxGenJS();
      const theme = THEMES[selectedTheme];

      // global slide defaults (optional)
      pptx.layout = "LAYOUT_WIDE"; // 16:9

      // Create a background image for the selected theme once and reuse it for every slide.
      const bgDataUrl = createGradientDataUrl(theme.colors.gradient);

      excelData.forEach((row, index) => {
        const slide = pptx.addSlide();

        // Add gradient background so it fills the entire slide.
        if (bgDataUrl) {
          try {
            // Preferred: set as slide background image (covers full slide reliably)
            slide.background = { data: bgDataUrl };
          } catch (err) {
            // Some pptxgenjs versions may not accept background.data; fallback to placing an oversized image
            // Use slightly larger dims to avoid tiny edge gaps
            console.warn('slide.background.data unsupported, using oversized image fallback', err);
            slide.addImage({ data: bgDataUrl, x: -0.2, y: -0.2, w: 10.4, h: 5.825 });
          }
        } else {
          // fallback to solid color if canvas generation failed
          slide.background = { fill: 'solid', color: theme.colors.gradient.end };
        }

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
          color: theme.colors.title,
          align: "center",
        });

        // Subtitle / small meta (optional)
        slide.addText(`Row ${index + 1}${fileName ? ` • ${fileName}` : ""}` , {
          x: 0.5,
          y: 1.05,
          w: 8.5,
          fontSize: 10,
          color: theme.colors.subtitle,
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
            color: theme.colors.text,
            lineSpacing: 20,
            align: "left",
            bullet: true,
            bulletColor: theme.colors.bullet,
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
      <header className="site-header">
        <div className="header-inner">
          <h1>🧠 Excel ➜ PowerPoint Converter</h1>
          <p className="phrase">Turn spreadsheet rows into beautiful slides — fast, simple, and reliable.</p>
        </div>
      </header>

      <main className="main-content">
        <div className="content-card">
          <FileDropZone onFileUpload={handleFileUpload} resetSignal={resetSignal} />

        {fileName && <p className="filename">✅ Uploaded: {fileName}</p>}

        {excelData.length > 0 && (
          <div className="preview-section">
            <h3>Preview Slides</h3>
            <div className="preview-grid">
              {excelData.slice(0, 3).map((row, idx) => (
                <PreviewCard key={idx} data={row} theme={selectedTheme} />
              ))}
            </div>
            
            <h3 style={{marginTop: 24}}>Data Preview</h3>
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

          <ThemeSelector
            themes={THEMES}
            selectedTheme={selectedTheme}
            onChange={setSelectedTheme}
          />
          
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
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <small>Made with ❤️ — Export slides from your Excel sheets quickly.</small>
        </div>
      </footer>
    </div>
  );
}

export default App;
