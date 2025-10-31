const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testHierarchy() {
  try {
    console.log('🧪 Testing Farm Hierarchy System...\n');

    // Test 1: Create a farm
    console.log('1️⃣ Creating a test farm...');
    const farmResponse = await axios.post(`${API_URL}/farms`, {
      name: 'Test Farm',
      area: 10.5,
      soilType: 'Loam',
      coordinates: [],
      soilHealth: { ph: 6.8, moisture: 45, temperature: 22 }
    });
    const farmId = farmResponse.data.id;
    console.log(`✅ Farm created with ID: ${farmId}`);

    // Test 2: Create a section
    console.log('\n2️⃣ Creating a section in the farm...');
    const sectionResponse = await axios.post(`${API_URL}/sections`, {
      farmId: farmId,
      name: 'North Section',
      area: 5.0,
      description: 'Northern part of the farm'
    });
    const sectionId = sectionResponse.data.id;
    console.log(`✅ Section created with ID: ${sectionId}`);

    // Test 3: Create a block
    console.log('\n3️⃣ Creating a block in the section...');
    const blockResponse = await axios.post(`${API_URL}/blocks`, {
      sectionId: sectionId,
      name: 'Block A1',
      area: 2.5,
      cropType: 'Tomatoes',
      status: 'active'
    });
    const blockId = blockResponse.data.id;
    console.log(`✅ Block created with ID: ${blockId}`);

    // Test 4: Create a bed
    console.log('\n4️⃣ Creating a bed in the block...');
    const bedResponse = await axios.post(`${API_URL}/beds`, {
      blockId: blockId,
      name: 'Bed 1',
      length: 10.0,
      width: 1.2,
      plantCount: 50,
      status: 'active'
    });
    const bedId = bedResponse.data.id;
    console.log(`✅ Bed created with ID: ${bedId}`);

    // Test 5: Create a drip line
    console.log('\n5️⃣ Creating a drip line in the bed...');
    const driplineResponse = await axios.post(`${API_URL}/driplines`, {
      bedId: bedId,
      name: 'Drip Line 1',
      length: 10.0,
      flowRate: 2.5,
      status: 'working'
    });
    const driplineId = driplineResponse.data.id;
    console.log(`✅ Drip line created with ID: ${driplineId}`);

    // Test 6: Verify hierarchy
    console.log('\n6️⃣ Verifying the complete hierarchy...');
    
    const sections = await axios.get(`${API_URL}/sections/farm/${farmId}`);
    console.log(`📋 Sections in farm: ${sections.data.length}`);
    
    const blocks = await axios.get(`${API_URL}/blocks/section/${sectionId}`);
    console.log(`📋 Blocks in section: ${blocks.data.length}`);
    
    const beds = await axios.get(`${API_URL}/beds/block/${blockId}`);
    console.log(`📋 Beds in block: ${beds.data.length}`);
    
    const driplines = await axios.get(`${API_URL}/driplines/bed/${bedId}`);
    console.log(`📋 Drip lines in bed: ${driplines.data.length}`);

    console.log('\n🎉 Hierarchy test completed successfully!');
    console.log('\n📊 Structure created:');
    console.log(`Farm: ${farmResponse.data.name}`);
    console.log(`└── Section: ${sectionResponse.data.name}`);
    console.log(`    └── Block: ${blockResponse.data.name} (${blockResponse.data.cropType})`);
    console.log(`        └── Bed: ${bedResponse.data.name} (${bedResponse.data.length}m x ${bedResponse.data.width}m)`);
    console.log(`            └── Drip Line: ${driplineResponse.data.name} (${driplineResponse.data.flowRate} L/h)`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testHierarchy();