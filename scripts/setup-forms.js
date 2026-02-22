#!/usr/bin/env node

/**
 * FORM SETUP SCRIPT - UPDATED WITH CORRECT URLs
 * 
 * Downloads all official UK legal forms and stores them locally
 * Run: npm run setup:forms
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Forms to download with VERIFIED URLs (as of January 2025)
const FORMS_TO_DOWNLOAD = [
  {
    id: 'ET1',
    name: 'Employment Tribunal Claim Form',
    url: 'https://assets.publishing.service.gov.uk/media/65bcbd214a666f000d1747ba/ET1_0224.pdf',
    path: 'employment/ET1-claim-form-2024.pdf',
    priority: 'HIGH'
  },
  {
    id: 'N1',
    name: 'County Court Claim Form',
    url: 'https://assets.publishing.service.gov.uk/media/674d7ea12e91c6fb83fb5162/N1_1224.pdf',
    path: 'county-court/N1-claim-form-2024.pdf',
    priority: 'HIGH'
  },
  {
    id: 'SSCS1',
    name: 'Social Security Appeal Form',
    url: 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1049321/sscs1a-eng.pdf',
    path: 'benefits/SSCS1-appeal-form-2024.pdf',
    priority: 'HIGH'
  },
  {
    id: 'N244',
    name: 'Application Notice',
    url: 'https://assets.publishing.service.gov.uk/media/674d84ce2e91c6c28afb515e/N244_1224.pdf',
    path: 'county-court/N244-application-notice-2024.pdf',
    priority: 'HIGH'
  },
  {
    id: 'ET3',
    name: 'Employment Tribunal Response',
    url: 'https://assets.publishing.service.gov.uk/media/65bcbd6c4a666f001617483b/ET3_0224.pdf',
    path: 'employment/ET3-response-form-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    id: 'N11',
    name: 'Defense and Counterclaim Form',
    url: 'https://assets.publishing.service.gov.uk/media/674d8ac22e91c6c28afb5161/N11_1224.pdf',
    path: 'county-court/N11-defense-form-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    id: 'N180',
    name: 'Directions Questionnaire (Small Claims)',
    url: 'https://assets.publishing.service.gov.uk/media/674d955a1d48f1a7ebfb5162/N180_1224.pdf',
    path: 'county-court/N180-directions-questionnaire-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    id: 'N9',
    name: 'Response Pack',
    url: 'https://assets.publishing.service.gov.uk/media/674d8f4d2e91c6fb83fb5168/N9_1224.pdf',
    path: 'county-court/N9-response-pack-2024.pdf',
    priority: 'LOW'
  },
];

// Base directory
const BASE_DIR = path.join(process.cwd(), 'public', 'official-forms');

// Create directories
function createDirectories() {
  const dirs = [
    'employment',
    'county-court',
    'benefits',
    'property',
    'tax',
    'immigration',
    'magistrates',
    'parking',
    'ombudsman'
  ];
  
  console.log('📁 Creating directories...');
  
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  
  dirs.forEach(dir => {
    const fullPath = path.join(BASE_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✓ ${dir}/`);
    }
  });
  
  console.log('');
}

// Download a single form with redirect following
function downloadForm(form) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(BASE_DIR, form.path);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  ${form.name} (${form.id}) - already exists`);
      resolve();
      return;
    }
    
    console.log(`⬇️  Downloading ${form.name} (${form.id})...`);
    
    const file = fs.createWriteStream(filePath);
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;
    
    function makeRequest(url) {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          redirectCount++;
          if (redirectCount > MAX_REDIRECTS) {
            file.close();
            fs.unlink(filePath, () => {});
            reject(new Error('Too many redirects'));
            return;
          }
          
          const redirectUrl = response.headers.location;
          console.log(`   → Redirecting to: ${redirectUrl}`);
          makeRequest(redirectUrl);
          return;
        }
        
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            const size = fs.statSync(filePath).size;
            const sizeKB = (size / 1024).toFixed(1);
            console.log(`   ✅ ${form.id}.pdf (${sizeKB} KB)`);
            resolve();
          });
        } else {
          file.close();
          fs.unlink(filePath, () => {});
          reject(new Error(`Failed: ${response.statusCode} ${response.statusMessage}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }
    
    makeRequest(form.url);
  });
}

// Download all forms
async function downloadAllForms() {
  console.log(`📥 Downloading ${FORMS_TO_DOWNLOAD.length} official forms...\n`);
  
  let successful = 0;
  let failed = 0;
  const failedForms = [];
  
  for (const form of FORMS_TO_DOWNLOAD) {
    try {
      await downloadForm(form);
      successful++;
      // Small delay to be nice to GOV.UK servers
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ ${form.id} failed: ${error.message}`);
      failed++;
      failedForms.push({ name: form.name, id: form.id, url: form.url });
    }
  }
  
  console.log(`\n✨ Download complete!`);
  console.log(`   ✅ Successful: ${successful}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`\nFailed forms:`);
    failedForms.forEach(form => {
      console.log(`   - ${form.name} (${form.id})`);
      console.log(`     URL: ${form.url}`);
    });
  }
  
  return { successful, failed, failedForms };
}

// Create README
function createReadme(downloadResult) {
  const successfulForms = FORMS_TO_DOWNLOAD.filter((form, idx) => 
    idx < downloadResult.successful
  );
  
  const content = `# Official UK Legal Forms

This directory contains official UK legal forms downloaded from GOV.UK and HMCTS.

## Forms Successfully Downloaded

${successfulForms.map(form => `### ${form.id} - ${form.name}
- **Path**: \`${form.path}\`
- **Source**: ${form.url}
- **Priority**: ${form.priority}
`).join('\n')}

${downloadResult.failed > 0 ? `## Forms That Failed to Download

${downloadResult.failedForms.map(form => `### ${form.id} - ${form.name}
- **URL**: ${form.url}
- **Action**: Download manually from GOV.UK
`).join('\n')}` : ''}

## Last Updated

${new Date().toISOString()}

## Important Notes

1. These forms are official government documents
2. Versions may change - check GOV.UK for latest versions quarterly
3. Some forms may have regional variations (England & Wales vs Scotland)
4. Online forms (e.g., POPLA, ACAS) are not stored here - users directed to websites

## Form Versions (as of January 2025)

- **ET1**: Version 02/24 (March 2024)
- **N1**: Version 12/24 (December 2024)
- **SSCS1**: August 2021 version
- **N244**: Version 12/24 (December 2024)
- **ET3**: Version 02/24 (March 2024)
- **N11**: Version 12/24 (December 2024)
- **N180**: Version 12/24 (December 2024)

## Usage

Forms are loaded by \`src/lib/forms/form-loader.ts\`:
1. Checks local storage first
2. Falls back to remote download if missing
3. Caches remote downloads in database

## Updating Forms

Run: \`npm run setup:forms\` to re-download all forms

## Manual Download Instructions

If automated download fails:
1. Visit https://www.gov.uk/government/publications
2. Search for the form code (e.g., "ET1", "N1")
3. Download the PDF
4. Place in the appropriate subdirectory

## Directory Structure

\`\`\`
official-forms/
├── employment/       # ET1, ET3, Schedule of Loss
├── county-court/     # N1, N11, N244, N180, etc.
├── benefits/         # SSCS1, SSCS5
├── property/         # FTT-PROP forms
├── tax/              # FTT-TAX forms
├── immigration/      # IAFT-5, Home Office forms
├── magistrates/      # MC100, plea forms
├── parking/          # POPLA, IAS appeals
└── ombudsman/        # FOS, Housing Ombudsman
\`\`\`

## PDF Field Extraction

To extract fillable field names from a PDF:
\`\`\`bash
npm run forms:extract-fields -- public/official-forms/employment/ET1-claim-form-2024.pdf
\`\`\`

## Support

For issues with forms:
- Employment Tribunal: 0300 123 1024
- County Court: 0300 123 5577
- Benefits Tribunal: 0300 123 1142
- GOV.UK: https://www.gov.uk/contact
`;

  fs.writeFileSync(path.join(BASE_DIR, 'README.md'), content);
  console.log('📝 Created comprehensive README.md');
}

// Main execution
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  DisputeHub - Official Forms Setup      ║');
  console.log('║  Updated with Verified 2024/2025 URLs   ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  // Create directory structure
  createDirectories();
  
  // Download all forms
  const result = await downloadAllForms();
  
  // Create README
  createReadme(result);
  
  console.log('\n✨ Setup complete!\n');
  console.log(`Forms stored in: ${BASE_DIR}`);
  
  if (result.successful > 0) {
    console.log('\n🎉 Successfully downloaded forms! Next steps:');
    console.log('1. Verify PDFs in public/official-forms/');
    console.log('2. Extract field names: npm run forms:extract-fields');
    console.log('3. Update field mappings in src/lib/pdf/pdf-form-filler.ts');
    console.log('4. Test form filling with a real case\n');
  }
  
  if (result.failed > 0) {
    console.log('\n⚠️  Some downloads failed (GOV.UK URLs may have changed).');
    console.log('   You can download these forms manually from GOV.UK');
    console.log('   See HOW_TO_ADD_FORMS.md for instructions\n');
  }
  
  process.exit(result.failed > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
