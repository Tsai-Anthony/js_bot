const { Client } = require('discord.js');
const puppeteer = require('puppeteer');

const TOKEN = 'token';
const JOB_SEARCH_URL = 'https://www.indeed.com/jobs';

const bot = new Client();

bot.once('ready', () => {
  console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('message', async (message) => {
  if (message.content.startsWith('!scrape_jobs')) {
    const args = message.content.split(' ');
    if (args.length < 2) {
      message.reply('Usage: !scrape_jobs job_title');
      return;
    }

    const jobTitle = args.slice(1).join(' ');

    try {
      const jobListings = await scrapeIndeedJobs(jobTitle);
      if (jobListings.length > 0) {
        let jobInfo = '';
        jobListings.forEach((job, index) => {
          jobInfo += `\n**${index + 1}. Title:** ${job.title}\n**Location:** ${job.location}\n**Link:** ${job.link}`;
        });
        message.reply(jobInfo);
      } else {
        message.reply('No jobs found for the given search.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      message.reply('An error occurred while scraping jobs.');
    }
  }
});

async function scrapeIndeedJobs(jobTitle) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`${JOB_SEARCH_URL}?q=${encodeURIComponent(jobTitle)}`);
  await page.waitForSelector('.jobsearch-SerpJobCard');

  const jobListings = await page.evaluate(() => {
    const listings = [];
    document.querySelectorAll('.jobsearch-SerpJobCard').forEach((listing) => {
      const title = listing.querySelector('.title > a').innerText.trim();
      const location = listing.querySelector('.location').innerText.trim();
      const link = 'https://www.indeed.com' + listing.querySelector('.title > a').getAttribute('href');
      listings.push({ title, location, link });
    });
    return listings;
  });

  await browser.close();
  return jobListings;
}

bot.login(TOKEN);
