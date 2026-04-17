import { NextResponse } from 'next/server'
import { createSupabaseServer } from './supabase-server'

export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function getAuthToken(request) {
  const h = request.headers.get('Authorization')
  if (!h || !h.startsWith('Bearer ')) return null
  return h.split(' ')[1]
}

export function getSupabaseFromRequest(request) {
  const token = getAuthToken(request)
  if (!token) throw new Error('Unauthorized: token tidak ditemukan')
  return { supabase: createSupabaseServer(token), token }
}

export async function getCurrentUser(request) {
  const { supabase } = getSupabaseFromRequest(request)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized: user tidak valid')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { user, profile, supabase }
}
