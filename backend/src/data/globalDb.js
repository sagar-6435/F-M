export const globalDb = {
  branches: [
    {
      id: 'branch-1',
      name: 'Friends & Memories - Eluru',
      address: 'Mulpuri Nageswar Rao St, Eluru, Andhra Pradesh 534006',
      phone: '+91 99127 10932',
      mapLink: 'https://maps.app.goo.gl/DqNPcNmWZH4KC9dd7',
      capacity: 100,
      amenities: ['AC', 'Sound System', 'Projector'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'branch-2',
      name: 'Friends & Memories - Bhimavaram',
      address: '4-Masid St, Narasimhapuram, Kovvada, Bhimavaram, Andhra Pradesh 534202',
      phone: '+91 99127 10933',
      mapLink: 'https://maps.app.goo.gl/hc31fqJaDx6Veqkv7',
      capacity: 80,
      amenities: ['AC', 'Sound System', 'LED Screen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  services: [
    { id: 'private-theatre-party-hall', name: 'Private Theatre + Party Hall', description: 'Experience the best of both: Private Theatre and Party Hall' },
  ],
  cakes: [
    { id: 'cake-1', name: 'Classic Chocolate Truffle', price: 799, offerPrice: 699, description: 'Rich dark chocolate layers', quantity: '1kg' },
    { id: 'cake-2', name: 'Red Velvet Dream', price: 899, offerPrice: 799, description: 'Cream cheese frosted perfection', quantity: '1kg' },
    { id: 'cake-3', name: 'Butterscotch Crunch', price: 749, offerPrice: 649, description: 'Caramel & crunchy butterscotch', quantity: '1kg' },
    { id: 'cake-4', name: 'Fresh Fruit Delight', price: 999, offerPrice: 849, description: 'Seasonal fruits with cream', quantity: '1kg' },
    { id: 'cake-5', name: 'Black Forest Premium', price: 849, offerPrice: 749, description: 'Cherry-filled chocolate classic', quantity: '1kg' },
  ],
  decorations: [
    { id: 'extra-1', name: 'Balloon Bouquet Setup', price: 1500, offerPrice: 1200, description: '100+ premium balloons' },
    { id: 'extra-2', name: 'LED Neon Sign', price: 800, offerPrice: 600, description: 'Custom message neon display' },
    { id: 'extra-3', name: 'Photo Wall / Backdrop', price: 2000, offerPrice: 1700, description: 'Instagram-worthy backdrop' },
    { id: 'extra-4', name: 'Fog Machine Effect', price: 500, offerPrice: 400, description: 'Dramatic fog entrance' },
    { id: 'extra-5', name: 'Rose Petal Pathway', price: 1200, offerPrice: 999, description: 'Romantic rose petal setup' },
    { id: 'extra-6', name: 'Confetti Cannon', price: 600, offerPrice: 450, description: 'Party poppers & confetti' },
  ],
  occasions: ['Birthday', 'Anniversary', 'Proposal', 'Baby Shower', 'Farewell', 'Get Together', 'Date Night', 'Other'],
  pricing: {
    'private-theatre-party-hall': { 
      1: { price: 1999, offerPrice: 1799 }, 
      2: { price: 3499, offerPrice: 2999 }, 
      3: { price: 4999, offerPrice: 3999 } 
    },
  },
  decorationPrice: 1500, // This is mandatory decoration, maybe we should also give offer here? I'll keep it as is for now or add offerPrice if needed.

  heroImages: [],
};

export const branchDbs = {
  'branch-1': {
    bookings: [],
    timeSlots: [],
  },
  'branch-2': {
    bookings: [],
    timeSlots: [],
  },
};

export const getBranchDb = (branchId) => {
  return branchDbs[branchId] || null;
};
