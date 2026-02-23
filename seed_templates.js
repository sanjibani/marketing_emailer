const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templates = [
  {
    name: "AI Agents for Healthcare Clinics",
    subject: "Missed calls = missed patients, {{name}}?",
    body: "Hi {{name}},\n\nI noticed {{company}} has been growing, but handling patient inquiries, appointment scheduling, and front-desk FAQs can take up a lot of administrative time.\n\nWe build custom AI voice agents and quick SaaS portals specifically for healthcare clinics. Our AI agents can answer calls 24/7, book appointments directly into your calendar, and answer common questions about services and insurance, ensuring zero missed opportunities.\n\nWould you be open to a quick 5-minute chat next week to see a live demo of how we could automate {{company}}'s patient onboarding?\n\nBest,\nSanjibani",
  },
  {
    name: "Workflow Automation for Law Firms",
    subject: "Streamlining case intake at {{company}}",
    body: "Hi {{name}},\n\nLaw firms like {{company}} often lose billable hours to repetitive client intake and document sorting. \n\nMy team specializes in rapid full-stack application development and AI automation for legal practices. We can implement a smart custom SaaS portal that automatically categorizes client queries, drafts preliminary intake documents using AI, and routes them to the right attorney.\n\nDo you have 10 minutes next week to see how this could save your team dozens of non-billable hours each week?\n\nBest,\nSanjibani",
  },
  {
    name: "Lead Qualification for Real Estate",
    subject: "AI Voice Agents for {{company}}'s incoming leads",
    body: "Hi {{name}},\n\nIn real estate, speed to lead is everything. When prospective buyers or sellers contact {{company}}, reaching out instantly can make or break the deal.\n\nWe deploy AI voice agents and custom CRM integrations for brokerages. Our AI can instantly call new web leads 24/7, qualify their buying timeline and budget, and seamlessly hand off the hot leads to your human agents.\n\nAre you open to exploring how an AI outbound/inbound agent could increase your conversion rate?\n\nBest,\nSanjibani",
  }
];

async function main() {
  for (const t of templates) {
    await prisma.template.create({ data: t });
  }
  console.log("Templates seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
