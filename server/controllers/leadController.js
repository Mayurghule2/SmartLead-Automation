const Lead = require('../models/Lead');
const { enrichCompanyData } = require('./enrichment');
const { generatePDF } = require('./pdfGenerator');
const { sendEmail } = require('./email');
const { logToSheets } = require('../utils/googleSheets');

/**
 * Main workflow orchestrator
 * Handles: enrichment → PDF generation → email → sheets logging → drive archiving
 */
async function processlead(leadId) {
  const lead = await Lead.findById(leadId);
  
  if (!lead) {
    console.error(`Lead ${leadId} not found`);
    return;
  }

  try {
    // Step 1: Enrich company data
    console.log(`⏳ Enriching data for ${lead.companyName}...`);
    lead.status = 'enriching';
    await lead.save();

    const enrichedData = await enrichCompanyData(lead);
    lead.enrichmentData = enrichedData;

    // Step 2: Generate PDF
    console.log(`⏳ Generating PDF for ${lead.companyName}...`);
    lead.status = 'generating_pdf';
    await lead.save();

    const pdfPath = await generatePDF(lead);
    lead.pdfPath = pdfPath;

    // Step 3: Send email
    console.log(`⏳ Sending email to ${lead.email}...`);
    lead.status = 'sending_email';
    await lead.save();

    const emailResult = await sendEmail(lead);
    
    if (emailResult.success) {
      console.log(`✅ Email sent to ${lead.email}`);
    } else {
      throw new Error(`Email send failed: ${emailResult.error}`);
    }

    // Step 4: Log to Google Sheets
    console.log(`⏳ Logging to Google Sheets...`);
    try {
      const sheetsResult = await logToSheets(lead);
      lead.sheetsRowId = sheetsResult.rowId;
    } catch (sheetsError) {
      console.warn(`⚠️  Google Sheets logging failed (non-critical):`, sheetsError.message);
      lead.errors.push({
        step: 'sheets_logging',
        message: sheetsError.message,
        timestamp: new Date()
      });
    }

    // Step 5: Archive PDF to Google Drive
    console.log(`⏳ Archiving PDF to Google Drive...`);
    try {
      const driveResult = await archiveToDrive(lead);
      lead.googleDriveFileId = driveResult.fileId;
      lead.pdfUrl = driveResult.webViewLink;
    } catch (driveError) {
      console.warn(`⚠️  Google Drive archiving failed (non-critical):`, driveError.message);
      lead.errors.push({
        step: 'drive_archiving',
        message: driveError.message,
        timestamp: new Date()
      });
    }

    // Mark as completed
    lead.status = 'completed';
    lead.processedAt = new Date();
    await lead.save();

    console.log(`✅ Lead processing completed for ${lead.companyName}`);
    return { success: true, leadId };

  } catch (error) {
    console.error(`❌ Lead processing failed for ${leadId}:`, error);
    
    lead.status = 'failed';
    lead.errors.push({
      step: 'processing',
      message: error.message,
      timestamp: new Date()
    });
    lead.processedAt = new Date();
    
    await lead.save();
    
    return { success: false, error: error.message };
  }
}

/**
 * Archive PDF to Google Drive
 */
async function archiveToDrive(lead) {
  const { GoogleAuth } = require('google-auth-library');
  const { google } = require('googleapis');
  const fs = require('fs');
  const path = require('path');

  try {
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    // Read PDF file
    const filePath = lead.pdfPath;
    const fileStream = fs.createReadStream(filePath);

    // Upload to Drive
    const response = await drive.files.create({
      requestBody: {
        name: `${lead.companyName}_Report_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: 'application/pdf',
        body: fileStream
      },
      fields: 'id, webViewLink'
    });

    console.log(`✅ PDF archived to Google Drive: ${response.data.id}`);

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink
    };

  } catch (error) {
    console.error('❌ Google Drive archiving error:', error);
    throw error;
  }
}

module.exports = {
  processlead,
  archiveToDrive
};