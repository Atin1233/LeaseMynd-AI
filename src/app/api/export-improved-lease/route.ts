// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      leaseId, 
      improvedDocument, 
      changes, 
      coverLetter,
      propertyAddress,
      leaseTitle,
    } = await request.json();

    if (!leaseId) {
      return NextResponse.json(
        { error: "Lease ID is required" },
        { status: 400 }
      );
    }

    if (!improvedDocument && (!changes || changes.length === 0)) {
      return NextResponse.json(
        { error: "Either improved document or changes are required" },
        { status: 400 }
      );
    }

    // Verify lease ownership
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("organization_id, title, property_address")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.organization_id !== lease.organization_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const title = leaseTitle || lease.title || "Commercial Lease Agreement";
    const address = propertyAddress || lease.property_address || "";
    const preparedBy = profile?.full_name || user.email || "Tenant";

    // Generate the PDF
    const pdfBytes = await generateLegalPdf({
      title,
      address,
      preparedBy,
      improvedDocument: improvedDocument || "",
      changes: changes || [],
      coverLetter: coverLetter || "",
    });

    // Return PDF with download headers
    const filename = `Revised_Lease_${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export improved lease error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

interface PdfParams {
  title: string;
  address: string;
  preparedBy: string;
  improvedDocument: string;
  changes: Array<{
    section: string;
    original_text: string;
    revised_text: string;
    priority: string;
    rationale: string;
  }>;
  coverLetter: string;
}

async function generateLegalPdf(params: PdfParams): Promise<Uint8Array> {
  const { title, address, preparedBy, improvedDocument, changes } = params;
  
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  // Page settings
  const pageWidth = 612; // 8.5 inches
  const pageHeight = 792; // 11 inches
  const margin = 72; // 1 inch
  const contentWidth = pageWidth - (margin * 2);
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const headerSize = 14;
  const titleSize = 16;
  
  // Helper to add a new page
  const addPage = (): PDFPage => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    return page;
  };
  
  // Helper to draw wrapped text
  const drawWrappedText = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    color = rgb(0, 0, 0)
  ): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > maxWidth && line) {
        page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= lineHeight;
        line = word;
        
        // Check if we need a new page
        if (currentY < margin + 50) {
          return currentY; // Return current Y to signal page break needed
        }
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
    }
    
    return currentY;
  };
  
  // Format date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  // ============================================================================
  // PAGE 1: TITLE PAGE
  // ============================================================================
  let page = addPage();
  let y = pageHeight - margin;
  
  // Title
  const titleWidth = timesBold.widthOfTextAtSize(title.toUpperCase(), titleSize);
  page.drawText(title.toUpperCase(), {
    x: (pageWidth - titleWidth) / 2,
    y: y - 20,
    size: titleSize,
    font: timesBold,
  });
  y -= 50;
  
  // Subtitle - Address
  if (address) {
    const addrWidth = timesRoman.widthOfTextAtSize(address, fontSize);
    page.drawText(address, {
      x: (pageWidth - addrWidth) / 2,
      y,
      size: fontSize,
      font: timesRoman,
    });
    y -= 30;
  }
  
  // Horizontal line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
  });
  y -= 40;
  
  // Agreement details
  const centerText = (text: string, font: PDFFont, size: number, yPos: number) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - width) / 2,
      y: yPos,
      size,
      font,
    });
  };
  
  centerText("REVISED LEASE AGREEMENT", timesBold, 14, y);
  y -= 30;
  
  centerText("Between", timesItalic, fontSize, y);
  y -= 25;
  
  centerText("LANDLORD", timesBold, fontSize, y);
  y -= 20;
  centerText("and", timesItalic, fontSize, y);
  y -= 20;
  centerText("TENANT", timesBold, fontSize, y);
  y -= 50;
  
  // Date and preparer
  page.drawText(`Effective Date: ${formattedDate}`, {
    x: margin,
    y,
    size: fontSize,
    font: timesRoman,
  });
  y -= lineHeight;
  
  page.drawText(`Prepared By: ${preparedBy}`, {
    x: margin,
    y,
    size: fontSize,
    font: timesRoman,
  });
  y -= 50;
  
  // Confidential notice
  page.drawRectangle({
    x: margin,
    y: y - 40,
    width: contentWidth,
    height: 50,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  centerText("CONFIDENTIAL", timesBold, 12, y - 15);
  centerText("Final Draft - For Execution", timesRoman, 10, y - 30);
  
  // ============================================================================
  // PAGE 2+: RECITALS AND AGREEMENT
  // ============================================================================
  page = addPage();
  y = pageHeight - margin;
  
  // Recitals header
  centerText("RECITALS", timesBold, headerSize, y);
  y -= 40;
  
  // Whereas clauses
  const recitals = [
    `WHEREAS, Landlord is the owner of certain real property located at ${address || "[PROPERTY ADDRESS]"} (the "Premises");`,
    `WHEREAS, Tenant desires to lease the Premises from Landlord upon the terms and conditions set forth herein;`,
    `WHEREAS, the parties have agreed upon the terms contained in this Agreement;`,
    `NOW, THEREFORE, in consideration of the mutual covenants herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:`,
  ];
  
  for (const recital of recitals) {
    page.drawText("WHEREAS,", { x: margin, y, size: fontSize, font: timesBold });
    y = drawWrappedText(page, recital.replace(/^WHEREAS,\s*/i, "").replace(/^NOW, THEREFORE,\s*/i, ""), margin + 70, y, contentWidth - 70, timesRoman, fontSize);
    y -= lineHeight;
  }
  
  y -= 20;
  
  // Horizontal line before main content
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
  });
  y -= 30;
  
  // ============================================================================
  // MAIN CONTENT: IMPROVED DOCUMENT OR CHANGES
  // ============================================================================
  
  if (improvedDocument && improvedDocument.trim()) {
    // Parse and render the improved document
    const sections = parseLeaseDocument(improvedDocument);
    
    for (const section of sections) {
      // Check if we need a new page
      if (y < margin + 100) {
        page = addPage();
        y = pageHeight - margin;
      }
      
      if (section.type === 'article') {
        // Article header
        y -= 10;
        page.drawText(section.text.toUpperCase(), {
          x: margin,
          y,
          size: 12,
          font: timesBold,
        });
        page.drawLine({
          start: { x: margin, y: y - 3 },
          end: { x: pageWidth - margin, y: y - 3 },
          thickness: 0.5,
        });
        y -= 25;
      } else if (section.type === 'revised') {
        // Revised section with highlight indicator
        page.drawText("▶ REVISED:", {
          x: margin,
          y,
          size: 9,
          font: timesBold,
          color: rgb(0.2, 0.5, 0.2),
        });
        y -= lineHeight;
        y = drawWrappedText(page, section.text, margin + 20, y, contentWidth - 20, timesRoman, fontSize);
        y -= lineHeight;
      } else if (section.type === 'new') {
        // New clause
        page.drawText("▶ NEW CLAUSE:", {
          x: margin,
          y,
          size: 9,
          font: timesBold,
          color: rgb(0.1, 0.3, 0.6),
        });
        y -= lineHeight;
        y = drawWrappedText(page, section.text, margin + 20, y, contentWidth - 20, timesRoman, fontSize);
        y -= lineHeight;
      } else if (section.type === 'section') {
        // Regular numbered section
        y = drawWrappedText(page, section.text, margin, y, contentWidth, timesRoman, fontSize);
        y -= lineHeight / 2;
      } else {
        // Regular paragraph
        y = drawWrappedText(page, section.text, margin, y, contentWidth, timesRoman, fontSize);
        y -= lineHeight / 2;
      }
    }
  } else if (changes && changes.length > 0) {
    // Render changes as schedule of revisions
    page.drawText("SCHEDULE OF REVISIONS", {
      x: margin,
      y,
      size: 12,
      font: timesBold,
    });
    y -= 25;
    
    y = drawWrappedText(
      page,
      "The following provisions have been revised from the original lease agreement. Each revision reflects negotiated terms between the parties.",
      margin,
      y,
      contentWidth,
      timesItalic,
      fontSize
    );
    y -= 30;
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      
      // Check if we need a new page
      if (y < margin + 150) {
        page = addPage();
        y = pageHeight - margin;
      }
      
      // Section header
      page.drawText(`${i + 1}. ${change.section}`, {
        x: margin,
        y,
        size: fontSize,
        font: timesBold,
      });
      y -= lineHeight + 5;
      
      // Revised text (this is what goes in the final document)
      y = drawWrappedText(page, change.revised_text, margin + 20, y, contentWidth - 20, timesRoman, fontSize);
      y -= lineHeight * 1.5;
      
      // Separator line
      page.drawLine({
        start: { x: margin + 50, y },
        end: { x: pageWidth - margin - 50, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= 20;
    }
  }
  
  // ============================================================================
  // SIGNATURE PAGE
  // ============================================================================
  page = addPage();
  y = pageHeight - margin;
  
  // Execution header
  centerText("EXECUTION", timesBold, headerSize, y);
  y -= 40;
  
  // Witness clause
  const witnessText = "IN WITNESS WHEREOF, the parties hereto have executed this Lease Agreement as of the date first written above, intending to be legally bound hereby.";
  y = drawWrappedText(page, witnessText, margin, y, contentWidth, timesRoman, fontSize);
  y -= 60;
  
  // Signature blocks side by side
  const sigBlockWidth = (contentWidth - 40) / 2;
  const leftX = margin;
  const rightX = margin + sigBlockWidth + 40;
  
  // Landlord
  page.drawText("LANDLORD:", { x: leftX, y, size: fontSize, font: timesBold });
  page.drawText("TENANT:", { x: rightX, y, size: fontSize, font: timesBold });
  y -= 50;
  
  // Signature lines
  const drawSignatureLine = (x: number, yPos: number, label: string) => {
    page.drawLine({
      start: { x, y: yPos },
      end: { x: x + sigBlockWidth - 20, y: yPos },
      thickness: 1,
    });
    page.drawText(label, { x, y: yPos - 15, size: 9, font: timesRoman });
    return yPos - 40;
  };
  
  let sigY = y;
  sigY = drawSignatureLine(leftX, sigY, "Signature");
  drawSignatureLine(rightX, y, "Signature");
  
  y = sigY;
  sigY = drawSignatureLine(leftX, sigY, "Print Name");
  drawSignatureLine(rightX, y, "Print Name");
  
  y = sigY;
  sigY = drawSignatureLine(leftX, sigY, "Title");
  drawSignatureLine(rightX, y, "Title");
  
  y = sigY;
  drawSignatureLine(leftX, sigY, "Date");
  drawSignatureLine(rightX, y, "Date");
  
  // ============================================================================
  // FOOTER ON ALL PAGES
  // ============================================================================
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    
    // Page number
    const pageNum = `Page ${i + 1} of ${pages.length}`;
    const pageNumWidth = timesRoman.widthOfTextAtSize(pageNum, 9);
    p.drawText(pageNum, {
      x: pageWidth - margin - pageNumWidth,
      y: 40,
      size: 9,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Document title
    p.drawText(title, {
      x: margin,
      y: 40,
      size: 9,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Footer line
    p.drawLine({
      start: { x: margin, y: 55 },
      end: { x: pageWidth - margin, y: 55 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  }
  
  // Save and return
  return await pdfDoc.save();
}

interface ParsedSection {
  type: 'article' | 'section' | 'revised' | 'new' | 'paragraph';
  text: string;
}

function parseLeaseDocument(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for article headers
    if (/^(ARTICLE|SECTION)\s+[IVXLCDM\d]+/i.test(trimmed)) {
      sections.push({ type: 'article', text: trimmed });
    }
    // Check for [REVISED] markers
    else if (trimmed.includes('[REVISED]')) {
      sections.push({ 
        type: 'revised', 
        text: trimmed.replace(/\[REVISED\]/g, '').trim() 
      });
    }
    // Check for [NEW CLAUSE] markers
    else if (trimmed.includes('[NEW CLAUSE]')) {
      sections.push({ 
        type: 'new', 
        text: trimmed.replace(/\[NEW CLAUSE\]/g, '').trim() 
      });
    }
    // Check for numbered sections
    else if (/^\d+\.\d*\s/.test(trimmed)) {
      sections.push({ type: 'section', text: trimmed });
    }
    // Regular paragraph
    else {
      sections.push({ type: 'paragraph', text: trimmed });
    }
  }
  
  return sections;
}
