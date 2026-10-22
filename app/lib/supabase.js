import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esbmcoxtkheovvizjqlq.supabase.co';
const supabaseAnonKey = 'sb_publishable_yx_RVg__Ic19hx0HA6jTDQ_mQh3qCdg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);