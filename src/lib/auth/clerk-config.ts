/**
 * Clerk 认证配置
 * 检查是否启用 Clerk 认证
 */
export function isClerkEnabled(): boolean {
  return process.env.CLERK_ENABLED === 'true' && 
         !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
         !!process.env.CLERK_SECRET_KEY;
}

/**
 * 获取 Clerk 配置
 */
export function getClerkConfig() {
  if (!isClerkEnabled()) return null;
  
  return {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
  };
}

/**
 * Clerk 配置接口
 */
export interface ClerkConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}
