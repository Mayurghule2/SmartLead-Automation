// server/services/enrichmentService.js
const axios = require('axios');

async function enrichCompanyData(lead) {
  console.log(`🤖 Generating comprehensive AI report for ${lead.companyName}...`);
  
  const enriched = {
    // Basic Info
    companyDescription: '',
    foundedYear: '',
    founderName: '',
    headquarters: '',
    employeeCount: '',
    revenueRange: '',
    
    // Company Profile
    companyOverview: '',
    missionStatement: '',
    coreProducts: [],
    targetMarket: '',
    
    // Digital Presence
    technologies: [],
    socialLinks: {},
    website: lead.website || 'Not provided',
    
    // AI Insights
    aiInsights: '',
    industryAnalysis: '',
    recommendations: [],
    
    // Metadata
    enrichedAt: new Date(),
    sources: ['Groq AI']
  };

  try {
    // Generate complete company profile using AI
    const aiReport = await generateComprehensiveAIReport(lead);
    
    // Populate all fields
    enriched.companyDescription = aiReport.companyDescription;
    enriched.companyOverview = aiReport.companyOverview;
    enriched.foundedYear = aiReport.foundedYear;
    enriched.founderName = aiReport.founderName;
    enriched.headquarters = aiReport.headquarters;
    enriched.employeeCount = aiReport.employeeCount;
    enriched.revenueRange = aiReport.revenueRange;
    enriched.missionStatement = aiReport.missionStatement;
    enriched.coreProducts = aiReport.coreProducts;
    enriched.targetMarket = aiReport.targetMarket;
    enriched.aiInsights = aiReport.aiInsights;
    enriched.industryAnalysis = aiReport.industryAnalysis;
    enriched.recommendations = aiReport.recommendations;
    
    console.log(`✅ Complete report generated for ${lead.companyName}`);
    return enriched;
    
  } catch (error) {
    console.error('❌ AI enrichment error:', error);
    return getFallbackComprehensiveReport(lead);
  }
}

/**
 * Generate comprehensive report with ALL required data points
 */
async function generateComprehensiveAIReport(lead) {
  const prompt = `
You are a senior business analyst at SmartLead Automation. Create a DETAILED, PROFESSIONAL business report for ${lead.companyName} in the ${lead.industry} industry.

CRITICAL: Respond with ONLY valid JSON. No markdown, no extra text, no explanations.

Generate realistic, professional data. Be specific and detailed. Use actual company knowledge if it's a real company, or create plausible data if it's hypothetical.

Return EXACTLY this JSON structure (use realistic data):

{
  "companyDescription": "A detailed 2-3 sentence description of what the company does",
  "companyOverview": "A comprehensive 3-4 sentence overview including market position, key differentiators, and business model",
  "foundedYear": "YYYY",
  "founderName": "Name of founder(s)",
  "headquarters": "City, Country",
  "employeeCount": "Number (e.g., 500-1000, 5000+)",
  "revenueRange": "e.g., $10M-$50M, $100M-$500M",
  "missionStatement": "Company mission or vision statement",
  "coreProducts": ["Product 1", "Product 2", "Product 3"],
  "targetMarket": "Description of primary customers/market",
  "aiInsights": "3-4 sentence executive summary about market position, strengths, and opportunities",
  "industryAnalysis": "3-4 sentence analysis of ${lead.industry} industry trends, challenges, and opportunities",
  "recommendations": ["Specific actionable recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"]
}

Make this sound professional, insightful, and tailored to ${lead.companyName} in the ${lead.industry} sector.`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a professional business analyst. Always respond with valid JSON only. Use realistic, specific data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      companyDescription: parsed.companyDescription || generateDefaultDescription(lead),
      companyOverview: parsed.companyOverview || generateDefaultOverview(lead),
      foundedYear: parsed.foundedYear || 'Information pending',
      founderName: parsed.founderName || 'Information pending',
      headquarters: parsed.headquarters || 'Information pending',
      employeeCount: parsed.employeeCount || 'Information pending',
      revenueRange: parsed.revenueRange || 'Information pending',
      missionStatement: parsed.missionStatement || generateDefaultMission(lead),
      coreProducts: Array.isArray(parsed.coreProducts) ? parsed.coreProducts : generateDefaultProducts(lead),
      targetMarket: parsed.targetMarket || generateDefaultMarket(lead),
      aiInsights: parsed.aiInsights || generateDefaultInsights(lead),
      industryAnalysis: parsed.industryAnalysis || generateDefaultIndustryAnalysis(lead),
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : generateDefaultRecommendations(lead)
    };
    
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    return getFallbackComprehensiveReport(lead);
  }
}

// Fallback functions with realistic data
function generateDefaultDescription(lead) {
  return `${lead.companyName} is a leading innovator in the ${lead.industry} sector, dedicated to delivering cutting-edge solutions that drive business growth and operational efficiency. The company combines industry expertise with technological innovation to serve a diverse client portfolio.`;
}

function generateDefaultOverview(lead) {
  return `${lead.companyName} has established itself as a key player in the ${lead.industry} market, known for its customer-centric approach and innovative product portfolio. The company differentiates itself through advanced technology integration, exceptional service delivery, and strategic partnerships. Their business model focuses on sustainable growth and long-term client relationships, positioning them well for future expansion.`;
}

function generateDefaultMission(lead) {
  return `To empower businesses in the ${lead.industry} sector with innovative solutions that drive growth, efficiency, and competitive advantage.`;
}

function generateDefaultProducts(lead) {
  return [
    `Core ${lead.industry} Platform`,
    'Analytics & Insights Suite',
    'Enterprise Integration Solutions'
  ];
}

function generateDefaultMarket(lead) {
  return `Mid to large enterprises in the ${lead.industry} sector looking for digital transformation and operational efficiency solutions.`;
}

function generateDefaultInsights(lead) {
  return `${lead.companyName} demonstrates strong potential in the ${lead.industry} market with their innovative approach and customer-focused strategy. Their market position suggests opportunities for expansion through strategic partnerships and technology adoption. Key strengths include their adaptable business model and focus on emerging trends.`;
}

function generateDefaultIndustryAnalysis(lead) {
  return `The ${lead.industry} industry is experiencing rapid transformation driven by digital adoption, AI integration, and changing customer expectations. Companies are increasingly investing in automation, data analytics, and personalized solutions. Key challenges include maintaining competitive differentiation and adapting to regulatory changes. Organizations embracing innovation are seeing improved market share and customer loyalty.`;
}

function generateDefaultRecommendations(lead) {
  return [
    `Schedule a strategic workshop to explore ${lead.companyName}'s specific ${lead.industry} challenges and objectives`,
    `Provide a customized solution demo highlighting relevant use cases for their target market`,
    `Develop a phased implementation roadmap focusing on quick wins and long-term transformation`,
    `Establish a joint innovation partnership to co-create industry-specific solutions`
  ];
}

function getFallbackComprehensiveReport(lead) {
  return {
    companyDescription: generateDefaultDescription(lead),
    companyOverview: generateDefaultOverview(lead),
    foundedYear: 'Information pending',
    founderName: 'Information pending',
    headquarters: 'Information pending',
    employeeCount: 'Information pending',
    revenueRange: 'Information pending',
    missionStatement: generateDefaultMission(lead),
    coreProducts: generateDefaultProducts(lead),
    targetMarket: generateDefaultMarket(lead),
    aiInsights: generateDefaultInsights(lead),
    industryAnalysis: generateDefaultIndustryAnalysis(lead),
    recommendations: generateDefaultRecommendations(lead)
  };
}

module.exports = { enrichCompanyData };