// server/services/emailService.js (Gmail version - works for any recipient)
const nodemailer = require('nodemailer');
const fs = require('fs');

async function sendEmail(lead) {
  try {
    console.log(`📧 Preparing email for: ${lead.email}`);
    
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail transporter ready');

    // Read PDF
    const pdfBuffer = fs.readFileSync(lead.pdfPath);

    const mailOptions = {
      from: `"Lead Intake Automation" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: `${lead.companyName} - Personalized Business Intelligence Report`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #2C3E50;">Hello ${lead.contactName}! 👋</h1>
          <p>Thank you for your interest in SmartLead Automation. We've prepared a comprehensive intelligence report for <strong>${lead.companyName}</strong>.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📊 Report Includes:</h3>
            <ul>
              <li>Company Overview & Digital Presence</li>
              <li>Industry-specific Insights</li>
              <li>Performance Scorecard</li>
              <li>Actionable Recommendations</li>
            </ul>
          </div>
          <p>Please find your detailed report attached to this email.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">This is an automated analysis from SmartLead Automation.</p>
        </div>
      `,
      attachments: [{
        filename: `${lead.companyName.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${lead.email}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };