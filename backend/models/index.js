const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: DataTypes.STRING,
  profilePicture: DataTypes.STRING
}, {
  tableName: 'users',
  timestamps: true,
  underscored: false
});

const TeeTime = sequelize.define('TeeTime', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  holes: {
    type: DataTypes.ENUM('9H', '18H'),
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tee_times',
  timestamps: true,
  underscored: false
});

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  UserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  TeeTimeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tee_times',
      key: 'id'
    }
  },
  players: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 4
    }
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: false
});

// Relationships
User.hasMany(Booking);
Booking.belongsTo(User);

TeeTime.hasOne(Booking);
Booking.belongsTo(TeeTime);

module.exports = {
  sequelize,
  User,
  TeeTime,
  Booking
};
