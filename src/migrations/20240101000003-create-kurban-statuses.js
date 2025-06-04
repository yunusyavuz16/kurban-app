'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kurban_statuses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      color_bg: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      color_text: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      color_border: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organization',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('kurban_statuses', ['organization_id'], {
      name: 'kurban_statuses_organization_id_idx'
    });

    await queryInterface.addIndex('kurban_statuses', ['name'], {
      name: 'kurban_statuses_name_idx'
    });

    await queryInterface.addIndex('kurban_statuses', ['display_order'], {
      name: 'kurban_statuses_display_order_idx'
    });

    await queryInterface.addIndex('kurban_statuses', ['is_active'], {
      name: 'kurban_statuses_is_active_idx'
    });

    await queryInterface.addIndex('kurban_statuses', ['organization_id', 'name'], {
      unique: true,
      name: 'kurban_statuses_org_name_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('kurban_statuses');
  }
};