const { createClient } = require('@supabase/supabase-js');

// Initialize client
const supabaseUrl = 'https://bgabtiaouaycwdpspclg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWJ0aWFvdWF5Y3dkcHNwY2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MTg1MSwiZXhwIjoyMDk0ODY3ODUxfQ.pugIBLisg0LB1WUBQNoc2coSJN7udmCCJXg0xpSlKuM';

const client = createClient(supabaseUrl, supabaseServiceKey);

const mockListings = [
  {
    title: '[SeedMock] Brembo 6-Pot Monoblock Brake Kit',
    description: 'Genuine Brembo 6-pot monoblock calipers with high performance 380mm slotted brake discs. Fits most Audi, BMW, and Porsche. High friction pads included. Condition is like new!',
    price: 4850.00,
    condition: 'Like New',
    category: 'Brakes',
    location: 'Kuala Lumpur, Wilayah Persekutuan',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Ohlins Road & Track Coilovers',
    description: 'Premium Ohlins Road & Track DFV coilover suspension designed for Toyota GR Yaris. Fully adjustable dampening and ride height. Used for only 5,000 kilometres, excellent condition.',
    price: 7200.00,
    condition: 'Good',
    category: 'Suspension',
    location: 'Subang Jaya, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Rays Volk Racing TE37 Saga (18-Inch)',
    description: 'Iconic Volk Racing TE37 Saga wheels in bronze. 18x9.5 +38 offset, 5x114.3 bolt pattern. Super lightweight forging, perfect structural state. Ready for immediate fitment.',
    price: 8900.00,
    condition: 'Good',
    category: 'Tyres & Rims',
    location: 'Shah Alam, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Snap-on Digital Torque Wrench 3/8"',
    description: 'Snap-on TechAngle digital torque wrench. Measures torque up to 135 Nm with vibrating and sound warnings. Screen and backlight function perfectly. Calibrated last month.',
    price: 1250.00,
    condition: 'Good',
    category: 'Tools',
    location: 'Petaling Jaya, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Garrett G30-770 Turbocharger',
    description: 'Garrett G-Series performance dual ball bearing turbocharger. V-band configuration, capable of pushing over 750 horsepower. Dual ceramic ball bearings are entirely intact, no shaft play.',
    price: 5400.00,
    condition: 'New',
    category: 'Parts',
    location: 'Georgetown, Penang',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Carbon Fiber GT Wing (1600mm)',
    description: 'Universal 3D carbon fiber rear race wing with adjustable brackets. Made from vacuumed pre-preg dry carbon fiber for extreme lightweight stiffness. Adds high downforce.',
    price: 1850.00,
    condition: 'Like New',
    category: 'Accessories',
    location: 'Johor Bahru, Johor',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Eventuri Carbon Fiber Air Intake',
    description: 'Eventuri carbon fiber cold air induction kit for Honda Civic Type R FK8. Provides optimized aerodynamic air flow and measurable dyno gains of +15 HP. Beautiful engine bay addition.',
    price: 3200.00,
    condition: 'Like New',
    category: 'Parts',
    location: 'Kuching, Sarawak',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Haltech Elite 2500 ECU',
    description: 'Standard standalone engine management controller. Supports up to 12 sequential fuel injection channels and DBW throttle. Wire termination loom included, updated to the newest firmware.',
    price: 6500.00,
    condition: 'Good',
    category: 'Electronics',
    location: 'Klang, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Akrapovic Titanium Slip-On Exhaust',
    description: 'Extremely lightweight titanium slip-on muffler system for BMW M2 Competition. Features carbon fiber exhaust tips. Delivers pure throatier engine acoustics and major weight saving.',
    price: 9300.00,
    condition: 'Good',
    category: 'Exhaust',
    location: 'Ipoh, Perak',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Recaro Pole Position Bucket Seat',
    description: 'Original Recaro Pole Position FIA approved fiberglass bucket seat in black velour. Extremely comfortable and lightweight. Valid decals intact. side mount railings are not included.',
    price: 2400.00,
    condition: 'Good',
    category: 'Accessories',
    location: 'Miri, Sarawak',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Michelin Pilot Sport 5 (18-Inch Pairs)',
    description: 'Two brand new tires in dimension 245/40 R18. Manufactured early 2026, never fitted. Delivering exceptional high-grip performance, wet traction handling, and longevity.',
    price: 1050.00,
    condition: 'New',
    category: 'Tyres & Rims',
    location: 'Kuala Terengganu, Terengganu',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] H&R Sport Lowering Springs',
    description: 'H&R Sport progressive rates lowering springs. Drops ride height by 30mm for better weight distribution and handling look. Compatible with Mazda 3 BP models. Original package.',
    price: 650.00,
    condition: 'Like New',
    category: 'Suspension',
    location: 'Alor Setar, Kedah',
    imageUrl: 'https://images.unsplash.com/photo-1600706432502-75e0e03be229?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Project Mu HC+ Brake Pads',
    description: 'Front axle performance high carbon metal matrix brake pads. Friction rating of up to 800 degrees Celsius, perfect for spirited canyon carvings and amateur club track trials.',
    price: 750.00,
    condition: 'New',
    category: 'Brakes',
    location: 'Kuantan, Pahang',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Exedy Stage 2 Clutch Kit',
    description: 'Heavy duty organic clutch replacement for Subaru WRX STI (EJ25 engine). Rated to pull up to 480 Nm torque comfortably. Retains very manageable pedal feel for standard commuting.',
    price: 1950.00,
    condition: 'New',
    category: 'Parts',
    location: 'Kota Kinabalu, Sabah',
    imageUrl: 'https://images.unsplash.com/photo-1582266255765-ab5e5a61d918?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Mac Tools Metric Deep Socket Set',
    description: 'Mac Tools 12-piece deep impact sockets set (10mm to 21mm). Strong alloyed chromium steel body, stands high impact load wrenches comfortably. Barely used, no wear.',
    price: 450.00,
    condition: 'Like New',
    category: 'Tools',
    location: 'Seremban, Negeri Sembilan',
    imageUrl: 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Tomei Poncam Camshafts (SR20DET)',
    description: 'Drop-in high-lift performance camshaft set for Nissan Silvia SR20DET engines. No valve springs upgrade needed. Greatly improves mid-range and top-end volumetric power output.',
    price: 2100.00,
    condition: 'New',
    category: 'Parts',
    location: 'Ipoh, Perak',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Defi Advance BG Gauge Meter System',
    description: 'Premium Defi Advance controller paired with oil temperature and water temperature indicators. Includes matching sensors and wiring. Fully functional backlight, no dead pixels.',
    price: 1350.00,
    condition: 'Good',
    category: 'Electronics',
    location: 'Melaka, Melaka',
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] HKS Super Turbo Muffler',
    description: 'HKS low back-pressure stainless steel dual catback exhaust system for Mitsubishi Lancer Evolution X. Very subtle cruising acoustics, unleashes full rally notes under load.',
    price: 4200.00,
    condition: 'Good',
    category: 'Exhaust',
    location: 'Taiping, Perak',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Momo Prototipo Steering Wheel',
    description: 'Classic 350mm black leather steering wheel with iconic tri-spokes structure. Includes horn button. Adds a premium look to retro retrofitted dynamic cockpits.',
    price: 850.00,
    condition: 'Like New',
    category: 'Accessories',
    location: 'Manjung, Perak',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Autel OBD2 Professional Diagnostics Scanner',
    description: 'Autel professional grade auto mechanics system scanner. Reads all sensors, modules, resets oil services and matches battery registries. Supports over 80 European and Asian brands.',
    price: 1600.00,
    condition: 'Like New',
    category: 'Tools',
    location: 'Kuala Lumpur, Wilayah Persekutuan',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Yokohama Advan Neova AD09 Pairs',
    description: 'Two hyper-grip tracking semi-slick dry tires in size 255/35 R19. Extemely sticky compound, provides amazing lateral stability and braking response, low track wear heatcycles.',
    price: 1550.00,
    condition: 'New',
    category: 'Tyres & Rims',
    location: 'Puchong, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Mishimoto Aluminum Radiator (Civic)',
    description: 'Premium Mishimoto full aircraft grade TIG-welded dual core aluminum radiator. Delivers over 35 percent improved coolant efficiency. Drop-in fitment with original mounts.',
    price: 1150.00,
    condition: 'New',
    category: 'Parts',
    location: 'Cyberjaya, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Whiteline Adjustable Anti-Roll Bar',
    description: '24mm heavy duty adjustable front sway control bar for Subaru WRX models. Prevents vehicle rolling on corner turns, completely eliminates understeers.',
    price: 880.00,
    condition: 'Good',
    category: 'Suspension',
    location: 'Butterworth, Penang',
    imageUrl: 'https://images.unsplash.com/photo-1600706432502-75e0e03be229?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Endless RF-650 Brake Fluid (1L)',
    description: 'Premium performance brake fluid used in Formula 1 and WRC racing. High boiling point of over 320 degrees, delivers incredibly stiff brake pedal feel under extreme temperature loads.',
    price: 220.00,
    condition: 'New',
    category: 'Brakes',
    location: 'Bangi, Selangor',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: '[SeedMock] Skunk2 Pro Series Intake (K-Series)',
    description: 'Cast aluminum intake manifold for Honda K20A/K24A engines. Oversised runners and plenum structure designed to unleash huge volumetric power peaks with larger throttle body.',
    price: 1450.00,
    condition: 'Good',
    category: 'Parts',
    location: 'Sibu, Sarawak',
    imageUrl: 'https://images.unsplash.com/photo-1582266255765-ab5e5a61d918?auto=format&fit=crop&q=80&w=600'
  }
];

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('Seeding marketplace listings via Supabase Client...');

  // 1. Get an active user id
  const { data: users, error: userError } = await client.from('users').select('id').limit(1);
  if (userError || !users?.length) {
    console.error('No profiles / users found to assign the seed items as seller:', userError);
    process.exit(1);
  }
  const sellerId = users[0].id;
  console.log(`Setting seller id as: ${sellerId}`);

  // 2. Clear old seeded listings
  console.log('Cleaning existing mock items with [SeedMock] name prefix...');
  const { error: deleteError } = await client.from('marketplace_listings').delete().like('title', '%[SeedMock]%');
  if (deleteError) {
    console.error('Failed to clean up old mock listings:', deleteError);
  }

  // 3. Inject new mock listings
  console.log(`Injecting ${mockListings.length} premium automotive products...`);
  let count = 0;
  for (const item of mockListings) {
    const { data: listing, error: listError } = await client.from('marketplace_listings').insert({
      user_id: sellerId,
      title: item.title,
      description: item.description,
      price: item.price,
      condition: item.condition,
      category: item.category,
      location: item.location,
      status: 'active'
    }).select('id').single();

    if (listError) {
      console.error(`Error inserting listing '${item.title}':`, listError);
      continue;
    }

    // Insert image
    const { error: imgError } = await client.from('marketplace_images').insert({
      listing_id: listing.id,
      image_url: item.imageUrl,
      sort_order: 0
    });

    if (imgError) {
      console.error(`Error inserting image for '${item.title}':`, imgError);
    } else {
      count++;
      console.log(`Successfully injected [${count}/${mockListings.length}]: ${item.title}`);
    }
  }

  console.log(`Finished seeding! Total injected successfully: ${count}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal crash during query seed setup execution:', err);
  process.exit(1);
});
