import argon2 from 'argon2';
import { prisma } from './lib/prisma.js';

async function main() {
  const email = 'admin@uzeed.cl';
  const password = 'Admin1234!';

  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    const password_hash = await argon2.hash(password);
    await prisma.user.create({
      data: { email, password_hash, role: 'ADMIN', name: 'Admin' }
    });
    console.log('Seeded admin user:', email, password);
  }

  const count = await prisma.post.count();
  if (count === 0) {
    const admin = await prisma.user.findUnique({ where: { email } });
    if (admin) {
      await prisma.post.create({
        data: {
          title: 'Bienvenido a UZEED',
          body: 'Este es un post de demo. Paga la membresía para ver contenido completo.',
          author_id: admin.id
        }
      });
      console.log('Seeded sample post');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
