/**
 * Inicializa el cliente de Supabase para el servidor
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Verificar que las variables de entorno estén definidas
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Crear cliente de Supabase con service role key
// Esta clave tiene permisos completos y solo debe usarse en el servidor
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Función helper para verificar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', {count: 'exact'})
      .limit(1);
    
    if (error) throw error;
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;