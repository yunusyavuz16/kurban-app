'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const organizationId = uuidv4();

    // Insert demo organization
    await queryInterface.bulkInsert('organization', [
      {
        id: organizationId,
        name: 'Demo Kurban Organization',
        code: 'DEMO001',
        email: 'admin@demo-kurban.com',
        phone: '+90 555 123 4567',
        address: 'Demo Address, Istanbul, Turkey',
        settings: JSON.stringify({
          theme: 'default',
          language: 'tr'
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Insert default kurban statuses for the demo organization
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
        description: 'Kurban kesim sırasında bekliyor',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Kurban kesim işlemi devam ediyor',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Kurban yüzme işlemi yapılıyor',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Et parçalama ve ayrım işlemi',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Et tartım işlemi yapılıyor',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Et paketleme işlemi yapılıyor',
        created_at: new Date(),
        updated_at: new Date()
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
        description: 'Kurban işlemi tamamlandı',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('kurban_statuses', statuses);

    // Insert demo admin user
    const adminUserId = uuidv4();
    await queryInterface.bulkInsert('users', [
      {
        id: adminUserId,
        email: 'admin@demo-kurban.com',
        role: 'admin',
        first_name: 'Demo',
        last_name: 'Admin',
        phone: '+90 555 123 4567',
        is_active: true,
        organization_id: organizationId,
        metadata: JSON.stringify({
          created_by: 'seeder'
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@demo-kurban.com' });
    await queryInterface.bulkDelete('kurban_statuses', { organization_id: { [Sequelize.Op.in]: queryInterface.sequelize.literal("(SELECT id FROM organization WHERE code = 'DEMO001')") } });
    await queryInterface.bulkDelete('organization', { code: 'DEMO001' });
  }
};