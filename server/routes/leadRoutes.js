const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { processlead } = require('../controllers/leadController');
const { validateLead } = require('../utils/validator');

// Submit new lead
router.post('/submit', validateLead, async (req, res) => {
  try {
    const { contactName, email, companyName, industry, website, phone } = req.body;

    // Check for duplicate recent submissions
    const existingLead = await Lead.findOne({ 
      email, 
      submittedAt: { $gt: new Date(Date.now() - 3600000) } // Last 1 hour
    });
    
    if (existingLead) {
      return res.status(400).json({ 
        error: 'Lead already submitted in the last hour' 
      });
    }

    // Create new lead
    const lead = new Lead({
      contactName,
      email,
      companyName,
      industry,
      website: website || '',
      phone: phone || '',
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await lead.save();
    console.log(`✅ Lead created: ${email} - ${companyName}`);

    // Start processing asynchronously
    processlead(lead._id).catch(err => {
      console.error(`❌ Processing error for lead ${lead._id}:`, err);
    });

    res.status(201).json({
      message: 'Lead received and processing started',
      leadId: lead._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Lead submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get lead status
router.get('/:leadId', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      leadId: lead._id,
      status: lead.status,
      completedAt: lead.completedAt,
      pdfUrl: lead.pdfUrl,
      errors: lead.errors,
      submittedAt: lead.submittedAt
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all leads (admin)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    
    const leads = await Lead.find()
      .select('-enrichmentData.aiInsights') // Don't send large text
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await Lead.countDocuments();

    res.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry failed lead
router.post('/:leadId/retry', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (lead.attempts >= 3) {
      return res.status(400).json({ error: 'Maximum retry attempts exceeded' });
    }

    lead.status = 'pending';
    lead.attempts += 1;
    lead.errors = [];
    await lead.save();

    // Restart processing
    processlead(lead._id).catch(err => {
      console.error(`❌ Retry processing error:`, err);
    });

    res.json({ message: 'Retry started', leadId: lead._id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;