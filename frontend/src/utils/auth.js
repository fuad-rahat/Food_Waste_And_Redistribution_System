import jwt_decode from 'jwt-decode';

const TOKEN_KEY = 'ff_token';
export function saveToken(token){ localStorage.setItem(TOKEN_KEY, token); }
export function getToken(){ return localStorage.getItem(TOKEN_KEY); }
export function logout(){ localStorage.removeItem(TOKEN_KEY); }
export function getUserFromToken(){
  const t = getToken();
  if (!t) return null;
  try{ return jwt_decode(t); }catch(e){ return null; }
}
