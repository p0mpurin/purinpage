import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createClient> | undefined

export const createSupabaseClient = () => {
    if (client) return client

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'Supabase env vars missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example)'
        )
    }

    client = createClient(supabaseUrl, supabaseKey)
    return client
}
