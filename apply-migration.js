#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationFile = path.join(__dirname, 'supabase/migrations/20260226000000_add_profile_trigger.sql');
const sql = fs.readFileSync(migrationFile, 'utf-8');

console.log('📝 Migration SQL:');
console.log('='.repeat(50));
console.log(sql);
console.log('='.repeat(50));

console.log('\n⚠️  Para aplicar esta migração, siga um dos passos:');
console.log('\n1️⃣  Via Supabase Dashboard:');
console.log('   - Acesse: https://app.supabase.com');
console.log('   - Vá para: SQL Editor');
console.log('   - Cole o SQL acima');
console.log('   - Execute');

console.log('\n2️⃣  Via Supabase CLI (local):');
console.log('   - supabase migration up');

console.log('\n3️⃣  Via este script (com service_role_key):');
console.log('   - Coloque seu SUPABASE_SERVICE_ROLE_KEY em .env.local');
console.log('   - node apply-migration.js');

// Se houver service_role_key, aplicar via API
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (serviceRoleKey && supabaseUrl) {
  console.log('\n✅ Encontrado SUPABASE_SERVICE_ROLE_KEY. Aplicando migração...');

  // Para este exemplo, só mostramos como seria feito
  // A aplicação real seria via RPC ou via Postgres connection
  console.log('\n📌 Comando equivalente para psql:');
  console.log(`
    psql -h db.${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co \\
         -U postgres \\
         -d postgres \\
         -f supabase/migrations/20260226000000_add_profile_trigger.sql
  `);
} else {
  console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY não configurado.');
  console.log('   Adicione em .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave');
}
