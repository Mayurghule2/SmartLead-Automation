/**
 * Validation middleware and functions
 */

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 7;
}

function validateUrl(url) {
  if (!url) return true; // Optional field
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Express middleware for lead validation
 */
function validateLead(req, res, next) {
  const { contactName, email, companyName, industry, website, phone } = req.body;

  const errors = [];

  // Required fields
  if (!contactName || contactName.trim().length < 2) {
    errors.push('Contact name is required (min 2 characters)');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!companyName || companyName.trim().length < 2) {
    errors.push('Company name is required (min 2 characters)');
  }

  if (!industry || industry.trim().length < 2) {
    errors.push('Industry is required');
  }

  // Optional fields validation
  if (website && !validateUrl(website)) {
    errors.push('Website URL is invalid');
  }

  if (phone && !validatePhone(phone)) {
    errors.push('Phone number format is invalid');
  }

  // Check for spam
  if (containsSpam(contactName) || containsSpam(companyName)) {
    errors.push('Invalid input detected');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
}

/**
 * Basic spam/XSS detection
 */
function containsSpam(text) {
  const spamPatterns = [
    /<script/i,
    /javascript:/i,
    /onclick=/i,
    /onerror=/i,
    /eval\(/i,
    /exec\(/i
  ];

  return spamPatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize input
 */
function sanitizeInput(text) {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 200); // Limit length
}

/**
 * Validate lead enrichment data
 */
function validateEnrichmentData(data) {
  return {
    companyDescription: (data.companyDescription || '').substring(0, 1000),
    foundedYear: (data.foundedYear || '').substring(0, 50),
    employees: (data.employees || '').substring(0, 50),
    revenue: (data.revenue || '').substring(0, 50),
    headquarters: (data.headquarters || '').substring(0, 100),
    aiInsights: (data.aiInsights || '').substring(0, 2000),
    industryAnalysis: (data.industryAnalysis || '').substring(0, 2000),
    recommendations: Array.isArray(data.recommendations) 
      ? data.recommendations.slice(0, 5).map(r => r.substring(0, 200))
      : [],
    sources: Array.isArray(data.sources) ? data.sources.slice(0, 10) : []
  };
}

module.exports = {
  validateLead,
  validateEmail,
  validatePhone,
  validateUrl,
  sanitizeInput,
  validateEnrichmentData,
  containsSpam
};