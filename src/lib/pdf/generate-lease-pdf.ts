"use client";

import jsPDF from "jspdf";

interface LeaseChange {
  section: string;
  original_text: string;
  revised_text: string;
  priority: string;
  rationale: string;
}

interface GeneratePdfOptions {
  title: string;
  propertyAddress?: string;
  preparedBy: string;
  preparedFor?: string;
  improvedDocument?: string;
  changes: LeaseChange[];
  coverLetter?: string;
}

export function generateLeasePdf(options: GeneratePdfOptions): void {
  try {
    const {
      title,
      propertyAddress,
      improvedDocument,
      changes,
    } = options;

    // Validate inputs
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required for PDF generation");
    }

    if (!improvedDocument && (!changes || changes.length === 0)) {
      throw new Error("Either improvedDocument or changes array must be provided");
    }

    console.log("Starting PDF generation...", {
      hasImprovedDocument: !!improvedDocument,
      changesCount: changes?.length || 0,
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 1 inch margins
    const contentWidth = pageWidth - margin * 2;
    
    let y = margin;
    const lineHeight = 14;
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let currentPage = 1;
    let totalPages = 1; // Will update at the end

    // Helper functions
    const addPage = () => {
      doc.addPage();
      currentPage++;
      y = margin;
    };

    const checkPageBreak = (neededSpace: number): boolean => {
      if (y + neededSpace > pageHeight - margin - 40) {
        addPage();
        return true;
      }
      return false;
    };

    const addFooter = (pageNum: number, total: number) => {
      doc.setFontSize(9);
      doc.setFont("times", "normal");
      doc.setTextColor(80);
      
      // Footer line
      doc.setDrawColor(180);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 50, pageWidth - margin, pageHeight - 50);
      
      // Left: Document title
      doc.text(title, margin, pageHeight - 35);
      
      // Center: Page number
      const pageText = `Page ${pageNum} of ${total}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 35);
      
      // Right: Confidential
      const confText = "Confidential";
      doc.text(confText, pageWidth - margin - doc.getTextWidth(confText), pageHeight - 35);
      
      doc.setTextColor(0);
    };

    const centerText = (text: string, fontSize: number, fontStyle: "normal" | "bold" = "normal") => {
      doc.setFontSize(fontSize);
      doc.setFont("times", fontStyle);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
      y += lineHeight * (fontSize / 12);
    };

    const addParagraph = (text: string, fontSize: number = 11, indent: number = 0, fontStyle: "normal" | "bold" | "italic" = "normal") => {
      doc.setFontSize(fontSize);
      doc.setFont("times", fontStyle);
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      
      for (const line of lines) {
        checkPageBreak(lineHeight);
        doc.text(line, margin + indent, y);
        y += lineHeight;
      }
      y += 2;
    };

    // ============================================================
    // PAGE 1: TITLE PAGE
    // ============================================================
    
    y = pageHeight * 0.25;
  
  // Document Type
  doc.setFontSize(12);
  doc.setFont("times", "normal");
  centerText("COMMERCIAL", 12);
  y += 5;
  
  // Main Title
  doc.setFontSize(28);
  doc.setFont("times", "bold");
  centerText("LEASE AGREEMENT", 28, "bold");
  y += 30;
  
  // Property Address
  if (propertyAddress) {
    doc.setFontSize(14);
    doc.setFont("times", "normal");
    centerText(propertyAddress, 14);
    y += 10;
  }
  
  // Decorative double line
  y += 20;
  doc.setDrawColor(0);
  doc.setLineWidth(2);
  doc.line(pageWidth * 0.25, y, pageWidth * 0.75, y);
  doc.setLineWidth(0.5);
  doc.line(pageWidth * 0.25, y + 5, pageWidth * 0.75, y + 5);
  y += 50;
  
  // Between parties
  doc.setFontSize(12);
  doc.setFont("times", "italic");
  centerText("between", 12);
  y += 25;
  
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  centerText("LANDLORD", 14, "bold");
  y += 25;
  
  doc.setFontSize(12);
  doc.setFont("times", "italic");
  centerText("and", 12);
  y += 25;
  
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  centerText("TENANT", 14, "bold");
  
  // Date at bottom
  y = pageHeight - 150;
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  centerText(`Effective Date: ${today}`, 11);
  
    // ============================================================
    // PAGE 2: AGREEMENT TERMS
    // ============================================================
    addPage();
    
    y = margin;
  
  // Header
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  centerText("COMMERCIAL LEASE AGREEMENT", 14, "bold");
  y += 5;
  doc.setDrawColor(0);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;
  
  // Introduction paragraph
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  addParagraph(
    `This Commercial Lease Agreement (this "Lease") is made and entered into as of ${today}, by and between LANDLORD ("Landlord") and TENANT ("Tenant").`,
    11,
    0
  );
  y += 10;
  
  // Premises section
  doc.setFont("times", "bold");
  doc.text("PREMISES:", margin, y);
  doc.setFont("times", "normal");
  y += lineHeight;
  addParagraph(
    `Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the premises located at ${propertyAddress || "[Property Address]"} (the "Premises"), subject to the terms and conditions set forth herein.`,
    11,
    20
  );
  y += 15;
  
  // Recitals
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("RECITALS", margin, y);
  y += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 60, y);
  y += 15;
  
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  
  const recitals = [
    `WHEREAS, Landlord is the owner of the Premises and desires to lease the same to Tenant;`,
    `WHEREAS, Tenant desires to lease the Premises from Landlord for the purposes described herein;`,
    `WHEREAS, the parties have negotiated and agreed upon the terms set forth in this Lease;`,
  ];
  
  for (const recital of recitals) {
    addParagraph(recital, 11, 36);
  }
  
  y += 5;
  addParagraph(
    "NOW, THEREFORE, in consideration of the mutual covenants herein and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:",
    11,
    0
  );
  y += 20;
  
    // ============================================================
    // MAIN CONTENT: LEASE TERMS
    // ============================================================
    
    try {
    if (improvedDocument && improvedDocument.trim().length > 0) {
      // Parse and render the improved document
      // Remove revision markers for final draft - this is a clean, executable contract
      const cleanDocument = improvedDocument
        .replace(/\[REVISED\]/gi, "")
        .replace(/\[NEW CLAUSE\]/gi, "")
        .replace(/\[DELETED\].*?\(was:.*?\)/gi, "")
        .trim();
      
      renderDocumentContent(doc, cleanDocument, margin, contentWidth, lineHeight, 
        () => checkPageBreak(lineHeight * 3), 
        (newY: number) => { y = newY; }, 
        () => y,
        () => addPage()
      );
    } else if (changes && changes.length > 0) {
      // Render from changes as articles - use revised text only (final version)
      renderChangesAsLease(doc, changes, margin, contentWidth, lineHeight,
        (space: number) => checkPageBreak(space),
        (newY: number) => { y = newY; },
        () => y,
        () => addPage()
      );
    } else {
      // Fallback: Add a note that content is missing
      addParagraph(
        "This lease agreement has been prepared based on the analysis and improvements identified. " +
        "Please refer to the full analysis report for detailed terms and conditions.",
        11,
        0
      );
    }
  } catch (error) {
    console.error("Error rendering document content:", error);
    addParagraph(
      "An error occurred while generating the document content. " +
      "Please regenerate the improved lease or contact support.",
      11,
      0
    );
  }
  
    // ============================================================
    // MISCELLANEOUS PROVISIONS
    // ============================================================
    checkPageBreak(150);
    
    y += 20;
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("GENERAL PROVISIONS", margin, y);
  y += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;
  
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  
  const generalProvisions = [
    "Entire Agreement. This Lease constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to its subject matter.",
    "Amendments. This Lease may not be amended or modified except by written instrument signed by both parties.",
    "Severability. If any provision of this Lease is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
    "Governing Law. This Lease shall be governed by and construed in accordance with the laws of the state in which the Premises is located.",
    "Binding Effect. This Lease shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns.",
    "Notices. All notices required under this Lease shall be in writing and delivered to the addresses set forth herein or such other address as a party may designate in writing.",
  ];
  
  let provNum = 1;
  for (const prov of generalProvisions) {
    checkPageBreak(40);
    doc.setFont("times", "bold");
    doc.text(`${provNum}.`, margin, y);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(prov, contentWidth - 30);
    for (const line of lines) {
      doc.text(line, margin + 25, y);
      y += lineHeight;
    }
    y += 8;
    provNum++;
  }
  
    // ============================================================
    // SIGNATURE PAGE
    // ============================================================
    addPage();
    
    y = margin;
  
  // Execution header
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  centerText("EXECUTION", 14, "bold");
  y += 5;
  doc.setLineWidth(1);
  doc.line(margin + 100, y, pageWidth - margin - 100, y);
  y += 30;
  
  // Witness clause
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  addParagraph(
    "IN WITNESS WHEREOF, the parties hereto have executed this Lease Agreement as of the date first written above, intending to be legally bound hereby.",
    11,
    36
  );
  
  y += 50;
  
  // Two-column signature blocks
  const leftX = margin;
  const rightX = pageWidth / 2 + 20;
  const sigBlockWidth = (pageWidth - margin * 2 - 40) / 2;
  
  const drawSignatureBlock = (x: number, partyName: string) => {
    let sigY = y;
    
    // Party header
    doc.setFontSize(11);
    doc.setFont("times", "bold");
    doc.text(`${partyName}:`, x, sigY);
    sigY += 35;
    
    // Signature line
    doc.setLineWidth(0.5);
    doc.line(x, sigY, x + sigBlockWidth - 20, sigY);
    sigY += 12;
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text("Authorized Signature", x, sigY);
    sigY += 30;
    
    // Print name
    doc.line(x, sigY, x + sigBlockWidth - 20, sigY);
    sigY += 12;
    doc.text("Print Name", x, sigY);
    sigY += 30;
    
    // Title
    doc.line(x, sigY, x + sigBlockWidth - 20, sigY);
    sigY += 12;
    doc.text("Title", x, sigY);
    sigY += 30;
    
    // Date
    doc.line(x, sigY, x + sigBlockWidth - 20, sigY);
    sigY += 12;
    doc.text("Date", x, sigY);
    
    return sigY + 30;
  };
  
  drawSignatureBlock(leftX, "LANDLORD");
  const finalY = drawSignatureBlock(rightX, "TENANT");
  y = finalY;
  
  // Notary section (optional)
  y += 30;
  checkPageBreak(100);
  
  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.setTextColor(100);
  centerText("[NOTARY ACKNOWLEDGMENT MAY BE ATTACHED IF REQUIRED]", 10);
  doc.setTextColor(0);
  
    // ============================================================
    // ADD FOOTERS TO ALL PAGES
    // ============================================================
    totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }
    
    // ============================================================
    // SAVE PDF
    // ============================================================
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
    const filename = `${cleanTitle}_Lease_Agreement.pdf`;
    
    console.log("Saving PDF as:", filename);
    doc.save(filename);
    console.log("PDF generated successfully");
  } catch (error) {
    console.error("PDF generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    alert(`Failed to generate PDF: ${errorMessage}\n\nPlease check the browser console for details.`);
    throw error; // Re-throw so calling code can handle it
  }
}

function renderDocumentContent(
  doc: jsPDF,
  content: string,
  margin: number,
  contentWidth: number,
  lineHeight: number,
  checkBreak: () => boolean,
  setY: (y: number) => void,
  getY: () => number,
  addPage: () => void
) {
  if (!content || content.trim().length === 0) {
    console.warn("Empty content provided to renderDocumentContent");
    return;
  }

  try {
    const lines = content.split("\n");
    let articleNum = 0;
    let sectionNum = 0;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        // Add small spacing for empty lines
        let y = getY();
        y += lineHeight * 0.5;
        setY(y);
        continue;
      }
      
      let y = getY();
      
      // Check for page break
      if (checkBreak()) {
        y = getY();
      }
      
      // Remove any remaining markers from text (should already be cleaned, but just in case)
      const cleanText = trimmed
        .replace(/\[REVISED\]/gi, "")
        .replace(/\[NEW CLAUSE\]/gi, "")
        .replace(/\[DELETED\].*?\(was:.*?\)/gi, "")
        .trim();
      
      if (!cleanText) continue;
      
      // Article/Section headers
      if (/^(ARTICLE|SECTION)\s+[IVXLCDM\d]+/i.test(trimmed)) {
        articleNum++;
        sectionNum = 0;
        
        // Add some space before new article
        if (articleNum > 1) {
          y += 15;
          setY(y);
          if (checkBreak()) y = getY();
        }
        
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const headerText = cleanText.toUpperCase();
        doc.text(headerText, margin, y);
        y += 5;
        doc.setLineWidth(0.5);
        const headerWidth = doc.getTextWidth(headerText);
        doc.line(margin, y, margin + Math.min(headerWidth + 10, contentWidth), y);
        setY(y + 18);
        continue;
      }
      
      // Numbered sections (e.g., "1.1", "2.3")
      const sectionMatch = trimmed.match(/^(\d+\.?\d*)\s+(.+)/);
      if (sectionMatch) {
        sectionNum++;
        const [, num, rest] = sectionMatch;
        const restClean = (rest || "")
          .replace(/\[REVISED\]/gi, "")
          .replace(/\[NEW CLAUSE\]/gi, "")
          .trim();
        
        if (!restClean) continue;
        
        if (checkBreak()) y = getY();
        
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text(num || "", margin, y);
        
        // Check if there's a title (ends with colon or period followed by more text)
        const titleMatch = restClean.match(/^([^.]+)[.:]\s*(.*)/);
        if (titleMatch) {
          doc.text(titleMatch[1] + ".", margin + 25, y);
          y += lineHeight;
          
          if (titleMatch[2]) {
            doc.setFont("times", "normal");
            const bodyLines = doc.splitTextToSize(titleMatch[2], contentWidth - 40);
            for (const bl of bodyLines) {
              if (y > pageHeight - 80) {
                addPage();
                y = 72;
              }
              doc.text(bl, margin + 40, y);
              y += lineHeight;
            }
          }
        } else {
          doc.setFont("times", "normal");
          const bodyLines = doc.splitTextToSize(restClean, contentWidth - 30);
          for (const bl of bodyLines) {
            if (y > pageHeight - 80) {
              addPage();
              y = 72;
            }
            doc.text(bl, margin + 25, y);
            y += lineHeight;
          }
        }
        setY(y + 8);
        continue;
      }
      
      // Subsections ((a), (b), (i), (ii))
      if (/^\([a-z]\)|\([ivx]+\)/i.test(trimmed)) {
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        const subLines = doc.splitTextToSize(cleanText, contentWidth - 50);
        for (const sl of subLines) {
          if (y > pageHeight - 80) {
            addPage();
            y = 72;
          }
          doc.text(sl, margin + 50, y);
          y += lineHeight;
        }
        setY(y + 4);
        continue;
      }
      
      // Regular paragraph
      doc.setFontSize(11);
      doc.setFont("times", "normal");
      const paraLines = doc.splitTextToSize(cleanText, contentWidth - 20);
      for (const pl of paraLines) {
        if (y > pageHeight - 80) {
          addPage();
          y = 72;
        }
        doc.text(pl, margin + 20, y);
        y += lineHeight;
      }
      setY(y + 6);
    }
  } catch (error) {
    console.error("Error in renderDocumentContent:", error);
    // Add error message to document
    let y = getY();
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.setTextColor(200, 0, 0);
    doc.text("Error rendering document content. Please regenerate.", margin, y);
    doc.setTextColor(0);
  }
}

function renderChangesAsLease(
  doc: jsPDF,
  changes: LeaseChange[],
  margin: number,
  contentWidth: number,
  lineHeight: number,
  checkBreak: (space: number) => boolean,
  setY: (y: number) => void,
  getY: () => number,
  addPage: () => void
) {
  // Group changes by priority for organizing into articles
  const critical = changes.filter(c => c.priority === "critical");
  const high = changes.filter(c => c.priority === "high");
  const medium = changes.filter(c => c.priority === "medium");
  const low = changes.filter(c => c.priority === "low");
  
  let articleNum = 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const renderGroup = (items: LeaseChange[], articleTitle: string) => {
    if (items.length === 0) return;
    
    let y = getY();
    
    if (checkBreak(50)) {
      y = getY();
    }
    
    // Article header
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text(`ARTICLE ${toRoman(articleNum)}: ${articleTitle.toUpperCase()}`, margin, y);
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
    setY(y);
    articleNum++;
    
    let sectionNum = 1;
    for (const change of items) {
      y = getY();
      
      if (checkBreak(80)) {
        y = getY();
      }
      
      // Section header
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text(`${articleNum - 1}.${sectionNum}`, margin, y);
      doc.text(change.section, margin + 30, y);
      y += lineHeight + 5;
      
      // Content
      doc.setFont("times", "normal");
      const contentLines = doc.splitTextToSize(change.revised_text, contentWidth - 40);
      for (const cl of contentLines) {
        if (y > doc.internal.pageSize.getHeight() - 80) {
          addPage();
          y = 72;
        }
        doc.text(cl, margin + 40, y);
        y += lineHeight;
      }
      y += 12;
      setY(y);
      
      sectionNum++;
    }
    
    setY(getY() + 10);
  };
  
  renderGroup(critical, "Critical Terms");
  renderGroup(high, "Key Provisions");
  renderGroup(medium, "Standard Terms");
  renderGroup(low, "Additional Terms");
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let result = "";
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}
