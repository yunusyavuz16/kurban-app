'use strict';

module.exports = (sequelize, DataTypes) => {
  const KurbanStatus = sequelize.define('KurbanStatus', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    colorBg: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'color_bg'
    },
    colorText: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'color_text'
    },
    colorBorder: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'color_border'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'kurban_statuses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['display_order']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['organization_id', 'name']
      }
    ]
  });

  KurbanStatus.associate = function(models) {
    // KurbanStatus belongs to Organization
    KurbanStatus.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // KurbanStatus has many Kurbans
    KurbanStatus.hasMany(models.Kurban, {
      foreignKey: 'status_id',
      as: 'kurbans'
    });
  };

  return KurbanStatus;
};