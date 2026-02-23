const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany();
  let updatedCount = 0;
  
  for (const t of templates) {
    let body = t.body;
    
    // Replace the address
    body = body.replace(/123 Business Rd, Tech City, TX 75001/g, "https://www.consultaitech.online/");
    
    // Standardize the unsubscribe message
    body = body.replace(/If you prefer not to receive these emails, please reply with 'Opt-out' and I'll remove you from my list immediately\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Reply 'Opt-out' to unsubscribe from future outreach\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/To opt out of future emails, please reply 'Unsubscribe'\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Reply 'Opt-out' to stop receiving these emails\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Reply 'Unsubscribe' if you wish to opt out\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/To opt out of future communication, simply reply 'Opt-out'\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Reply 'Opt-out' to remove yourself from my contact list\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Please reply 'Unsubscribe' if you do not wish to receive further emails\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    body = body.replace(/Reply 'Opt-out' to be removed from this mailing list\./g, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    
    // Fallback if none matched
    if (!body.includes("reply 'unsubscribe'")) {
        // Find if there's any mention of opt-out or unsubscribe
         body = body.replace(/.*opt-out.*/ig, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
         body = body.replace(/.*unsubscribe.*/ig, "If you'd prefer not to receive further emails, just reply 'unsubscribe'.");
    }

    await prisma.template.update({
      where: { id: t.id },
      data: { body }
    });
    updatedCount++;
  }
  
  console.log(`Updated ${updatedCount} templates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
