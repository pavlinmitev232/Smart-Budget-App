const http = require('http');

const BASE_URL = 'http://localhost:5000';
let TOKEN = '';

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

async function runTests() {
  console.log('🧪 TESTING UPDATE & DELETE ENDPOINTS\n');
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

    // TEST 1: Update Goal - Change name and priority
    console.log('TEST 1: PUT /api/goals/:id - Update Goal 1 (Change Name & Priority)');
    const updateRes = await request('PUT', '/api/goals/1', {
      name: 'Emergency Fund - Updated',
      priority: 'medium',
      current_amount: 1500,
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('Result:', JSON.stringify(updateRes, null, 2));
    console.log('');

    // TEST 2: Verify update worked
    console.log('TEST 2: GET /api/goals/1 - Verify Update');
    const verifyUpdate = await request('GET', '/api/goals/1', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('Updated Goal:', JSON.stringify(verifyUpdate.data.goal, null, 2));
    console.log('✅ Name changed:', verifyUpdate.data.goal.name === 'Emergency Fund - Updated');
    console.log('✅ Priority changed:', verifyUpdate.data.goal.priority === 'medium');
    console.log('✅ Current amount:', verifyUpdate.data.goal.currentAmount);
    console.log('');

    // TEST 3: Update with invalid data (should fail validation)
    console.log('TEST 3: PUT /api/goals/:id - Update with Invalid Data (negative amount)');
    const invalidUpdate = await request('PUT', '/api/goals/1', {
      target_amount: -100,
    }, { Authorization: `Bearer ${TOKEN}` });
    console.log('Result:', JSON.stringify(invalidUpdate, null, 2));
    console.log('');

    // TEST 4: Delete Goal
    console.log('TEST 4: DELETE /api/goals/:id - Soft Delete Goal 2');
    const deleteRes = await request('DELETE', '/api/goals/2', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('Delete Result:', JSON.stringify(deleteRes, null, 2));
    console.log('');

    // TEST 5: Verify deletion (should be archived)
    console.log('TEST 5: GET /api/goals - Verify Goal 2 is Archived');
    const allGoals = await request('GET', '/api/goals', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('Active Goals Count:', allGoals.data.count);
    console.log('Active Goals:', allGoals.data.goals.map(g => ({ id: g.id, name: g.name, status: g.status })));
    console.log('✅ Goal 2 removed from active list:', !allGoals.data.goals.find(g => g.id === 2));
    console.log('');

    // TEST 6: Get all goals including archived
    console.log('TEST 6: GET /api/goals?status=archived - Get Archived Goals');
    const archivedGoals = await request('GET', '/api/goals?status=archived', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('Archived Goals:', JSON.stringify(archivedGoals, null, 2));
    console.log('✅ Goal 2 is archived:', archivedGoals.data.goals.some(g => g.id === 2 && g.status === 'archived'));
    console.log('');

    // TEST 7: Try to delete non-existent goal
    console.log('TEST 7: DELETE /api/goals/999 - Delete Non-Existent Goal (Should Return 404)');
    const deleteNonExistent = await request('DELETE', '/api/goals/999', null, {
      Authorization: `Bearer ${TOKEN}`,
    });
    console.log('Result:', JSON.stringify(deleteNonExistent, null, 2));
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL UPDATE & DELETE TESTS COMPLETE!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
