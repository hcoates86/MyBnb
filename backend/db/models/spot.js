'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Spot.hasMany(models.Booking, { foreignKey: 'spotId', onDelete: 'CASCADE', hooks: true });
      Spot.hasMany(models.Review, { foreignKey: 'spotId', onDelete: 'CASCADE', hooks: true });
      Spot.belongsTo(models.User, { foreignKey: 'ownerId' });
      Spot.hasMany(models.SpotImage, { foreignKey: 'spotId', onDelete: 'CASCADE', hooks: true });
    }
  }
  Spot.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
      },
    ownerId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    address: {
      allowNull: false,
      type: DataTypes.STRING },
    city: {
      allowNull: false,
      type: DataTypes.STRING },
    state: {
      allowNull: false,
      type: DataTypes.STRING },
    country: {
      allowNull: false,
      type: DataTypes.STRING },
    lat: {
      allowNull: false,
      type: DataTypes.DECIMAL },
    lng: {
      allowNull: false,
      type: DataTypes.DECIMAL },
    name: {
      allowNull: false,
      type: DataTypes.STRING },
    description: {
      allowNull: false,
      type: DataTypes.TEXT },
    price: {
      allowNull: false,
      type: DataTypes.DECIMAL }
  }, {
    sequelize,
    modelName: 'Spot'
  });
  return Spot;
};