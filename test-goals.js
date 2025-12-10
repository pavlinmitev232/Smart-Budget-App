const http = require('http');

const BASE_URL = 'http://localhost:5000';
let TOKEN = '';

// Helper function to make HTTP requests
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ rawBody: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('🧪 TESTING STORY 9.1 - Goals API\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Login
    console.log('📝 Logging in...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'goaltest@example.com',
      password: 'SecurePass123@',
    });
    TOKEN = loginRes.data?.token;
    console.log('✅ Login successful\n');

    // TEST 1: Create Goal - Emergency Fund
    console.log('TEST 1: Create Goal (Emergency Fund)');
    const goal1 = await request('POST', '/api/goals', {
      name: 'Emergency Fund',
      goal_type: 'savings',
      target_amount: 5000,
      priority: 'high',
      deadline: '2026-06-30',
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('✅ Result:', JSON.stringify(goal1, null, 2));
    console.log('');

    // TEST 2: Create Goal - Vacation
    console.log('TEST 2: Create Goal (Dream Vacation)');
    const goal2 = await request('POST', '/api/goals', {
      name: 'Dream Vacation',
      goal_type: 'purchase',
      target_amount: 3000,
      current_amount: 500,
      priority: 'medium',
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('✅ Result:', JSON.stringify(goal2, null, 2));
    console.log('');

    // TEST 3: Get All Goals
    console.log('TEST 3: Get All Goals');
    const allGoals = await request('GET', '/api/goals', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('✅ Goals:', JSON.stringify(allGoals, null, 2));
    console.log('');

    // TEST 4: Allocate Money to Goal
    console.log('TEST 4: Allocate $1000 to Emergency Fund');
    const allocated = await request('POST', '/api/goals/1/allocate', {
      amount: 1000,
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('✅ Result:', JSON.stringify(allocated, null, 2));
    console.log('');

    // TEST 5: Get Single Goal
    console.log('TEST 5: Get Goal 1 Details');
    const goal1Details = await request('GET', '/api/goals/1', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('✅ Goal Details:', JSON.stringify(goal1Details, null, 2));
    console.log('');

    // TEST 6: Create 3rd Goal
    console.log('TEST 6: Create 3rd Goal (Car Fund)');
    const goal3 = await request('POST', '/api/goals', {
      name: 'Car Fund',
      goal_type: 'purchase',
      target_amount: 20000,
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('✅ Result:', JSON.stringify(goal3, null, 2));
    console.log('');

    // TEST 7: Tier Limit - Try to create 4th goal (should fail for Free tier)
    console.log('TEST 7: Try to Create 4th Goal (Should Hit Tier Limit)');
    const goal4 = await request('POST', '/api/goals', {
      name: 'House Down Payment',
      goal_type: 'savings',
      target_amount: 50000,
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('✅ Result:', JSON.stringify(goal4, null, 2));
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETE!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
