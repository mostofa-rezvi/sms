import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin/system user with the standard API key
  const user = await prisma.user.upsert({
    where: { email: 'admin@ctpsms.com' },
    update: {
      apiKey: 'system-user-api-key',
    },
    create: {
      id: 'C7apn5DR4zZ0cXkxhBOrtwjZD8G2',
      email: 'admin@ctpsms.com',
      apiKey: 'system-user-api-key',
      timezone: 'Asia/Dhaka',
      subscriptionName: 'enterprise',
      subscriptionStatus: 'active',
      notificationMessageStatusEnabled: true,
      notificationWebhookEnabled: true,
      notificationHeartbeatEnabled: true,
      notificationNewsletterEnabled: false,
    },
  });

  console.log(`👤 User ready: ${user.email} (ID: ${user.id}, API Key: ${user.apiKey})`);

  // Create default phone for user
  const phone = await prisma.phone.upsert({
    where: {
      userId_phoneNumber: {
        userId: user.id,
        phoneNumber: '+18005550199',
      },
    },
    update: {},
    create: {
      id: 'default-phone-1',
      userId: user.id,
      phoneNumber: '+18005550199',
      sim: 'SIM1',
      messagesPerMinute: 30,
      maxSendAttempts: 3,
      messageExpirationSeconds: 600,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activePhoneId: phone.id },
  });

  console.log(`📱 Phone ready: ${phone.phoneNumber} (ID: ${phone.id})`);

  // Create sample contact
  await prisma.contact.create({
    data: {
      id: 'default-contact-1',
      userId: user.id,
      name: 'Creative Tech Park Support',
      phoneNumbers: ['+8801700000000', '+18005550100'],
      emails: ['support@creativetechpark.com'],
      properties: { company: 'Creative Tech Park', designation: 'Technical Support' },
    },
  }).catch(() => {});

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

