'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('properties', 'marketValue', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Current estimated market value'
    });

    await queryInterface.addColumn('properties', 'lastMarketAssessment', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of last market assessment'
    });

    await queryInterface.addColumn('properties', 'marketTrend', {
      type: Sequelize.ENUM('increasing', 'decreasing', 'stable'),
      allowNull: true,
      comment: 'Current market trend'
    });

    await queryInterface.addColumn('properties', 'marketTrendPercentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Market trend percentage change'
    });

    await queryInterface.addColumn('properties', 'vacancyRate', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Current vacancy rate percentage'
    });

    await queryInterface.addColumn('properties', 'avgRent2BR', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Average 2BR rent in the area'
    });

    await queryInterface.addColumn('properties', 'avgRent1BR', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Average 1BR rent in the area'
    });

    await queryInterface.addColumn('properties', 'competitivePosition', {
      type: Sequelize.ENUM('premium', 'market', 'value'),
      allowNull: true,
      comment: 'Property position relative to market'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('properties', 'marketValue');
    await queryInterface.removeColumn('properties', 'lastMarketAssessment');
    await queryInterface.removeColumn('properties', 'marketTrend');
    await queryInterface.removeColumn('properties', 'marketTrendPercentage');
    await queryInterface.removeColumn('properties', 'vacancyRate');
    await queryInterface.removeColumn('properties', 'avgRent2BR');
    await queryInterface.removeColumn('properties', 'avgRent1BR');
    await queryInterface.removeColumn('properties', 'competitivePosition');
  }
};