/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctrxixpoiwotrbnubije.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cnhpeHBvaXdvdHJibnViaWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTMxNjAsImV4cCI6MjA4NzM2OTE2MH0.oam7uZlW82FDpoRZwbWf021y8BNvK14KnlmDbAezJeg';

const supabase = createClient(supabaseUrl, anonKey);

async function testViewerRLS() {
  try {
    // Simular login do viewer
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@midiacore.com',
      password: 'TestPassword123!',
    });

    if (authError) {
      console.error('❌ Erro ao fazer login:', authError.message);
      return;
    }

    console.log('✅ Login como viewer realizado');
    console.log(`   User ID: ${authData.user.id}`);

    // Tentar inserir um novo contato (deveria falhar)
    console.log('\n🧪 Teste 1: Tentar INSERT de novo contato (deve FALHAR para viewer)...');
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert({
        name: 'Test Contact',
        email: 'test@example.com',
        company_id: 'a0000000-0000-0000-0000-000000000001',
      })
      .select();

    if (insertError) {
      console.log('✅ INSERT bloqueado com sucesso!');
      console.log(`   Erro: ${insertError.message}`);
    } else {
      console.error('❌ FALHA: Viewer conseguiu inserir dados (RLS não está funcionando)');
      console.log('   Dados inseridos:', insertData);
    }

    // Tentar SELECT (deveria funcionar)
    console.log('\n🧪 Teste 2: SELECT de contatos (deve FUNCIONAR para viewer)...');
    const { data: selectData, error: selectError } = await supabase
      .from('contacts')
      .select('id, name, email')
      .limit(5);

    if (selectError) {
      console.error('❌ Erro ao selecionar:', selectError.message);
    } else {
      console.log('✅ SELECT funciona!');
      console.log(`   Registros encontrados: ${selectData.length}`);
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

testViewerRLS();
