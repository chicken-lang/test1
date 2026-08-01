import { createHash } from 'crypto'

const BASE = 'http://localhost:3001/api/v1'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } }
  catch { return { status: res.status, data: text } }
}

async function main() {
  // Step 1: Login
  const password = 'admin123'
  const sha256Hex = createHash('sha256').update(password).digest('hex')
  console.log('Password SHA-256:', sha256Hex)

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'column_admin', password: sha256Hex }),
  })
  console.log('Login:', JSON.stringify(loginRes, null, 2))

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.log('Login failed, exiting')
    return
  }

  const token = loginRes.data.data.token
  const headers = { Authorization: `Bearer ${token}` }

  // Step 2: Get column tree
  console.log('\n--- Column Tree ---')
  const treeRes = await request('/column/tree', { headers })
  console.log('Tree:', JSON.stringify(treeRes, null, 2))

  // Step 3: Test sort - reorder columns
  console.log('\n--- Sort Test ---')
  if (treeRes.data?.data) {
    const items = treeRes.data.data.map(c => ({ columnId: c.id, sortOrder: c.sortOrder + 10 }))
    console.log('Sort payload:', JSON.stringify(items))

    const sortRes = await request('/column/sort', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ items }),
    })
    console.log('Sort result:', JSON.stringify(sortRes, null, 2))

    // Verify the sort order was updated
    const treeAfterSort = await request('/column/tree', { headers })
    console.log('Tree after sort:', JSON.stringify(treeAfterSort.data?.data?.map(c => ({
      id: c.id, columnName: c.columnName, sortOrder: c.sortOrder
    })), null, 2))
  }

  // Step 4: Test disable a column
  console.log('\n--- Disable Test ---')
  const allTree = await request('/column/tree', { headers })
  const firstCol = allTree.data?.data?.[0]
  if (firstCol) {
    console.log(`Disabling column "${firstCol.columnName}" (id=${firstCol.id})...`)
    const disableRes = await request(`/column/${firstCol.id}/disable`, {
      method: 'PUT',
      headers,
    })
    console.log('Disable result:', JSON.stringify(disableRes, null, 2))

    // Verify status changed
    const treeAfterDisable = await request('/column/tree', { headers })
    console.log('Tree after disable:', JSON.stringify(treeAfterDisable.data?.data?.map(c => ({
      id: c.id, columnName: c.columnName, status: c.status
    })), null, 2))

    // Re-enable it
    console.log(`\nRe-enabling column "${firstCol.columnName}"...`)
    const enableRes = await request(`/column/${firstCol.id}/enable`, {
      method: 'PUT',
      headers,
    })
    console.log('Enable result:', JSON.stringify(enableRes, null, 2))
  }

  // Step 5: Test disable with children (should fail)
  console.log('\n--- Disable with children (negative test) ---')
  // Create a child column under first column first
  if (firstCol) {
    const childRes = await request('/column', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        columnName: '子栏目测试',
        columnSlug: 'child-test-' + Date.now(),
        parentId: firstCol.id,
        sortOrder: 1,
      }),
    })
    console.log('Create child column:', JSON.stringify(childRes, null, 2))

    if (childRes.status === 200) {
      // Try to disable parent - should fail because it has children
      const disableParentRes = await request(`/column/${firstCol.id}/disable`, {
        method: 'PUT',
        headers,
      })
      console.log('Disable parent (should fail):', JSON.stringify(disableParentRes, null, 2))

      // Delete child first
      // ... (no delete endpoint exists, let's just note this)
    }
  }

  console.log('\n✅ All tests completed!')
}

main().catch(e => console.error('Test error:', e))