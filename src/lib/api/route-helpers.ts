import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase' // service role — bypasses RLS for trusted server code
import { createClient as createSsrClient } from '@/lib/supabase/server' // session auth only

export type Supabase = typeof supabase

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

type RouteCtx<P> = { supabase: Supabase; params: P }
type AuthRouteCtx<P> = RouteCtx<P> & { userId: string }

export function route<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: RouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const params = await props.params
    return fn(req, { supabase, params })
  }
}

export function authRoute<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: AuthRouteCtx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, props: { params: Promise<P> }) => {
    const [params, ssrClient] = await Promise.all([props.params, createSsrClient()])
    const {
      data: { user },
    } = await ssrClient.auth.getUser()
    if (!user) return err('Unauthorized', 401)
    return fn(req, { supabase, params, userId: user.id })
  }
}
