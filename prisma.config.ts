// Prisma 配置文件

import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
});
