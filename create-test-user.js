#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   Adicione ao .env.local:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('🔐 Criando usuário de teste...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@midiacore.com',
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);

      // Se o usuário já existe, tenta recuperar
      if (error.message.includes('already exists')) {
        console.log('⚠️  Usuário já existe');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === 'test@midiacore.com');
        if (user) {
          console.log(`✅ ID do usuário existente: ${user.id}`);
        }
      }
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Senha: TestPassword123!`);

    // Aguardar um pouco para o trigger criar o profile
    console.log('\n⏳ Aguardando criação automática do perfil...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se o profile foi criado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn('⚠️  Profile ainda não foi criado. Aguarde alguns segundos e tente novamente.');
    } else {
      console.log('✅ Perfil criado automaticamente!');
      console.log(`   Role: ${profile.role}`);
      console.log(`   Company ID: ${profile.company_id}`);
    }

    console.log('\n🎉 Teste de login:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email: test@midiacore.com');
    console.log('   Senha: TestPassword123!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

createTestUser();
