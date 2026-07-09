const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runScraper(settings) {
  const { keyword, location, linkedin, indeed } = settings;
  const encodedKeyword = encodeURIComponent(keyword);
  const encodedLocation = encodeURIComponent(location);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  let allJobs = [];

  // كشط LinkedIn
  if (linkedin) {
    await page.goto(`https://www.linkedin.com/jobs/search?keywords=${encodedKeyword}&location=${encodedLocation}`);
    await page.waitForTimeout(5000);

    const linkedinJobs = await page.evaluate(() => {
      const jobCards = Array.from(document.querySelectorAll('.base-card'));
      return jobCards.map(card => {
        const titleElement = card.querySelector('.base-search-card__title');
        const companyElement = card.querySelector('.base-search-card__subtitle');
        const locationElement = card.querySelector('.job-search-card__location');
        const linkElement = card.querySelector('.base-card__full-link');
        const salaryElement = card.querySelector('.job-search-card__salary-info');

        const titleText = titleElement ? titleElement.innerText.trim() : '';
        const locText = locationElement ? locationElement.innerText.trim() : '';
        
        // فحص العنوان والموقع معاً لاكتشاف نوع العمل
        const combinedText = (titleText + ' ' + locText).toLowerCase();
        let workType = null;
        if (combinedText.includes('remote') || combinedText.includes('télétravail') || combinedText.includes('telework')) workType = 'Remote';
        else if (combinedText.includes('hybrid') || combinedText.includes('hybride')) workType = 'Hybrid';
        else if (combinedText.includes('on-site') || combinedText.includes('onsite') || combinedText.includes('présentiel')) workType = 'On-site';

        return {
          title: titleText || 'Unknown',
          company: companyElement ? companyElement.innerText.trim() : 'Unknown',
          location: locText || 'Unknown',
          url: linkElement ? linkElement.href.split('?')[0] : '',
          source: 'LinkedIn',
          work_type: workType,
          salary: salaryElement ? salaryElement.innerText.trim() : null
        };
      }).filter(job => job.url !== '');
    });
    allJobs = [...allJobs, ...linkedinJobs];
  }

  // كشط Indeed
  if (indeed) {
    await page.goto(`https://ma.indeed.com/jobs?q=${encodedKeyword}&l=${encodedLocation}`);
    await page.waitForTimeout(5000);

    const indeedJobs = await page.evaluate(() => {
      const jobCards = Array.from(document.querySelectorAll('.job_seen_beacon'));
      return jobCards.map(card => {
        const titleElement = card.querySelector('.jobTitle span');
        const companyElement = card.querySelector('[data-testid="company-name"]');
        const locationElement = card.querySelector('[data-testid="text-location"]');
        const linkElement = card.querySelector('.jcs-JobTitle');
        
        const titleText = titleElement ? titleElement.innerText.trim() : '';
        let salary = null;
        let workType = null;
        
        const metadataElements = Array.from(card.querySelectorAll('.metadata, .salary-snippet-container'));
        metadataElements.forEach(el => {
            const text = el.innerText.trim();
            if (text.includes('$') || text.includes('€') || text.includes('£') || text.includes('DH') || text.includes('MAD') || text.includes('د.م.')) {
                salary = text;
            }
        });

        // فحص كل النصوص الممكنة لنوع العمل
        const cardText = card.innerText.toLowerCase();
        if (cardText.includes('remote') || cardText.includes('télétravail') || cardText.includes('telework')) workType = 'Remote';
        else if (cardText.includes('hybrid') || cardText.includes('hybride')) workType = 'Hybrid';
        else if (cardText.includes('on-site') || cardText.includes('onsite') || cardText.includes('présentiel')) workType = 'On-site';

        let finalUrl = '';
        if (linkElement) {
          const rawHref = linkElement.getAttribute('href');
          const jkMatch = rawHref.match(/[?&]jk=([^&]+)/);
          finalUrl = (jkMatch && jkMatch[1]) ? 'https://ma.indeed.com/viewjob?jk=' + jkMatch[1] : (rawHref.startsWith('http') ? rawHref : 'https://ma.indeed.com' + rawHref);
        }

        return {
          title: titleText || 'Unknown',
          company: companyElement ? companyElement.innerText.trim() : 'Unknown',
          location: locationElement ? locationElement.innerText.trim() : 'Unknown',
          url: finalUrl,
          source: 'Indeed',
          work_type: workType,
          salary: salary
        };
      }).filter(job => job.url !== '');
    });
    allJobs = [...allJobs, ...indeedJobs];
  }

  await browser.close();

  for (const job of allJobs) {
    if (job.url) {
      await supabase.from('opportunities').upsert([job], { onConflict: 'url' });
    }
  }

  return allJobs;
}

module.exports = { runScraper };