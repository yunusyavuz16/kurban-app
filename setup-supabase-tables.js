#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 Supabase Table Setup Script');
console.log('===============================\n');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTablesAndData() {
  try {
    console.log('🔄 Creating tables and inserting sample data...\n');

    // Create organization
    const organizationId = uuidv4();
    console.log('📊 Creating demo organization...');

    const { data: org, error: orgError } = await supabase
      .from('organization')
      .insert([
        {
          id: organizationId,
          name: 'Demo Kurban Organization',
          code: 'DEMO001',
          email: 'admin@demo-kurban.com',
          phone: '+90 555 123 4567',
          address: 'Demo Address, Istanbul, Turkey',
          settings: {
            theme: 'default',
            language: 'tr'
          },
          is_active: true
        }
      ])
      .select()
      .single();

    if (orgError && orgError.code !== '23505') { // 23505 is unique constraint violation
      console.error('❌ Error creating organization:', orgError);
      return;
    } else if (orgError && orgError.code === '23505') {
      console.log('⚠️  Organization already exists, continuing...');
      // Get existing organization
      const { data: existingOrg } = await supabase
        .from('organization')
        .select('id')
        .eq('code', 'DEMO001')
        .single();
      if (existingOrg) {
        organizationId = existingOrg.id;
      }
    } else {
      console.log('✅ Organization created successfully');
    }

    // Create kurban statuses
    console.log('📊 Creating kurban statuses...');
    const statuses = [
      {
        id: uuidv4(),
        name: 'waiting',
        label: 'Beklemede',
        color_bg: '!bg--yellow-50',
        color_text: 'text-yellow-900',
        color_border: 'border-yellow-300',
        display_order: 10,
        organization_id: organizationId,
        is_active: true,
        description: 'Kurban kesim sırasında bekliyor'
      },
      {
        id: uuidv4(),
        name: 'slaughtering',
        label: 'Kesimde',
        color_bg: '!bg--red-50',
        color_text: 'text-red-900',
        color_border: 'border-red-300',
        display_order: 20,
        organization_id: organizationId,
        is_active: true,
        description: 'Kurban kesim işlemi devam ediyor'
      },
      {
        id: uuidv4(),
        name: 'skinning',
        label: 'Yüzme İşleminde',
        color_bg: '!bg--orange-50',
        color_text: 'text-orange-900',
        color_border: 'border-orange-300',
        display_order: 30,
        organization_id: organizationId,
        is_active: true,
        description: 'Kurban yüzme işlemi yapılıyor'
      },
      {
        id: uuidv4(),
        name: 'meat_separation',
        label: 'Et Ayrımında',
        color_bg: '!bg--purple-50',
        color_text: 'text-purple-900',
        color_border: 'border-purple-300',
        display_order: 40,
        organization_id: organizationId,
        is_active: true,
        description: 'Et parçalama ve ayrım işlemi'
      },
      {
        id: uuidv4(),
        name: 'weighing',
        label: 'Tartıda',
        color_bg: '!bg--blue-50',
        color_text: 'text-blue-900',
        color_border: 'border-blue-300',
        display_order: 50,
        organization_id: organizationId,
        is_active: true,
        description: 'Et tartım işlemi yapılıyor'
      },
      {
        id: uuidv4(),
        name: 'packaging',
        label: 'Paketlemede',
        color_bg: '!bg--green-50',
        color_text: 'text-green-900',
        color_border: 'border-green-300',
        display_order: 60,
        organization_id: organizationId,
        is_active: true,
        description: 'Et paketleme işlemi yapılıyor'
      },
      {
        id: uuidv4(),
        name: 'done',
        label: 'Tamamlandı',
        color_bg: '!bg--gray-50',
        color_text: 'text-gray-900',
        color_border: 'border-gray-300',
        display_order: 70,
        organization_id: organizationId,
        is_active: true,
        description: 'Kurban işlemi tamamlandı'
      }
    ];

    const { data: statusData, error: statusError } = await supabase
      .from('kurban_statuses')
      .insert(statuses)
      .select();

    if (statusError && statusError.code !== '23505') {
      console.error('❌ Error creating statuses:', statusError);
      return;
    } else if (statusError && statusError.code === '23505') {
      console.log('⚠️  Statuses already exist, continuing...');
    } else {
      console.log('✅ Kurban statuses created successfully');
    }

    // Get waiting status ID for kurban creation
    const { data: waitingStatus } = await supabase
      .from('kurban_statuses')
      .select('id')
      .eq('name', 'waiting')
      .eq('organization_id', organizationId)
      .single();

    // Create demo admin user
    console.log('📊 Creating demo admin user...');
    const adminUserId = uuidv4();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: adminUserId,
          email: 'admin@demo-kurban.com',
          role: 'admin',
          first_name: 'Demo',
          last_name: 'Admin',
          phone: '+90 555 123 4567',
          is_active: true,
          organization_id: organizationId,
          metadata: {
            created_by: 'setup_script'
          }
        }
      ])
      .select();

    if (userError && userError.code !== '23505') {
      console.error('❌ Error creating user:', userError);
      return;
    } else if (userError && userError.code === '23505') {
      console.log('⚠️  User already exists, continuing...');
    } else {
      console.log('✅ Demo admin user created successfully');
    }

    // Create sample kurbans
    console.log('📊 Creating sample kurbans...');
    const sampleKurbans = [
      {
        id: uuidv4(),
        no: 'K001',
        order_number: 1,
        weight: 450.50,
        notes: 'Large healthy animal',
        breed: 'Kangal',
        age: 3,
        color: 'Brown',
        gender: 'male',
        owner_name: 'Ahmet Yılmaz',
        owner_phone: '+90 555 111 2233',
        status_id: waitingStatus?.id,
        organization_id: organizationId,
        is_active: true
      },
      {
        id: uuidv4(),
        no: 'K002',
        order_number: 2,
        weight: 380.25,
        notes: 'Medium sized, good quality',
        breed: 'Akkaraman',
        age: 2,
        color: 'White',
        gender: 'female',
        owner_name: 'Mehmet Demir',
        owner_phone: '+90 555 444 5566',
        status_id: waitingStatus?.id,
        organization_id: organizationId,
        is_active: true
      },
      {
        id: uuidv4(),
        no: 'K003',
        order_number: 3,
        weight: 520.75,
        notes: 'Extra large, premium quality',
        breed: 'Morkaraman',
        age: 4,
        color: 'Black',
        gender: 'male',
        owner_name: 'Ali Kaya',
        owner_phone: '+90 555 777 8899',
        status_id: waitingStatus?.id,
        organization_id: organizationId,
        is_active: true
      }
    ];

    const { data: kurbanData, error: kurbanError } = await supabase
      .from('kurban')
      .insert(sampleKurbans)
      .select();

    if (kurbanError && kurbanError.code !== '23505') {
      console.error('❌ Error creating kurbans:', kurbanError);
      return;
    } else if (kurbanError && kurbanError.code === '23505') {
      console.log('⚠️  Kurbans already exist, continuing...');
    } else {
      console.log('✅ Sample kurbans created successfully');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log('   • Organization: Demo Kurban Organization (Code: DEMO001)');
    console.log('   • Admin User: admin@demo-kurban.com');
    console.log('   • 7 Kurban Statuses (waiting → done workflow)');
    console.log('   • 3 Sample Kurbans (K001, K002, K003)');

    console.log('\n🧪 Test the API:');
    console.log('   curl "http://localhost:3001/api/kurban/search/no/DEMO001/K001"');
    console.log('   curl "http://localhost:3001/api/statuses/getByOrganization/DEMO001"');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTablesAndData();