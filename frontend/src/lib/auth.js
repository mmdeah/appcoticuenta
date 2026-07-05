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
  // Verificar que la cuenta esté activa (pending/suspended no pueden usar la app)
  if (profile.status === 'pending' || profile.status === 'suspended') {
    await logout();
    window.location.hash = '/login';
    return null;
  }
  // Primer ingreso: obligar a completar la configuración inicial antes de usar la app
  const currentPath = window.location.hash.replace('#', '');
  if (profile.role === 'client' && !profile?.companies?.address && currentPath !== '/wizard') {
    window.location.hash = '/wizard';
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
