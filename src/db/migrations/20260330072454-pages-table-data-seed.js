'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('pages', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'about_us',
        slug: 'about-sappey',
        title: 'The Sappey Story: From Farm to Your Table',
        content: `### Our Rooted Connection\nAt Sappey, we believe the best nutrition comes straight from the earth, not a dusty warehouse. Founded in 2026, we've built a direct bridge between local farmers and your doorstep. By cutting out multiple middlemen, we ensure that the dry fruits you receive are the current season's harvest, packed with peak flavor and nutrients.\n\n### Our Unique Process\nWe don't just "buy and sell." We partner with farmers who practice sustainable agriculture. Once you place an order, our dedicated packaging partners receive the raw harvest, perform a final quality check, and vacuum-seal the freshness in eco-friendly packaging specifically for you.\n\n### Why Sappey?\n* **Direct Sourcing:** No long-term storage; we source fresh based on demand.\n* **Empowering Farmers:** By working directly with growers, we ensure they get a fair price for their hard work.\n* **Hygienic Packaging:** Our vendors follow strict food-safety protocols to ensure every nut and fruit is handled with care.`,
        meta_title: 'About Sappey | Farm-Direct Dry Fruits & Premium Nuts',
        meta_description: 'Sappey connects you directly with farmers. Experience the freshness of dry fruits sourced straight from the farm, professionally packed, and delivered to you.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        type: 'shipping_policy',
        slug: 'shipping-policy',
        title: 'Shipping & Freshness Guarantee',
        content: `### 1. Fresh-Pack Processing\nBecause we source direct, your order is sent to our packaging facility as soon as it's confirmed. Processing typically takes 1-2 business days to ensure your dry fruits are perfectly sorted and sealed before dispatch.\n\n### 2. Shipping Timelines\n* **Standard Delivery:** 4-6 business days ($5.00)\n* **Express Fresh Delivery:** 2-3 business days ($12.00)\n\n### 3. Packaging Integrity\nWe use moisture-resistant, multi-layered packaging to protect the oils and textures of our dry fruits during transit. If your package arrives with a broken seal, please contact us immediately at support@sappey.com.\n\n### 4. Direct Dispatch\nTo reduce carbon footprint and transit time, your order is dispatched directly from our regional packaging hubs located closest to the harvest source.`,
        meta_title: 'Shipping Policy | Sappey Freshness Delivery',
        meta_description: 'Learn about Sappey\'s unique fresh-pack processing and shipping timelines. We ensure your farm-direct dry fruits reach you in peak condition.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        type: 'returns_refunds',
        slug: 'returns-and-refunds',
        title: 'Quality & Return Policy',
        content: `### Our Freshness Guarantee\nAs dry fruits are perishable food items, we prioritize health and safety. If you receive a product that does not meet our quality standards (e.g., rancid, moldy, or damaged packaging), we offer a full refund or replacement within 7 days of delivery.\n\n### How to Request a Return\n1. Take a clear photo of the product and the batch number on the packaging.\n2. Email support@sappey.com with your Order ID.\n3. Our team will review the quality concern and process your refund within 48 hours.\n\n### Change of Mind\nDue to food safety regulations, we cannot accept returns for "change of mind" once the vacuum seal has been broken.`,
        meta_title: 'Returns & Refunds | Sappey Quality Guarantee',
        meta_description: 'Sappey stands by the quality of our farm-direct products. Review our 7-day quality guarantee and easy refund process for damaged or substandard items.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        type: 'faqs',
        slug: 'faqs',
        title: 'Frequently Asked Questions',
        content: `### Sourcing & Quality\n**Are these truly direct from farmers?**\nYes! We bypass traditional wholesale markets. We coordinate directly with farm-level aggregators to ensure the stock is fresh from the current season.\n\n**Do you use preservatives?**\nNo. Our dry fruits are natural and sun-dried. We rely on high-quality vacuum packaging to maintain shelf life rather than chemical preservatives.\n\n### Orders & Delivery\n**Who packs my order?**\nWe work with certified regional vendors who specialize in food-grade packaging. They follow Sappey's strict quality guidelines to ensure consistency.\n\n**Can I cancel my order?**\nOrders can be canceled within 4 hours of placement. After that, the order is sent to our packaging partner for fulfillment.`,
        meta_title: 'Sappey FAQs | Farm Sourcing & Product Quality',
        meta_description: 'Answers to your questions about Sappey\'s direct-from-farmer sourcing, natural processing, and specialized packaging partners.',
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('pages', null, {});
  }
};