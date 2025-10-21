/**
 * SupabaseService - Servicio de acceso a Supabase
 * 
 * Reemplaza el fileService con operaciones de base de datos real
 */

import supabase from '../config/supabase.js';

class SupabaseService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Inicializa el servicio y verifica la conexión
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Verificar conexión
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) throw error;

      this.initialized = true;
      console.log('SupabaseService initialized successfully');
    } catch (error) {
      console.error('Error initializing SupabaseService:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de una tabla
   * @param {string} table - Nombre de la tabla
   * @param {object} options - Opciones de filtrado y ordenamiento
   * @returns {Promise<Array>} Array de registros
   */
  async getAll(table, options = {}) {
    try {
      let query = supabase.from(table).select('*');

      // Aplicar filtros si existen
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending !== false 
        });
      }

      // Aplicar límite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error getting all from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un registro por ID
   * @param {string} table - Nombre de la tabla
   * @param {string} id - ID del registro
   * @returns {Promise<Object|null>} Registro encontrado o null
   */
  async getById(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error getting ${table} by id:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro
   * @param {string} table - Nombre de la tabla
   * @param {Object} data - Datos del nuevo registro
   * @returns {Promise<Object>} Registro creado
   */
  async create(table, data) {
    try {
      const { data: created, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return created;
    } catch (error) {
      console.error(`Error creating in ${table}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un registro
   * @param {string} table - Nombre de la tabla
   * @param {string} id - ID del registro
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Registro actualizado
   */
  async update(table, id, updates) {
    try {
      const { data: updated, error } = await supabase
        .from(table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return updated;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un registro
   * @param {string} table - Nombre de la tabla
   * @param {string} id - ID del registro
   * @returns {Promise<boolean>} True si se eliminó
   */
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una query personalizada
   * @param {string} table - Nombre de la tabla
   * @param {Function} queryBuilder - Función que construye la query
   * @returns {Promise<Array>} Resultados de la query
   */
  async query(table, queryBuilder) {
    try {
      let query = supabase.from(table).select('*');
      
      if (queryBuilder) {
        query = queryBuilder(query);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      throw error;
    }
  }

  /**
   * Cuenta registros en una tabla
   * @param {string} table - Nombre de la tabla
   * @param {object} filters - Filtros opcionales
   * @returns {Promise<number>} Cantidad de registros
   */
  async count(table, filters = {}) {
    try {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error(`Error counting ${table}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el cliente de Supabase directamente
   * Para operaciones complejas que no están cubiertas
   */
  getClient() {
    return supabase;
  }
}

// Exportar instancia singleton
export default new SupabaseService();