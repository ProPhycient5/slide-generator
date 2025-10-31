import PptxGenJS from "pptxgenjs";
import { createGradientDataUrl } from './gradientUtils';

export const generatePPT = async (excelData, theme, fileName, bgDataUrl = null) => {
  if (!excelData.length) {
    throw new Error("No Excel data found!");
  }

  const pptx = new PptxGenJS();
  
  // global slide defaults
  pptx.layout = "LAYOUT_WIDE"; // 16:9

  // If caller provided a background image (data URL), prefer that. Otherwise generate gradient image.
  const resolvedBgDataUrl = bgDataUrl || createGradientDataUrl(theme.colors.gradient);

  excelData.forEach((row, index) => {
    const slide = pptx.addSlide();

    // Add background image if available, otherwise fallback to solid color
    if (resolvedBgDataUrl) {
      try {
        slide.background = { data: resolvedBgDataUrl };
      } catch (err) {
        console.warn('slide.background.data unsupported, using oversized image fallback', err);
        slide.addImage({ data: resolvedBgDataUrl, x: -0.2, y: -0.2, w: 10.4, h: 5.825 });
      }
    } else {
      slide.background = { fill: 'solid', color: theme.colors.gradient.end };
    }

    const keys = Object.keys(row || {});
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

    // Subtitle
    slide.addText(`Row ${index + 1}${fileName ? ` • ${fileName}` : ""}` , {
      x: 0.5,
      y: 1.05,
      w: 8.5,
      fontSize: 10,
      color: theme.colors.subtitle,
      align: "center",
    });

    // Content
    const bulletLines = keys
      .filter((k) => k !== titleField)
      .map((k) => `${k}: ${row[k] ?? ""}`)
      .filter((t) => t.trim().length > 0);

    if (bulletLines.length > 0) {
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
      slide.addText("(No additional data)", { 
        x: 1, 
        y: 2, 
        fontSize: 12, 
        color: "999999" 
      });
    }
  });

  await pptx.writeFile({ fileName: "Excel_to_PPT.pptx" });
};