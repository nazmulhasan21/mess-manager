const Puppeteer = require('puppeteer');
const hbs = require('handlebars');
const path = require('path');
const fs = require('fs-extra');

const compile = async function (templeteName, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templeteName}.hbs`);

  // get the html
  const html = await fs.readFile(filePath, 'utf8');
  return hbs.compile(html)(data.toObject());
};

module.exports = async (templeteName, data) => {
  const browser = await Puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const content = await compile(templeteName, data);
  await page.setContent(content);
  await page.pdf({
    path: `${data.month[data.month.length - 1].monthTitle}- ${data._id}.pdf`,
    format: 'A4',
    printBackground: true,
  });

  console.log('Done create pdf');

  await browser.close();
};
