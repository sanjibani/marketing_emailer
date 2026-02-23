const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const revisedTemplates = [
  {
    name: "AI Agents for Healthcare Clinics",
    subject: "Managing front-desk volume at {{company}}",
    body: "Hi {{name}},\n\nI noticed {{company}} has been growing. Many clinic managers tell us that handling patient inquiries, appointment scheduling, and front-desk FAQs takes up too much administrative time.\n\nWe build custom AI voice agents and quick SaaS portals specifically for healthcare. Our AI agents are HIPAA/PIPEDA compliant, can answer calls 24/7, book appointments seamlessly, and answer common questions—ensuring patients are served immediately.\n\nCould we arrange a 5-minute chat next week to see a live demo of how we could streamline {{company}}'s patient onboarding?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nIf you prefer not to receive these emails, please reply with 'Opt-out' and I'll remove you from my list immediately."
  },
  {
    name: "Workflow Automation for Law Firms",
    subject: "Client intake automation for {{company}}",
    body: "Hi {{name}},\n\nMany law firms like {{company}} lose valuable billable hours to repetitive client intake and file sorting.\n\nMy team specializes in rapid full-stack application development and secure AI automation for legal practices. We build custom portals that automatically categorize client queries, draft preliminary intake documents, and route them to the appropriate team member, saving hours of administrative work.\n\nDo you have a few minutes next week to see a brief demo of how this could optimize your team's workflow?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nReply 'Opt-out' to unsubscribe from future outreach."
  },
  {
    name: "Lead Qualification for Real Estate",
    subject: "Automated response for {{company}}'s incoming leads",
    body: "Hi {{name}},\n\nIn real estate, speed to lead is critical. When prospective buyers or sellers contact {{company}}, reaching out instantly can significantly impact conversion.\n\nWe deploy AI voice agents and custom CRM integrations for brokerages. Our AI can instantly call new web leads 24/7, qualify their buying timeline and budget, and seamlessly hand off the prepared leads to your human agents.\n\nAre you open to exploring how an AI agent could support your team's response time?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nTo opt out of future emails, please reply 'Unsubscribe'."
  },
  {
    name: "Field Service Automation for Trade Businesses",
    subject: "Stop missing calls while on site",
    body: "Hey {{name}},\n\nI know you're busy, so I'll be brief. Missing calls while you or your team are on the tools can cost {{company}} thousands in lost jobs.\n\nWe build AI voice agents that pick up your phone 24/7, quote standard jobs, and dispatch text alerts to your crew. We also spin up custom field-management dashboards to keep everything organized.\n\nWorth a 5-minute chat to see a live demo of the AI answering a mock customer call?\n\nCheers,\nSanjibani\n\n--\nSanjibani \nColdReach AI | 123 Business Rd, Tech City, TX 75001\n\nReply 'Opt-out' to stop receiving these emails."
  },
  {
    name: "AI Reservations for F&B",
    subject: "Automate {{company}}'s reservations & take-out",
    body: "Hi {{name}},\n\nManaging the rush hour at {{company}} while the phone keeps ringing is a common bottleneck that ties up your staff.\n\nMy team builds AI Voice Agents specifically for restaurants to handle complex bookings, modify reservations, and take basic orders entirely over the phone. We also build fast-loading, custom ordering sites to reduce standard delivery app fees.\n\nDo you have 5 minutes next week to see how this cuts down on staffing stress during peak hours?\n\nBest,\nSanjibani\n\n--\nSanjibani \nColdReach AI | 123 Business Rd, Tech City, TX 75001\n\nReply 'Unsubscribe' if you wish to opt out."
  },
  {
    name: "Logistics & Fleet Tracking Dashboards",
    subject: "Streamlined tracking portals for {{company}}",
    body: "Hi {{name}},\n\nKeeping clients updated manually about fleet locations wastes countless hours of dispatch coordination.\n\nWe help logistics companies like {{company}} by building custom tracking portals that integrate smoothly with your existing ERPs and fleet management software. We also deploy AI agents that can instantly provide status updates to clients calling in, reading directly from your database.\n\nWould you be open to a brief chat about streamlining your client communication?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nTo opt out of future communication, simply reply 'Opt-out'."
  },
  {
    name: "Agency Client Portals & Automation",
    subject: "Scaling {{company}}'s client reporting",
    body: "Hi {{name}},\n\nIf {{company}} is spending too much time manually pulling reports and answering client status emails, we can help.\n\nWe specialize in rapid SaaS development for agencies—building white-labeled client dashboards that auto-sync with your ad platforms. We also build internal AI agents that can rapidly assemble reporting data, saving your account managers hours each week.\n\nAre you open to a 5-minute chat to see how we can automate your agency's backend reporting?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nReply 'Opt-out' to remove yourself from my contact list."
  },
  {
    name: "AI Customer Support for Retail",
    subject: "Managing customer inquiries at {{company}}",
    body: "Hi {{name}},\n\nHandling repetitive customer questions about stock availability, store hours, and return policies takes significant time away from the floor.\n\nTo help {{company}} manage this efficiently, we build intelligent AI Voice and Text agents that integrate with your existing inventory systems. Customers get instant, accurate answers 24/7. We also provide custom SaaS solutions to bridge your offline POS with online storefronts.\n\nCan I show you a demo of our AI agent answering common retail questions next week?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nPlease reply 'Unsubscribe' if you do not wish to receive further emails."
  },
  {
    name: "E-Commerce Support & Automation",
    subject: "Handling {{company}}'s support tickets 24/7",
    body: "Hi {{name}},\n\nFor growing e-commerce brands like {{company}}, a high volume of support tickets about \"where is my order\" (WISMO) or returns can drain resources.\n\nMy team develops advanced AI support agents that resolve up to 70% of common e-commerce tickets instantly by plugging directly into Shopify or WooCommerce. Beyond that, we build custom full-stack web apps for highly personalized shopping experiences.\n\nWould you be free for a short discovery call next week to see a live example?\n\nBest,\nSanjibani\n\n--\nSanjibani Choudhury | ColdReach AI\n123 Business Rd, Tech City, TX 75001\n\nReply 'Opt-out' to be removed from this mailing list."
  }
];

async function main() {
  for (const t of revisedTemplates) {
    const updated = await prisma.template.updateMany({
      where: { name: t.name },
      data: { subject: t.subject, body: t.body }
    });
    console.log(`Updated ${updated.count} templates for ${t.name}`);
  }
  console.log("Templates updated successfully with compliance features!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
