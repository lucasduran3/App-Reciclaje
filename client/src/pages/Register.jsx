/**
 * Página de Registro
 * Ubicación: client/src/pages/Register.jsx
 */

import React, { use, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from "../context/AuthContext";
import authService from '../services/authService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

// Ciudades de Argentina (principales)
const CITIES = [
  'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán',
  'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'Rafaela'
].sort();

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    role: 'user',
    name: '',
    lastName: '',
    username: '',
    city: '',
    neighborhood: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validar fortaleza de contraseña
    if (name === 'password') {
      setPasswordStrength(authService.validatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = formData.role === 'sponsor' 
        ? 'Nombre de la empresa es requerido' 
        : 'Nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Debe tener al menos 2 caracteres';
    }

    // LastName (solo para users)
    if (formData.role === 'user') {
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Apellido es requerido';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'Debe tener al menos 2 caracteres';
      }
    }

    // Username
    if (!formData.username.trim()) {
      newErrors.username = 'Nombre de usuario es requerido';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Solo letras, números y guión bajo';
    }

    // City
    if (!formData.city) {
      newErrors.city = 'Ciudad es requerida';
    }

    // Neighborhood
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Barrio es requerido';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (passwordStrength && !passwordStrength.isValid) {
      newErrors.password = 'Contraseña no cumple los requisitos';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (error) {
      const errorMessage = error.message || 'Error al crear la cuenta';
      
      // Manejar errores específicos
      if (errorMessage.includes('correo')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('usuario')) {
        setErrors({ username: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      (formData.role === 'sponsor' || formData.lastName.trim()) &&
      formData.username.trim() &&
      formData.city &&
      formData.neighborhood.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      passwordStrength?.isValid &&
      Object.keys(errors).length === 0
    );
  };

  return (
    <div className="page" style={{ 
      maxWidth: '600px', 
      margin: '2rem auto',
      padding: '0 var(--spacing-lg)'
    }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="page-title" style={{ marginBottom: 'var(--spacing-sm)' }}>
            <Icon icon="fluent-color:person-add-24" width="40" style={{ verticalAlign: 'middle' }} />
            {' '}Crear Cuenta
          </h1>
          <p className="page-subtitle">
            Únete a la comunidad de reciclaje
          </p>
        </div>

        {errors.general && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--danger-light)',
            color: 'var(--danger-dark)',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--spacing-lg)',
            fontSize: '0.875rem'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tipo de cuenta */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Tipo de cuenta
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <label style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                border: `2px solid ${formData.role === 'user' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: formData.role === 'user' ? 'var(--primary-light)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                  style={{ marginRight: 'var(--spacing-sm)' }}
                />
                <Icon icon="fluent-color:person-24" width="20" style={{ verticalAlign: 'middle' }} />
                {' '}Usuario
              </label>
              <label style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                border: `2px solid ${formData.role === 'sponsor' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: formData.role === 'sponsor' ? 'var(--primary-light)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="sponsor"
                  checked={formData.role === 'sponsor'}
                  onChange={handleChange}
                  style={{ marginRight: 'var(--spacing-sm)' }}
                />
                <Icon icon="fluent-color:building-bank-24" width="20" style={{ verticalAlign: 'middle' }} />
                {' '}Patrocinador
              </label>
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              {formData.role === 'sponsor' ? 'Nombre de la empresa' : 'Nombre'} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={formData.role === 'sponsor' ? 'Eco Empresa SA' : 'Juan'}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                fontSize: '1rem'
              }}
            />
            {errors.name && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* LastName (solo para users) */}
          {formData.role === 'user' && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ 
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                Apellido *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Pérez"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  border: `1px solid ${errors.lastName ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem'
                }}
              />
              {errors.lastName && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.lastName}
                </span>
              )}
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Nombre de usuario *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="usuario123"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: `1px solid ${errors.username ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                fontSize: '1rem'
              }}
            />
            {errors.username && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.username}
              </span>
            )}
          </div>

          {/* Ciudad y Barrio */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                Ciudad *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  border: `1px solid ${errors.city ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleccionar...</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.city}
                </span>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                Barrio *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Centro"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  border: `1px solid ${errors.neighborhood ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem'
                }}
              />
              {errors.neighborhood && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.neighborhood}
                </span>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                fontSize: '1rem'
              }}
            />
            {errors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  paddingRight: '3rem',
                  border: `1px solid ${errors.password ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <Icon icon={showPassword ? 'fluent:eye-off-24-filled' : 'fluent:eye-24-filled'} width="20" />
              </button>
            </div>

            {/* Password strength indicator */}
            {passwordStrength && formData.password && (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <div style={{
                  height: '4px',
                  background: 'var(--border)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    background: passwordStrength.level === 'weak' ? 'var(--danger)' :
                               passwordStrength.level === 'medium' ? 'var(--warning)' : 'var(--success)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-xs)'
                }}>
                  <span style={{ color: passwordStrength.length ? 'var(--success)' : 'var(--text-muted)' }}>
                    {passwordStrength.length ? '✓' : '○'} 8+ caracteres
                  </span>
                  <span style={{ color: passwordStrength.uppercase ? 'var(--success)' : 'var(--text-muted)' }}>
                    {passwordStrength.uppercase ? '✓' : '○'} Mayúscula
                  </span>
                  <span style={{ color: passwordStrength.lowercase ? 'var(--success)' : 'var(--text-muted)' }}>
                    {passwordStrength.lowercase ? '✓' : '○'} Minúscula
                  </span>
                  <span style={{ color: passwordStrength.number ? 'var(--success)' : 'var(--text-muted)' }}>
                    {passwordStrength.number ? '✓' : '○'} Número
                  </span>
                </div>
              </div>
            )}

            {errors.password && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Confirmar contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: `1px solid ${errors.confirmPassword ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                fontSize: '1rem'
              }}
            />
            {errors.confirmPassword && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="large"
            disabled={!isFormValid() || loading}
            loading={loading}
          >
            Crear Cuenta
          </Button>

          {/* Login Link */}
          <div style={{ 
            textAlign: 'center',
            marginTop: 'var(--spacing-lg)',
            fontSize: '0.875rem'
          }}>
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Iniciar Sesión
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}