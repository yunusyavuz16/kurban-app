'use strict';

module.exports = (sequelize, DataTypes) => {
  const Kurban = sequelize.define('Kurban', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    no: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_number'
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    slaughterTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'slaughter_time'
    },
    butcherName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'butcher_name'
    },
    packageCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'package_count'
    },
    meatPieces: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'meat_pieces'
    },
    statusId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'status_id',
      references: {
        model: 'kurban_statuses',
        key: 'id'
      }
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id',
      references: {
        model: 'organization',
        key: 'id'
      }
    },
    // Additional fields for tracking
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true
    },
    ownerName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'owner_name'
    },
    ownerPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'owner_phone'
    },
    ownerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'owner_address'
    },
    // Processing details
    bloodWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'blood_weight'
    },
    hideWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'hide_weight'
    },
    organWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'organ_weight'
    },
    netMeatWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'net_meat_weight'
    },
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'kurban',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['status_id']
      },
      {
        fields: ['order_number']
      },
      {
        fields: ['no']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['organization_id', 'no']
      },
      {
        unique: true,
        fields: ['organization_id', 'order_number']
      }
    ]
  });

  Kurban.associate = function(models) {
    // Kurban belongs to Organization
    Kurban.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // Kurban belongs to KurbanStatus
    Kurban.belongsTo(models.KurbanStatus, {
      foreignKey: 'status_id',
      as: 'status'
    });
  };

  return Kurban;
};