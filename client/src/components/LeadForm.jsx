import React, { useState, useEffect } from 'react';
import './LeadForm.css';

const LeadForm = () => {
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    companyName: '',
    industry: '',
    website: '',
    phone: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [leadId, setLeadId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);

  const API_URL =  'http://localhost:5000/api';

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Submitting your information...');

    try {
      const response = await fetch(`${API_URL}/leads/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setLeadId(data.leadId);
      setStatus('success');
      setMessage('✅ Thank you! Your information has been received. We\'re preparing your personalized report...');
      
      // Reset form
      setFormData({
        contactName: '',
        email: '',
        companyName: '',
        industry: '',
        website: '',
        phone: ''
      });

      // Start polling for status
      pollLeadStatus(data.leadId);

    } catch (error) {
      setStatus('error');
      setMessage(`❌ ${error.message}`);
      console.error('Form submission error:', error);
    }
  };

  // Poll for lead processing status
  const pollLeadStatus = async (id) => {
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes with 5-second intervals

    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/leads/${id}`);
        const data = await response.json();

        setProcessingStatus({
          status: data.status,
          completedAt: data.completedAt,
          pdfUrl: data.pdfUrl
        });

        if (data.status === 'completed') {
          setMessage('✅ Done! Your personalized report has been sent to your email inbox.');
          if (data.pdfUrl) {
            setMessage(prev => prev + ` <a href="${data.pdfUrl}" target="_blank">View PDF</a>`);
          }
          return;
        }

        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setMessage('⏱️ Processing is taking longer than expected. Check your email shortly.');
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    };

    poll();
  };

  return (
    <div className="lead-form-container">
      <div className="form-wrapper">
        {/* Header */}
        <div className="form-header">
          <h1>SmartLead Automation</h1>
          <p>Get a personalized, AI-powered business intelligence report</p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`status-message status-${status}`}>
            {status === 'loading' && <div className="spinner"></div>}
            <span dangerouslySetInnerHTML={{ __html: message }}></span>
          </div>
        )}

        {/* Processing Status */}
        {processingStatus && (
          <div className="processing-status">
            <div className="status-item">
              <span className={processingStatus.status === 'completed' ? 'done' : 'pending'}>
                {processingStatus.status === 'enriching' && '⏳ Researching company data...'}
                {processingStatus.status === 'generating_pdf' && '⏳ Generating report PDF...'}
                {processingStatus.status === 'sending_email' && '⏳ Sending email...'}
                {processingStatus.status === 'completed' && '✅ Completed!'}
                {processingStatus.status === 'pending' && '⏳ Preparing...'}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="lead-form">
            {/* Contact Name */}
            <div className="form-group">
              <label htmlFor="contactName">Your Name *</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="John Smith"
                required
                minLength="2"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@company.com"
                required
              />
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Corporation"
                required
                minLength="2"
              />
            </div>

            {/* Industry */}
            <div className="form-group">
              <label htmlFor="industry">Industry *</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
              >
                <option value="">Select an industry...</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Education">Education</option>
                <option value="Energy">Energy</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Website */}
            <div className="form-group">
              <label htmlFor="website">Company Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.company.com"
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Processing...' : 'Get Your Report'}
            </button>

            <p className="form-note">
              * Required fields. We'll analyze your company and send a personalized report to your email.
            </p>
          </form>
        )}

        {/* Success State */}
        {status === 'success' && !processingStatus?.status === 'completed' && (
          <div className="success-container">
            <h2>📧 Check Your Email!</h2>
            <p>Your personalized intelligence report is being prepared and will be sent shortly to:</p>
            <p className="email-display">{formData.email}</p>
            
            <div className="what-happens">
              <h3>What's Happening:</h3>
              <ol>
                <li>✅ Your information is securely stored</li>
                <li>⏳ We're researching {formData.companyName}</li>
                <li>⏳ AI is analyzing industry trends</li>
                <li>⏳ Professional report is being generated</li>
                <li>⏳ Report will be emailed to you</li>
              </ol>
            </div>

            <div className="help-section">
              <p>The report usually takes 2-5 minutes. Check your spam folder if you don't see it.</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h2>What You'll Receive</h2>
        <ul>
          <li>📊 Company Profile & Overview</li>
          <li>🤖 AI-Generated Business Insights</li>
          <li>🏢 Industry Analysis & Trends</li>
          <li>💡 Personalized Engagement Points</li>
          <li>📄 Professional PDF Report</li>
        </ul>
      </div>
    </div>
  );
};

export default LeadForm;