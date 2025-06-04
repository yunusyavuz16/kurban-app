'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kurban', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      no: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      order_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      slaughter_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      butcher_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      package_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      meat_pieces: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'kurban_statuses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      // Additional fields for tracking
      breed: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: true
      },
      owner_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      owner_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      owner_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      // Processing details
      blood_weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      hide_weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      organ_weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      net_meat_weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      // Metadata
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addIndex('kurban', ['organization_id'], {
      name: 'kurban_organization_id_idx'
    });

    await queryInterface.addIndex('kurban', ['status_id'], {
      name: 'kurban_status_id_idx'
    });

    await queryInterface.addIndex('kurban', ['order_number'], {
      name: 'kurban_order_number_idx'
    });

    await queryInterface.addIndex('kurban', ['no'], {
      name: 'kurban_no_idx'
    });

    await queryInterface.addIndex('kurban', ['is_active'], {
      name: 'kurban_is_active_idx'
    });

    await queryInterface.addIndex('kurban', ['organization_id', 'no'], {
      unique: true,
      name: 'kurban_org_no_unique'
    });

    await queryInterface.addIndex('kurban', ['organization_id', 'order_number'], {
      unique: true,
      name: 'kurban_org_order_number_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('kurban');
  }
};