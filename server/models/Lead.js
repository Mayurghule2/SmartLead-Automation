const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Form Data
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: /.+\@.+\..+/
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Enrichment Data
  enrichmentData: {
    companyDescription: String,
    foundedYear: String,
    employees: String,
    revenue: String,
    headquarters: String,
    aiInsights: String,
    industryAnalysis: String,
    recommendations: [String],
    enrichedAt: Date,
    sources: [String]
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'enriching', 'generating_pdf', 'sending_email', 'completed', 'failed'],
    default: 'pending'
  },
  
  // File References
  pdfPath: String,
  pdfUrl: String,
  googleDriveFileId: String,
  
  // Google Sheets
  sheetsRowId: String,
  
  // Timestamps & Logs
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  completedAt: Date,
  
  // Error Tracking
  errors: [{
    step: String,
    message: String,
    timestamp: Date
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  attempts: {
    type: Number,
    default: 0
  }
});

// Index for fast queries
leadSchema.index({ email: 1 });
leadSchema.index({ companyName: 1 });
leadSchema.index({ submittedAt: -1 });
leadSchema.index({ status: 1 });



module.exports = mongoose.model('Lead', leadSchema);