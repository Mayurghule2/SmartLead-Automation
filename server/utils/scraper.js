const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape company information from Wikipedia
 */
async function scrapeWikipedia(companyName) {
  try {
    // Search for company on Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(companyName)}&format=json`;
    
    const searchResponse = await axios.get(searchUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const results = searchResponse.data.query.search;
    if (results.length === 0) {
      console.log(`⚠️  No Wikipedia results for ${companyName}`);
      return null;
    }

    // Get the first result
    const pageTitle = results[0].title;
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;

    // Fetch page content
    const pageResponse = await axios.get(pageUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(pageResponse.data);

    // Extract description (first paragraph)
    const description = $('p').first().text().trim().substring(0, 300);

    // Extract infobox data
    const infoboxRows = $('table.infobox tr');
    let foundedYear = '';
    let employees = '';
    let headquarters = '';

    infoboxRows.each((i, elem) => {
      const text = $(elem).text();
      
      if (text.includes('Founded') || text.includes('Established')) {
        foundedYear = $(elem).find('td').last().text().trim();
      }
      if (text.includes('Employees') || text.includes('Staff')) {
        employees = $(elem).find('td').last().text().trim().substring(0, 50);
      }
      if (text.includes('Headquarter') || text.includes('Headquarters')) {
        headquarters = $(elem).find('td').last().text().trim();
      }
    });

    console.log(`✅ Wikipedia data scraped for ${companyName}`);

    return {
      description: description || '',
      foundedYear: foundedYear || '',
      employees: employees || '',
      headquarters: headquarters || '',
      source: 'Wikipedia'
    };

  } catch (error) {
    console.error(`⚠️  Wikipedia scraping error for ${companyName}:`, error.message);
    return null;
  }
}

/**
 * Scrape company data from website (limited scraping)
 */
async function scrapeWebsite(url) {
  try {
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Extract text from common company info sections
    const aboutText = $('h2:contains("About"), h2:contains("Who"), h2:contains("Company")')
      .next('p')
      .text()
      .trim()
      .substring(0, 300);

    // Extract contact info hints
    const email = response.data.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '';

    console.log(`✅ Website scraped: ${url}`);

    return {
      metaDescription,
      aboutText,
      email,
      source: 'Website'
    };

  } catch (error) {
    console.error(`⚠️  Website scraping error for ${url}:`, error.message);
    return null;
  }
}

/**
 * Simulate LinkedIn scraping (using public data search)
 * Note: Actual LinkedIn scraping is against their ToS
 * This uses alternative public sources
 */
async function scrapeLinkedIn(companyWebsite) {
  try {
    // Use Clearbit (has free tier) or similar public APIs
    // For now, return placeholder
    console.log(`🔍 Searching public company data...`);
    
    // In production, you could use:
    // - Clearbit API (free tier available)
    // - Hunter.io API (free tier)
    // - Public search engines
    
    return {
      employees: 'Data sourced from public information',
      revenue: 'Revenue data not publicly available',
      source: 'Public Data'
    };

  } catch (error) {
    console.error(`⚠️  Public data search error:`, error.message);
    return null;
  }
}

/**
 * Safe scraper with rate limiting
 */
async function safeScrape(url, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await scrapeWebsite(url);
    } catch (error) {
      lastError = error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  console.error(`⚠️  Safe scrape failed after ${maxRetries} attempts:`, lastError.message);
  return null;
}

module.exports = {
  scrapeWikipedia,
  scrapeWebsite,
  scrapeLinkedIn,
  safeScrape
};