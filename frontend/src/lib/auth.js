// src/lib/auth.js
import { supabase } from './supabase.js';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function getCompanyProfile(companyId) {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_config(*)')
    .eq('id', companyId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function requireAuth(requiredRole) {
  const session = await getSession();
  if (!session) {
    window.location.hash = '/login';
    return null;
  }
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    window.location.hash = '/login';
    return null;
  }
  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    window.location.hash = '/login';
    return null;
  }
  // Verificar que la cuenta esté activa
  if (profile.status === 'pending') {
    window.location.hash = '/pending';
    return null;
  }
  if (profile.status === 'suspended') {
    window.location.hash = '/suspended';
    return null;
  }
  return { session, profile };
}

export function getDaysRemaining(expiryDate) {
  if (!expiryDate) return null;
  const now    = new Date();
  const expiry = new Date(expiryDate);
  const diff   = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diff;
}
