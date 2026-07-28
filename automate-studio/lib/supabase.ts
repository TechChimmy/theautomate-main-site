import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for use inside Sanity Studio.
 *
 * Environment variables must be set in the Studio's .env file:
 *   SANITY_STUDIO_SUPABASE_URL=<your-supabase-url>
 *   SANITY_STUDIO_SUPABASE_ANON_KEY=<your-anon-key>
 *
 * If you already have NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * defined for the Next.js app, add the SANITY_STUDIO_ prefixed copies to the
 * same .env.local file — the Studio only exposes vars prefixed with SANITY_STUDIO_.
 */
const supabaseUrl =
  (import.meta as any).env?.SANITY_STUDIO_SUPABASE_URL as string | undefined

const supabaseAnonKey =
  (import.meta as any).env?.SANITY_STUDIO_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[ProductSelectorInput] Supabase env vars missing. ' +
      'Set SANITY_STUDIO_SUPABASE_URL and SANITY_STUDIO_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
)

export interface LmsProduct {
  product_uuid: string
  title: string
  thumbnail_url: string | null
  is_active: boolean
}

/**
 * Fetch all active products from public.products.
 * Returns an empty array on error so the UI degrades gracefully.
 */
export async function fetchActiveProducts(): Promise<LmsProduct[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []

  const {data, error} = await supabase
    .from('products')
    .select('product_uuid, title, thumbnail_url, is_active')
    .eq('is_active', true)
    .order('title', {ascending: true})

  if (error) {
    console.error('[fetchActiveProducts]', error.message)
    return []
  }

  return (data ?? []) as LmsProduct[]
}
