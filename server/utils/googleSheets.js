const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

/**
 * Log lead information to Google Sheet
 */
async function logToSheets(lead) {
  try {
    // Initialize auth
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    // Load spreadsheet
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      serviceAccountAuth
    );

    await doc.loadInfo();

    // Get or create worksheet
    let sheet = doc.sheetsByTitle['Leads'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Leads' });
      
      // Add headers
      await sheet.setHeaderRow([
        'Timestamp',
        'Lead ID',
        'Contact Name',
        'Email',
        'Company Name',
        'Industry',
        'Website',
        'Status',
        'PDF URL',
        'Submitted At',
        'Completed At'
      ]);
    }

    // Add row
    const row = await sheet.addRow({
      'Timestamp': new Date().toISOString(),
      'Lead ID': lead._id.toString(),
      'Contact Name': lead.contactName,
      'Email': lead.email,
      'Company Name': lead.companyName,
      'Industry': lead.industry,
      'Website': lead.website || 'N/A',
      'Status': lead.status,
      'PDF URL': lead.pdfUrl || 'Pending',
      'Submitted At': lead.submittedAt.toISOString(),
      'Completed At': lead.completedAt ? lead.completedAt.toISOString() : 'Pending'
    });

    console.log(`✅ Lead logged to Google Sheets: ${lead.email}`);

    return {
      success: true,
      rowId: row.rowNumber,
      sheetTitle: sheet.title
    };

  } catch (error) {
    console.error('❌ Google Sheets logging error:', error);
    throw error;
  }
}

/**
 * Update lead status in Google Sheet
 */
async function updateLeadStatus(leadId, newStatus) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      serviceAccountAuth
    );

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Leads'];

    if (!sheet) {
      throw new Error('Leads sheet not found');
    }

    const rows = await sheet.getRows();
    const targetRow = rows.find(row => row['Lead ID'] === leadId.toString());

    if (targetRow) {
      targetRow['Status'] = newStatus;
      await targetRow.save();
      console.log(`✅ Updated sheet status for ${leadId}`);
    }

  } catch (error) {
    console.error('❌ Google Sheets update error:', error);
    throw error;
  }
}

/**
 * Get all leads from Google Sheet
 */
async function getLeadsFromSheets() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      serviceAccountAuth
    );

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Leads'];

    if (!sheet) {
      throw new Error('Leads sheet not found');
    }

    const rows = await sheet.getRows();
    console.log(`✅ Retrieved ${rows.length} leads from Google Sheets`);

    return rows.map(row => ({
      leadId: row['Lead ID'],
      email: row['Email'],
      companyName: row['Company Name'],
      status: row['Status'],
      timestamp: row['Timestamp']
    }));

  } catch (error) {
    console.error('❌ Google Sheets read error:', error);
    throw error;
  }
}

module.exports = {
  logToSheets,
  updateLeadStatus,
  getLeadsFromSheets
};