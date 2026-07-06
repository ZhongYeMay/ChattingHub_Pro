import { createClient } from '@supabase/supabase-js'

// 自动读取刚才在 .env.local 中配置的网页钥匙
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建并导出客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)