import { User } from '@prisma/client';

// This should work if User has role property
const user: User = { role: 'ADMIN' } as User;
console.log(user.role);