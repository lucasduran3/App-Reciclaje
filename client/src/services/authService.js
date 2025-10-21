/**
 * Auth Service - Servicio de autenticación cliente con Supabase
 */

import supabase from '../config/supabase';

class AuthService {
  /**
   * Registra nuevo usuario
   */
  async register(userData) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            name: userData.name,
            last_name: userData.lastName || '',
            role: userData.role || 'user'
          }
        }
      });

      if (authError) throw authError;

      // 2. Actualizar campos adicionales en el perfil
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            city: userData.city,
            neighborhood: userData.neighborhood,
            zone: `${userData.city} - ${userData.neighborhood}`
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      return {
        success: true,
        data: {
          user: authData.user,
          session: authData.session
        }
      };
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Error al crear la cuenta');
    }
  }

  /**
   * Login de usuario
   */
  async login(identifier, password) {
    try {
      // Supabase solo acepta email para login
      // Si el identifier no es un email, buscar el email por username
      let email = identifier;

      if (!identifier.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', identifier)
          .single();

        if (profileError || !profile) {
          throw new Error('Usuario no encontrado');
        }

        // Obtener el email del auth.users
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (userError || !user) {
          throw new Error('Usuario no encontrado');
        }

        email = user.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Credenciales inválidas');
    }
  }

  /**
   * Cierra sesión
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Obtiene usuario actual
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // Obtener perfil completo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return profile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Obtiene sesión actual
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Verifica si hay sesión activa
   */
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * Actualiza contraseña
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Solicita reset de contraseña
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePasswordStrength(password) {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(strength).filter(Boolean).length;

    return {
      ...strength,
      score,
      level: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
      isValid: strength.length && strength.uppercase && strength.lowercase && strength.number
    };
  }
}

export default new AuthService();