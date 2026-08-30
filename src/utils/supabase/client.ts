import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createClient> | undefined

export const createSupabaseClient = () => {
    if (client) return client

    if (!supabaseUrl || !supabaseKey) {
        client = createClient('https://mock.supabase.co', 'mock_anon_key_for_local_dev')
        return client
    }

    client = createClient(supabaseUrl, supabaseKey)
    return client
}
