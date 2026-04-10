const bcrypt = require('bcryptjs');

const DEFAULT_ADMIN_EMAIL = 'admin@appforge.local';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

async function seedAdmin(prisma) {
  const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[seed] admin seed skipped because missing env vars');
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log(`[seed] admin user already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    console.log(`[seed] admin user created: ${email}`);
  } catch (error) {
    console.error('[seed] admin seed failed:', error);
    throw error;
  }
}

module.exports = {
  seedAdmin,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
};
