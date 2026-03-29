'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change section_type from ENUM to VARCHAR(100)
    await queryInterface.changeColumn('homepage_sections', 'section_type', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert back to ENUM
    await queryInterface.changeColumn('homepage_sections', 'section_type', {
      type: Sequelize.ENUM('collections', 'bestsellers', 'health_wellness', 'new_arrivals', 'story', 'testimonials', 'instagram', 'contact', 'about', 'footer'),
      allowNull: false
    });
  }
};
