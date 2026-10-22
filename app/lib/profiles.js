import { supabase } from './supabase';

// Хэширование пароля через SHA-256
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Получить все профили
export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  return { data, error };
};

// Войти в профиль
export const loginProfile = async (profileId, password) => {
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('password_hash', passwordHash)
    .single();
  
  return { data, error };
};

// Создать профиль (только админ)
export const createProfile = async (name, password, isAdmin = false, avatarColor = '#8b0000') => {
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({ name, password_hash: passwordHash, is_admin: isAdmin, avatar_color: avatarColor })
    .select()
    .single();
  
  return { data, error };
};

// Удалить профиль
export const deleteProfile = async (profileId) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);
  return { error };
};