#!/usr/bin/env node

/**
 * COMPREHENSIVE FORM SETUP - ALL UK LEGAL FORMS
 * 
 * Downloads EVERY official UK legal form for complete case coverage
 * Run: npm run setup:forms:all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// COMPREHENSIVE UK LEGAL FORMS REGISTRY
const ALL_FORMS = [
  
  // ========================================================================
  // EMPLOYMENT TRIBUNAL FORMS
  // ========================================================================
  {
    category: 'Employment Tribunal',
    id: 'ET1',
    name: 'Employment Tribunal Claim Form',
    url: 'https://assets.publishing.service.gov.uk/media/65bcbd214a666f000d1747ba/ET1_0224.pdf',
    path: 'employment/ET1-claim-form-2024.pdf',
    priority: 'CRITICAL',
    govukPage: 'https://www.gov.uk/government/publications/make-a-claim-to-an-employment-tribunal-form-et1'
  },
  {
    category: 'Employment Tribunal',
    id: 'ET3',
    name: 'Employment Tribunal Response Form',
    url: 'https://assets.publishing.service.gov.uk/media/65bcbd6c4a666f001617483b/ET3_0224.pdf',
    path: 'employment/ET3-response-form-2024.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/defend-an-employment-tribunal-claim-form-et3'
  },
  
  // ========================================================================
  // COUNTY COURT FORMS (Money Claims & General)
  // ========================================================================
  {
    category: 'County Court',
    id: 'N1',
    name: 'County Court Claim Form',
    url: 'https://assets.publishing.service.gov.uk/media/674d7ea12e91c6fb83fb5162/N1_1224.pdf',
    path: 'county-court/N1-claim-form-2024.pdf',
    priority: 'CRITICAL',
    govukPage: 'https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7'
  },
  {
    category: 'County Court',
    id: 'N9',
    name: 'Response Pack',
    url: 'https://assets.publishing.service.gov.uk/media/674d8f4d2e91c6fb83fb5168/N9_1224.pdf',
    path: 'county-court/N9-response-pack-2024.pdf',
    priority: 'HIGH'
  },
  {
    category: 'County Court',
    id: 'N11',
    name: 'Defence and Counterclaim',
    url: 'https://assets.publishing.service.gov.uk/media/674d8ac22e91c6c28afb5161/N11_1224.pdf',
    path: 'county-court/N11-defense-2024.pdf',
    priority: 'HIGH'
  },
  {
    category: 'County Court',
    id: 'N180',
    name: 'Directions Questionnaire (Small Claims)',
    url: 'https://assets.publishing.service.gov.uk/media/674d955a1d48f1a7ebfb5162/N180_1224.pdf',
    path: 'county-court/N180-directions-small-claims-2024.pdf',
    priority: 'HIGH'
  },
  {
    category: 'County Court',
    id: 'N181',
    name: 'Directions Questionnaire (Fast Track)',
    url: 'https://assets.publishing.service.gov.uk/media/674d95d12e91c6fb83fb516f/N181_1224.pdf',
    path: 'county-court/N181-directions-fast-track-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    category: 'County Court',
    id: 'N244',
    name: 'Application Notice',
    url: 'https://assets.publishing.service.gov.uk/media/674d84ce2e91c6c28afb515e/N244_1224.pdf',
    path: 'county-court/N244-application-notice-2024.pdf',
    priority: 'HIGH'
  },
  {
    category: 'County Court',
    id: 'N245',
    name: 'Application for Suspension of Warrant',
    url: 'https://assets.publishing.service.gov.uk/media/674d87712e91c6c28afb515f/N245_1224.pdf',
    path: 'county-court/N245-suspension-warrant-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    category: 'County Court',
    id: 'N260',
    name: 'Application for Warrant of Control',
    url: 'https://assets.publishing.service.gov.uk/media/674da0c51d48f1b8c1fb5165/N260_1224.pdf',
    path: 'county-court/N260-warrant-control-2024.pdf',
    priority: 'MEDIUM'
  },
  {
    category: 'County Court',
    id: 'N215',
    name: 'Certificate of Service',
    url: 'https://assets.publishing.service.gov.uk/media/674d9c2b2e91c6c28afb5170/N215_1224.pdf',
    path: 'county-court/N215-certificate-service-2024.pdf',
    priority: 'MEDIUM'
  },
  
  // ========================================================================
  // BENEFITS & SOCIAL SECURITY TRIBUNAL
  // ========================================================================
  {
    category: 'Benefits Tribunal',
    id: 'SSCS1',
    name: 'Social Security Appeal Form',
    url: 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1041651/sscs1.pdf',
    path: 'benefits/SSCS1-appeal-form-2024.pdf',
    priority: 'CRITICAL'
  },
  {
    category: 'Benefits Tribunal',
    id: 'SSCS5',
    name: 'Mandatory Reconsideration Request',
    url: 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1041652/sscs5.pdf',
    path: 'benefits/SSCS5-mandatory-reconsideration-2024.pdf',
    priority: 'HIGH'
  },
  
  // ========================================================================
  // PROPERTY TRIBUNAL (First-tier Tribunal Property Chamber)
  // ========================================================================
  {
    category: 'Property Tribunal',
    id: 'T601',
    name: 'Property Tribunal Appeal (T601)',
    url: 'https://assets.publishing.service.gov.uk/media/675ae382ec1c65c38b3965a9/T601_0425.pdf',
    path: 'property/T601-property-appeal-2025.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/form-t601-notice-of-appeal-against-a-decision-of-the-first-tier-tribunal-property-chamber-in-england-or-a-leasehold-valuation-or-residential-prope'
  },
  {
    category: 'Property Tribunal',
    id: 'T602',
    name: 'Property Tribunal Permission to Appeal (T602)',
    url: 'https://assets.publishing.service.gov.uk/media/675ae38f5b15c4b2636bf5f2/T602_0425.pdf',
    path: 'property/T602-property-permission-2025.pdf',
    priority: 'MEDIUM',
    govukPage: 'https://www.gov.uk/government/publications/form-t602-application-for-permission-to-appeal-against-a-decision-of-the-first-tier-tribunal-property-chamber-in-england-or-a-leasehold-valuation'
  },
  
  // ========================================================================
  // TAX TRIBUNAL
  // ========================================================================
  {
    category: 'Tax Tribunal',
    id: 'T240',
    name: 'Tax Tribunal Appeal Notice (T240)',
    url: 'https://assets.publishing.service.gov.uk/media/68cd2919c908572e81248a57/T240_0925.pdf',
    path: 'tax/T240-tax-appeal-2025.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/notice-of-appeal-ask-a-tax-judge-to-examine-a-dispute-form-t240'
  },
  {
    category: 'Tax Tribunal',
    id: 'T247',
    name: 'Tax Tribunal Permission to Appeal (T247)',
    url: 'https://assets.publishing.service.gov.uk/media/675ae2fc5b15c4c1c66bf5f0/T247_0425.pdf',
    path: 'tax/T247-tax-permission-2025.pdf',
    priority: 'MEDIUM',
    govukPage: 'https://www.gov.uk/government/publications/form-t247-application-for-permission-to-appeal-decision-of-the-tax-tribunal'
  },
  
  // ========================================================================
  // IMMIGRATION & ASYLUM TRIBUNAL
  // ========================================================================
  {
    category: 'Immigration',
    id: 'IAFT-1',
    name: 'Immigration & Asylum Appeal Form (IAFT-1)',
    url: 'https://assets.publishing.service.gov.uk/media/691c5f02b9226dd8e81ab89c/IAFT1_1125.pdf',
    path: 'immigration/IAFT1-immigration-appeal-2025.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/appeal-an-immigration-or-asylum-decision-form-iaft-1'
  },
  {
    category: 'Immigration',
    id: 'IAFT-2',
    name: 'Immigration Appeal Reasons (IAFT-2)',
    url: 'https://assets.publishing.service.gov.uk/media/691c5f25e39a085bda43eec9/IAFT2_1125.pdf',
    path: 'immigration/IAFT2-appeal-reasons-2025.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/reasons-for-appealing-a-home-office-decision-form-iaft-2'
  },
  {
    category: 'Immigration',
    id: 'IAFT-4',
    name: 'Immigration Tribunal Application (IAFT-4)',
    url: 'https://assets.publishing.service.gov.uk/media/691c5f3be39a085bda43eece/IAFT4_1125.pdf',
    path: 'immigration/IAFT4-tribunal-application-2025.pdf',
    priority: 'MEDIUM',
    govukPage: 'https://www.gov.uk/government/publications/make-an-application-iaft-4'
  },
  
  // ========================================================================
  // MAGISTRATES COURT
  // ========================================================================
  {
    category: 'Magistrates Court',
    id: 'MC100',
    name: 'Statement of Means (MC100)',
    url: 'https://assets.publishing.service.gov.uk/media/674da9a72e91c6c28afb5177/MC100_1224.pdf',
    path: 'magistrates/MC100-statement-means-2024.pdf',
    priority: 'MEDIUM',
    govukPage: 'https://www.gov.uk/government/publications/form-mc100-statement-of-means'
  },
  
  // ========================================================================
  // DIVORCE & FAMILY COURT
  // ========================================================================
  {
    category: 'Family Court',
    id: 'D8',
    name: 'Divorce Application (D8)',
    url: 'https://assets.publishing.service.gov.uk/media/65f9622da1f21c0011d60a09/D8_0324.pdf',
    path: 'family/D8-divorce-application-2024.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/collections/divorce-and-civil-partnership-dissolution-forms',
    note: 'Now mostly online via MyHMCTS'
  },
  {
    category: 'Family Court',
    id: 'C100',
    name: 'Child Arrangements Order (C100)',
    url: 'https://assets.publishing.service.gov.uk/media/66a772f9ab418ab055592e93/C100_0424.pdf',
    path: 'family/C100-child-arrangements-2024.pdf',
    priority: 'HIGH',
    govukPage: 'https://www.gov.uk/government/publications/form-c100-application-under-the-children-act-1989-for-a-child-arrangements-prohibited-steps-specific-issue-section-8-order-or-to-vary-or-discharge'
  },
  
  // ========================================================================
  // SMALL CLAIMS & CONSUMER
  // ========================================================================
  {
    category: 'Small Claims',
    id: 'N1-SMALL',
    name: 'Small Claims Track (under £10k)',
    url: 'SAME_AS_N1', // Uses N1 form
    path: 'county-court/N1-claim-form-2024.pdf',
    priority: 'CRITICAL'
  },
  
  // ========================================================================
  // PARKING & TRAFFIC
  // ========================================================================
  {
    category: 'Parking',
    id: 'POPLA',
    name: 'POPLA Parking Appeal',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'HIGH',
    onlineUrl: 'https://www.popla.co.uk'
  },
  {
    category: 'Parking',
    id: 'IAS',
    name: 'Independent Appeals Service',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'MEDIUM',
    onlineUrl: 'https://www.parkingandtrafficappeals.gov.uk'
  },
  {
    category: 'Traffic',
    id: 'TEC',
    name: 'Traffic Enforcement Centre Appeal',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'MEDIUM',
    onlineUrl: 'https://www.gov.uk/challenge-parking-fine'
  },
  
  // ========================================================================
  // OMBUDSMAN SERVICES
  // ========================================================================
  {
    category: 'Ombudsman',
    id: 'FOS',
    name: 'Financial Ombudsman Complaint',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'HIGH',
    onlineUrl: 'https://www.financial-ombudsman.org.uk'
  },
  {
    category: 'Ombudsman',
    id: 'HO',
    name: 'Housing Ombudsman Complaint',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'MEDIUM',
    onlineUrl: 'https://www.housing-ombudsman.org.uk'
  },
  {
    category: 'Ombudsman',
    id: 'LO',
    name: 'Local Government Ombudsman',
    url: 'ONLINE_ONLY',
    path: null,
    priority: 'MEDIUM',
    onlineUrl: 'https://www.lgo.org.uk'
  },
  
  // ========================================================================
  // CONSUMER RIGHTS
  // ========================================================================
  {
    category: 'Consumer',
    id: 'EU261',
    name: 'Flight Delay Compensation Claim',
    url: 'TEMPLATE', // We generate this
    path: null,
    priority: 'HIGH'
  },
  
  // ========================================================================
  // BUSINESS & COMMERCIAL
  // ========================================================================
  {
    category: 'Commercial Court',
    id: 'N1-CC',
    name: 'Commercial Court Claim',
    url: 'MANUAL',
    path: 'commercial/N1-CC-commercial-claim.pdf',
    priority: 'LOW'
  },
];

// Base directory
const BASE_DIR = path.join(process.cwd(), 'public', 'official-forms');

// Create comprehensive directory structure
function createDirectories() {
  const dirs = [
    'employment',
    'county-court',
    'benefits',
    'property',
    'tax',
    'immigration',
    'magistrates',
    'family',
    'parking',
    'traffic',
    'ombudsman',
    'consumer',
    'commercial',
  ];
  
  console.log('📁 Creating comprehensive directory structure...\n');
  
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

// Download a single form
function downloadForm(form) {
  return new Promise((resolve, reject) => {
    // Skip online-only forms
    if (form.url === 'ONLINE_ONLY') {
      console.log(`🌐 ${form.name} (${form.id}) - ONLINE ONLY`);
      console.log(`   URL: ${form.onlineUrl}`);
      resolve({ status: 'online-only', form });
      return;
    }
    
    // Skip manual download forms
    if (form.url === 'MANUAL') {
      console.log(`📝 ${form.name} (${form.id}) - MANUAL DOWNLOAD REQUIRED`);
      if (form.govukPage) {
        console.log(`   Page: ${form.govukPage}`);
      }
      resolve({ status: 'manual', form });
      return;
    }
    
    // Skip template forms
    if (form.url === 'TEMPLATE') {
      console.log(`📄 ${form.name} (${form.id}) - AI GENERATED TEMPLATE`);
      resolve({ status: 'template', form });
      return;
    }
    
    // Skip if uses another form
    if (form.url === 'SAME_AS_N1') {
      console.log(`🔗 ${form.name} (${form.id}) - Uses N1 form`);
      resolve({ status: 'duplicate', form });
      return;
    }
    
    const filePath = path.join(BASE_DIR, form.path);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  ${form.name} (${form.id}) - already exists`);
      resolve({ status: 'exists', form });
      return;
    }
    
    console.log(`⬇️  ${form.name} (${form.id})...`);
    
    const file = fs.createWriteStream(filePath);
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;
    
    function makeRequest(url) {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          redirectCount++;
          if (redirectCount > MAX_REDIRECTS) {
            file.close();
            fs.unlink(filePath, () => {});
            reject(new Error('Too many redirects'));
            return;
          }
          
          const redirectUrl = response.headers.location;
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
            resolve({ status: 'success', form });
          });
        } else {
          file.close();
          fs.unlink(filePath, () => {});
          reject(new Error(`${response.statusCode} ${response.statusMessage}`));
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
  console.log(`📥 Processing ${ALL_FORMS.length} UK legal forms...\n`);
  
  const results = {
    success: [],
    failed: [],
    onlineOnly: [],
    manual: [],
    template: [],
    duplicate: [],
    exists: []
  };
  
  for (const form of ALL_FORMS) {
    try {
      const result = await downloadForm(form);
      
      if (result.status === 'success') results.success.push(form);
      else if (result.status === 'online-only') results.onlineOnly.push(form);
      else if (result.status === 'manual') results.manual.push(form);
      else if (result.status === 'template') results.template.push(form);
      else if (result.status === 'duplicate') results.duplicate.push(form);
      else if (result.status === 'exists') results.exists.push(form);
      
      // Be nice to GOV.UK servers
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.failed.push(form);
    }
  }
  
  return results;
}

// Create comprehensive README
function createReadme(results) {
  const content = `# Complete UK Legal Forms Repository

This directory contains a comprehensive collection of official UK legal forms covering all major dispute types.

## 📊 Coverage Summary

- **Total Forms**: ${ALL_FORMS.length}
- **Downloaded**: ${results.success.length + results.exists.length}
- **Online Only**: ${results.onlineOnly.length}
- **Manual Download**: ${results.manual.length}
- **AI Generated**: ${results.template.length}

## ✅ Successfully Downloaded Forms

${results.success.concat(results.exists).map(f => `### ${f.id} - ${f.name}
- **Category**: ${f.category}
- **Path**: \`${f.path}\`
- **Priority**: ${f.priority}
- **Source**: ${f.url}
`).join('\n')}

## 🌐 Online-Only Forms

These forms must be completed online:

${results.onlineOnly.map(f => `### ${f.id} - ${f.name}
- **Category**: ${f.category}
- **URL**: ${f.onlineUrl}
- **Priority**: ${f.priority}
`).join('\n')}

## 📝 Forms Requiring Manual Download

${results.manual.map(f => `### ${f.id} - ${f.name}
- **Category**: ${f.category}
- **Download**: ${f.govukPage || 'Search GOV.UK'}
- **Save As**: \`${f.path}\`
`).join('\n')}

## 📄 AI-Generated Templates

These are generated by DisputeHub AI:

${results.template.map(f => `- **${f.id}**: ${f.name}`).join('\n')}

## 🔍 Coverage by Category

${Object.entries(
  ALL_FORMS.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {})
).map(([cat, count]) => `- **${cat}**: ${count} forms`).join('\n')}

## Last Updated

${new Date().toISOString()}

## Manual Download Instructions

For forms marked as MANUAL:

1. Visit the GOV.UK page listed
2. Download the PDF
3. Save to the specified path in this directory
4. Run \`npm run forms:extract-fields\` to analyze fillable fields

## Quarterly Update Process

Run quarterly to get latest form versions:

\`\`\`bash
npm run setup:forms:all
\`\`\`

## Support

For questions about specific forms:
- **Employment**: 0300 123 1024
- **County Court**: 0300 123 5577
- **Benefits**: 0300 123 1142
- **Immigration**: 0300 123 2241
- **General**: https://www.gov.uk/contact
`;

  fs.writeFileSync(path.join(BASE_DIR, 'README.md'), content);
  console.log('\n📝 Created comprehensive README.md');
}

// Main execution
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  DisputeHub - COMPLETE Forms Setup              ║');
  console.log('║  All UK Legal Forms for Every Case Type         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  createDirectories();
  
  const results = await downloadAllForms();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 DOWNLOAD SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Downloaded: ${results.success.length}`);
  console.log(`📦 Already Existed: ${results.exists.length}`);
  console.log(`🌐 Online Only: ${results.onlineOnly.length}`);
  console.log(`📝 Manual Required: ${results.manual.length}`);
  console.log(`📄 AI Templates: ${results.template.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('═'.repeat(60));
  
  createReadme(results);
  
  console.log('\n✨ Setup complete!\n');
  console.log(`Forms stored in: ${BASE_DIR}`);
  console.log(`\n🎉 You now have comprehensive UK legal form coverage!`);
  console.log(`\nNext: npm run forms:extract-fields (analyze all downloaded PDFs)\n`);
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
