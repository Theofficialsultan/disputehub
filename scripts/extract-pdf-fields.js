#!/usr/bin/env node

/**
 * PDF FIELD EXTRACTOR
 * 
 * Extracts fillable field names from official PDF forms
 * Usage: node scripts/extract-pdf-fields.js <path-to-pdf>
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function extractFields(pdfPath) {
  console.log(`\n📄 Analyzing PDF: ${path.basename(pdfPath)}\n`);
  
  try {
    // Read the PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all fields
    const fields = form.getFields();
    
    console.log(`Found ${fields.length} fillable fields:\n`);
    
    if (fields.length === 0) {
      console.log('⚠️  This PDF has NO fillable fields.');
      console.log('   It may be a flat PDF that needs to be filled manually.');
      console.log('   For these forms, we generate guidance documents instead.\n');
      return [];
    }
    
    const fieldData = [];
    
    fields.forEach((field, idx) => {
      const name = field.getName();
      const type = field.constructor.name;
      
      let value = '';
      try {
        if (type === 'PDFTextField') {
          value = field.getText() || '[empty]';
        } else if (type === 'PDFCheckBox') {
          value = field.isChecked() ? 'checked' : 'unchecked';
        } else if (type === 'PDFRadioGroup') {
          value = field.getSelected() || '[none selected]';
        } else if (type === 'PDFDropdown') {
          value = field.getSelected() ? field.getSelected().join(', ') : '[none selected]';
        }
      } catch (e) {
        value = '[unable to read]';
      }
      
      fieldData.push({ name, type, value });
      
      console.log(`${idx + 1}. ${name}`);
      console.log(`   Type: ${type}`);
      console.log(`   Current: ${value}`);
      console.log('');
    });
    
    // Save to JSON
    const outputPath = pdfPath.replace('.pdf', '-fields.json');
    fs.writeFileSync(outputPath, JSON.stringify(fieldData, null, 2));
    
    console.log(`✅ Field data saved to: ${outputPath}\n`);
    
    return fieldData;
    
  } catch (error) {
    console.error(`❌ Error analyzing PDF: ${error.message}`);
    throw error;
  }
}

async function analyzeAllForms() {
  const formsPaths = [
    'public/official-forms/employment/ET1-claim-form-2024.pdf',
    'public/official-forms/county-court/N1-claim-form-2024.pdf',
    'public/official-forms/benefits/SSCS1-appeal-form-2024.pdf',
  ];
  
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  PDF Field Extractor                     ║');
  console.log('╚══════════════════════════════════════════╝');
  
  for (const formPath of formsPaths) {
    const fullPath = path.join(process.cwd(), formPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`\n⏭️  Skipping ${path.basename(formPath)} - not found\n`);
      continue;
    }
    
    try {
      await extractFields(fullPath);
    } catch (error) {
      console.error(`Failed to process ${formPath}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n✨ Analysis complete!\n');
}

// Run
const args = process.argv.slice(2);

if (args.length > 0) {
  // Analyze specific PDF
  extractFields(args[0]).catch(error => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
} else {
  // Analyze all downloaded forms
  analyzeAllForms().catch(error => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
}
