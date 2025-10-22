/**
 * Script para poblar la base de datos de Supabase con datos iniciales
 * Ejecutar con: node server/scripts/seedDatabase.js
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Leer mock_data.json
    const mockDataPath = join(__dirname, '../data/mock_data.json');
    const mockDataRaw = await readFile(mockDataPath, 'utf-8');
    const mockData = JSON.parse(mockDataRaw);

    console.log('📂 Mock data loaded successfully\n');

    // IMPORTANTE: Los usuarios deben crearse a través de Supabase Auth
    // Este script solo actualiza sus perfiles
    console.log('⚠️  Note: Users must be created through Supabase Auth first');
    console.log('   This script will only update existing profiles\n');

    // 1. Actualizar perfiles (si ya existen en auth.users)
    console.log('1️⃣ Updating profiles...');
    let profilesUpdated = 0;
    for (const user of mockData.users) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', user.username)
        .single();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            city: user.city,
            neighborhood: user.neighborhood,
            zone: user.zone,
            points: user.points,
            level: user.level,
            streak: user.streak,
            last_activity_date: user.lastActivityDate,
            stats: user.stats,
            badges: user.badges,
            preferences: user.preferences,
          })
          .eq('id', existingProfile.id);
        
        profilesUpdated++;
      }
    }
    console.log(`✅ ${profilesUpdated} profiles updated\n`);

    // 2. Insertar tickets
    console.log('2️⃣ Inserting tickets...');
    
    // Limpiar tickets existentes (opcional, comentar si no quieres)
    await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const ticket of mockData.tickets) {
      await supabase.from('tickets').insert({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        location: `(${ticket.location.lat},${ticket.location.lng})`,
        address: ticket.location.address,
        zone: ticket.zone,
        type: ticket.type,
        priority: ticket.priority,
        estimated_size: ticket.estimatedSize,
        status: ticket.status,
        reported_by: ticket.reportedBy,
        accepted_by: ticket.acceptedBy,
        validated_by: ticket.validatedBy,
        photos_before: ticket.photos.before,
        photos_after: ticket.photos.after,
        validation_type: ticket.validation.type,
        validation_status: ticket.validation.status,
        qr_code: ticket.validation.qrCode,
        validated_at: ticket.validation.validatedAt,
        rejection_reason: ticket.validation.rejectionReason,
        cleaning_status: ticket.cleaningStatus,
        points_awarded: ticket.pointsAwarded,
        interactions: ticket.interactions,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
        accepted_at: ticket.acceptedAt,
        completed_at: ticket.completedAt,
      });
    }
    console.log(`✅ ${mockData.tickets.length} tickets inserted\n`);

    // 3. Insertar misiones
    console.log('3️⃣ Inserting missions...');
    
    // Limpiar misiones existentes
    await supabase.from('missions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const mission of mockData.missions) {
      await supabase.from('missions').insert({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        icon: mission.icon,
        type: mission.type,
        category: mission.category,
        goal: mission.goal,
        points: mission.points,
        requirements: mission.requirements,
        expires_at: mission.expiresAt,
        created_at: mission.createdAt,
      });
    }
    console.log(`✅ ${mockData.missions.length} missions inserted\n`);

    // 4. Insertar comentarios
    console.log('4️⃣ Inserting comments...');
    
    // Limpiar comentarios existentes
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const comment of mockData.comments) {
      await supabase.from('comments').insert({
        id: comment.id,
        ticket_id: comment.ticketId,
        user_id: comment.userId,
        content: comment.content,
        created_at: comment.createdAt,
      });
    }
    console.log(`✅ ${mockData.comments.length} comments inserted\n`);

    // 5. Insertar puntos de acopio
    console.log('5️⃣ Inserting acopio points...');
    
    // Limpiar acopio points existentes
    await supabase.from('acopio_points').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const acopio of mockData.acopioPoints) {
      await supabase.from('acopio_points').insert({
        id: acopio.id,
        name: acopio.name,
        location: `(${acopio.location.lat},${acopio.location.lng})`,
        address: acopio.location.address,
        zone: acopio.zone,
        qr_code: acopio.qrCode,
        accepted_types: acopio.acceptedTypes,
        schedule: acopio.schedule,
        active: acopio.active,
      });
    }
    console.log(`✅ ${mockData.acopioPoints.length} acopio points inserted\n`);

    // Resumen final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Profiles updated: ${profilesUpdated}`);
    console.log(`   Tickets: ${mockData.tickets.length}`);
    console.log(`   Missions: ${mockData.missions.length}`);
    console.log(`   Comments: ${mockData.comments.length}`);
    console.log(`   Acopio Points: ${mockData.acopioPoints.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedDatabase();