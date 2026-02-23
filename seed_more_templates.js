const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templates = [
    {
        name: "Field Service Automation for Trade Businesses",
        subject: "Stop missing jobs while on site, {{name}}",
        body: "Hey {{name}},\n\nI run an automation agency helping trades like {{company}} scale faster. We noticed plumbing, HVAC, and electrical businesses often miss calls while on the tools, costing thousands in lost jobs.\n\nWe build AI voice agents that pick up your phone 24/7, quote standard jobs, and dispatch text alerts to your crew. Plus, we can spin up custom field-management SaaS dashboards quicker than you'd expect.\n\nCould we jump on a 5-minute call to show you a live demo of the AI answering a mock customer call?\n\nCheers,\nSanjibani",
    },
    {
        name: "AI Reservations for F&B",
        subject: "Automate {{company}}'s reservations & take-out",
        body: "Hi {{name}},\n\nManaging the rush hour at {{company}} while the phone keeps ringing for reservations or takeout orders is a classic bottleneck in hospitality.\n\nMy team builds AI Voice Agents specifically for restaurants and cafes. Our AI can handle complex bookings, modify reservations, and take food orders entirely over the phone without staff intervention. We also build custom fast-loading, mobile-first ordering sites.\n\nDo you have 10 minutes next week to see how this cuts down on staffing stress during peak hours?\n\nBest,\nSanjibani",
    },
    {
        name: "Logistics & Fleet Tracking Dashboards",
        subject: "Custom tracking SaaS for {{company}}",
        body: "Hi {{name}},\n\nIn logistics, keeping clients updated manually about fleet locations and shipment statuses wastes countless hours of dispatch coordination.\n\nWe help logistics companies like {{company}} by building custom full-stack tracking portals and automated notification systems. We also deploy AI agents that can instantly provide status updates to clients calling in, reading directly from your database.\n\nWould you be open to a brief chat about streamlining your client communication?\n\nBest,\nSanjibani",
    },
    {
        name: "Agency Client Portals & Automation",
        subject: "Scaling {{company}}'s client reporting with AI",
        body: "Hi {{name}},\n\nAs a marketing agency, {{company}} likely spends a massive chunk of time manually pulling reports, onboarding clients, and answering status emails.\n\nWe specialize in rapid SaaS development for agencies—building white-labeled client dashboards that auto-sync with your ad platforms. We also build internal AI agents that can rapidly generate copy flows and analyze campaign data on the fly.\n\nAre you open to a 5-minute chat to see how we can automate your agency's backend?\n\nBest,\nSanjibani",
    },
    {
        name: "AI Customer Support for Retail",
        subject: "Never miss a customer inquiry at {{company}}",
        body: "Hi {{name}},\n\nRetail chains face a massive volume of repetitive customer questions—stock availability, store hours, and return policies.\n\nTo help {{company}} handle this without expanding headcount, we build intelligent AI Voice and Text agents integrated with your existing inventory systems. Customers get instant, accurate answers 24/7. We also provide full-stack SaaS solutions to seamlessly bridge your offline point-of-sale with your online storefronts.\n\nCan I show you a demo of our AI agent answering common retail questions?\n\nBest,\nSanjibani",
    },
    {
        name: "E-Commerce Support & Automation",
        subject: "Handling {{company}}'s support tickets 24/7",
        body: "Hi {{name}},\n\nFor growing e-commerce brands like {{company}}, skyrocketing support tickets about \"where is my order\" (WISMO) or returns can kill profitability.\n\nMy team develops advanced AI support agents that resolve up to 70% of e-commerce tickets instantly by plugging into Shopify/WooCommerce. Beyond that, we build custom full-stack web apps for highly personalized shopping experiences that out-of-the-box platforms can't handle.\n\nWould you be free for a 10-minute discovery call next week?\n\nBest,\nSanjibani",
    }
];

async function main() {
    for (const t of templates) {
        await prisma.template.create({ data: t });
    }
    console.log("Templates seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
