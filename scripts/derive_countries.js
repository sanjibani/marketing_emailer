const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tldToCountry = {
  '.qa': 'Qatar',
  '.sa': 'Saudi Arabia',
  '.ae': 'United Arab Emirates',
  '.au': 'Australia',
  '.uk': 'United Kingdom',
  '.ca': 'Canada',
  '.in': 'India',
  '.nz': 'New Zealand',
  '.us': 'United States',
  '.za': 'South Africa',
  '.ie': 'Ireland',
  '.sg': 'Singapore'
};

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      country: null
    }
  });

  console.log(`Found ${contacts.length} contacts without a country.`);
  
  let updatedCount = 0;

  for (const contact of contacts) {
    if (!contact.email) continue;
    
    // Extract the TLD from the email
    const emailParts = contact.email.split('.');
    let tld = '.' + emailParts[emailParts.length - 1].toLowerCase();
    
    // Handle double TLDs like .co.uk or .com.au
    if (emailParts.length > 2) {
       const secondToLast = emailParts[emailParts.length - 2].toLowerCase();
       if (['co', 'com', 'org', 'net', 'edu', 'gov'].includes(secondToLast)) {
          tld = '.' + secondToLast + tld; // e.g., .com.au
       }
    }

    let countryToSet = null;

    // Direct TLD match
    if (tldToCountry[tld]) {
       countryToSet = tldToCountry[tld];
    } 
    // Handle cases like .com.au -> map to .au if the full string isn't in the dict
    else if (tld.includes('.') && tldToCountry['.' + tld.split('.').pop()]) {
       countryToSet = tldToCountry['.' + tld.split('.').pop()];
    }

    // Try extracting from the source URL if email is generic
    if (!countryToSet && contact.source && contact.source.includes('http')) {
       try {
           const urlStr = contact.source.split('|')[1]?.trim() || contact.source;
           // basic hack just to check endsWith
           const urlParts = urlStr.split('/');
           const domain = urlParts[2] || urlParts[0]; // handles http://domain.com or just domain.com
           
           for (const [key, value] of Object.entries(tldToCountry)) {
               if (domain.endsWith(key)) {
                   countryToSet = value;
                   break;
               }
           }
       } catch(e) {}
    }
    
    // Look at company name as a fallback for city/country markers
    if (!countryToSet && contact.company) {
       const companyLower = contact.company.toLowerCase();
       if (companyLower.includes('qatar')) countryToSet = 'Qatar';
       else if (companyLower.includes('dubai') || companyLower.includes('uae')) countryToSet = 'United Arab Emirates';
       else if (companyLower.includes('brisbane') || companyLower.includes('perth') || companyLower.includes('sydney') || companyLower.includes('melbourne')) countryToSet = 'Australia';
       else if (companyLower.includes('chicago') || companyLower.includes('las vegas') || companyLower.includes('new york')) countryToSet = 'United States';
       else if (companyLower.includes('london') || companyLower.includes('uk')) countryToSet = 'United Kingdom';
    }


    if (countryToSet) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { country: countryToSet }
      });
      // console.log(`Updated ${contact.email} -> ${countryToSet}`);
      updatedCount++;
    }
  }

  console.log(`Successfully inferred and updated country for ${updatedCount} contacts.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
