'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('pages', [
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        type: 'privacy_policy',
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: `### 1. Data Collection\nAt Sappey, we collect only the information necessary to process your farm-direct orders, including your name, delivery address, and contact details. We do not sell your personal data to third-party marketers.\n\n### 2. Payment Security\nAll transactions are processed through encrypted gateways. Sappey does not store your credit card or banking information on our local servers.\n\n### 3. Cookies\nWe use cookies to improve your shopping experience, such as remembering items in your cart. You can disable these in your browser settings, though it may affect site functionality.`,
        meta_title: 'Privacy Policy | Sappey Data Protection',
        meta_description: 'Learn how Sappey protects your personal information and ensures a secure shopping experience for your premium dry fruit orders.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        type: 'terms_conditions',
        slug: 'terms-and-conditions',
        title: 'Terms & Conditions',
        content: `### 1. Agreement of Sale\nBy placing an order on Sappey.com, you agree to purchase natural, seasonal products. Because our items are farm-sourced, slight variations in color and size are normal and a sign of natural quality.\n\n### 2. Use of Website\nUnauthorized use of this website or its content (images, text, brand name) is strictly prohibited. All intellectual property belongs to Sappey Premium Harvest.\n\n### 3. Limitation of Liability\nSappey is responsible for the quality of the product until delivery. We are not liable for delays caused by third-party logistics or incorrect addresses provided by the customer.`,
        meta_title: 'Terms & Conditions | Sappey Legal Agreement',
        meta_description: 'Read the official terms and conditions for using the Sappey platform and purchasing our farm-direct products.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        type: 'sitemap',
        slug: 'sitemap',
        title: 'Site Map',
        content: `### Main Pages\n* [Home](/) \n* [All Products](/products) \n* [Our Story](/about-sappey)\n\n### Customer Support\n* [Shipping Policy](/shipping-policy) \n* [Returns & Refunds](/returns-and-refunds) \n* [FAQs](/faqs)\n\n### Legal\n* [Privacy Policy](/privacy-policy) \n* [Terms of Service](/terms-and-conditions)`,
        meta_title: 'Sitemap | Sappey Navigation Guide',
        meta_description: 'A complete directory of all pages on Sappey.com, helping you find our products, stories, and policies easily.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('pages', {
      slug: ['privacy-policy', 'terms-and-conditions', 'sitemap']
    });
  }
};