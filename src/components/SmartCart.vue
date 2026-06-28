
<template>
  <div class="smart-cart">
    <h1>🛒 Vue 3 智能购物车系统</h1>
    <h2>深圳信息技术职业大学</h2>
    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <input 
        v-model="searchQuery" 
        placeholder="搜索商品..." 
        class="search-input"
      />
      
      <div class="filter-controls">
        <select v-model="priceFilter" class="filter-select">
          <option value="">全部价格</option>
          <option value="0-1000">1000元以下</option>
          <option value="1000-5000">1000-5000元</option>
          <option value="5000-10000">5000-10000元</option>
          <option value="10000+">10000元以上</option>
        </select>
        
        <select v-model="sortBy" class="filter-select">
          <option value="default">默认排序</option>
          <option value="price-asc">价格升序</option>
          <option value="price-desc">价格降序</option>
          <option value="name">名称排序</option>
        </select>
      </div>
    </div>

    <!-- 购物车表格 -->
    <table class="cart-table">
      <thead>
        <tr>
          <th>商品</th>
          <th>单价</th>
          <th>数量</th>
          <th>小计</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredCartItems" :key="item.id">
          <td class="product-name">{{ item.name }}</td>
          <td class="product-price">{{ formatPrice(item.price) }}</td>
          <td>
            <div class="quantity-control">
              <button 
                @click="decreaseQuantity(item)" 
                :disabled="item.quantity <= 1"
                class="qty-btn"
              >-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button 
                @click="increaseQuantity(item)" 
                class="qty-btn"
              >+</button>
            </div>
          </td>
          <td class="subtotal">{{ formatPrice(item.price * item.quantity) }}</td>
          <td>
            <button @click="removeItem(item.id)" class="remove-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 购物车统计 -->
    <div v-if="cartItems.length > 0 || hasHistory" class="cart-stats">
      <h3>📊 购物车统计</h3>
      <div class="stats-content">
        <p>商品总数：<strong>{{ totalItems }}</strong> 件</p>
        <p>商品种类：<strong>{{ totalTypes }}</strong> 种</p>
        <p v-if="mostExpensiveItem">最贵商品：<strong>{{ mostExpensiveItem.name }}</strong>（{{ formatPrice(mostExpensiveItem.price) }}）</p>
        <p v-if="cheapestItem">最便宜商品：<strong>{{ cheapestItem.name }}</strong>（{{ formatPrice(cheapestItem.price) }}）</p>
        <p>应付总额：<strong class="total-amount">{{ formatPrice(finalTotal) }}</strong></p>
      </div>
      <div class="stats-buttons">
        <button 
          @click="clearCart" 
          :disabled="cartItems.length === 0"
          :class="{ 'disabled-btn': cartItems.length === 0 }"
          class="clear-cart-btn"
        >清空购物车</button>
        <button 
          @click="checkout" 
          :disabled="cartItems.length === 0"
          :class="{ 'disabled-btn': cartItems.length === 0 }"
          class="checkout-btn"
        >结算</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 搜索和筛选
const searchQuery = ref('')
const priceFilter = ref('')
const sortBy = ref('default')

// 历史记录标志
const hasHistory = ref(false)

// 购物车数据（初始化时就加载示例商品）
const cartItems = ref([
  {
    id: 1,
    name: 'iPhone 15',
    price: 7999.00,
    quantity: 1
  },
  {
    id: 2,
    name: 'MacBook Pro',
    price: 14999.00,
    quantity: 1
  },
  {
    id: 3,
    name: 'AirPods Pro',
    price: 1999.00,
    quantity: 2
  },
  {
    id: 4,
    name: 'iPad Air',
    price: 4799.00,
    quantity: 1
  },
  {
    id: 5,
    name: 'Magic Mouse',
    price: 499.00,
    quantity: 1
  }
])

// ✅ 计算属性：筛选后的购物车商品
const filteredCartItems = computed(() => {
  let items = [...cartItems.value]
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }
  
  // 按价格区间筛选
  if (priceFilter.value) {
    const [min, max] = priceFilter.value.split('-').map(p => {
      return p === '10000+' ? 10000 : parseInt(p)
    })
    
    if (priceFilter.value === '10000+') {
      items = items.filter(item => item.price >= 10000)
    } else {
      items = items.filter(item => item.price >= min && item.price < max)
    }
  }
  
  // 排序
  switch (sortBy.value) {
    case 'price-asc':
      items.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      items.sort((a, b) => b.price - a.price)
      break
    case 'name':
      items.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  
  return items
})

// ✅ 计算属性：商品总数
const totalItems = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

// ✅ 计算属性：商品种类数
const totalTypes = computed(() => {
  return cartItems.value.length
})

// ✅ 计算属性：最贵的商品
const mostExpensiveItem = computed(() => {
  if (cartItems.value.length === 0) return null
  return cartItems.value.reduce((max, item) => 
    item.price > max.price ? item : max
  , cartItems.value[0])
})

// ✅ 计算属性：最便宜的商品
const cheapestItem = computed(() => {
  if (cartItems.value.length === 0) return null
  return cartItems.value.reduce((min, item) => 
    item.price < min.price ? item : min
  , cartItems.value[0])
})

// ✅ 计算属性：应付总额
const finalTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
})

// ❌ 方法：格式化价格（需要参数）
const formatPrice = (price) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(price)
}

// ❌ 方法：添加示例商品（事件处理，有副作用）
const addSampleProducts = () => {
  cartItems.value = sampleProducts.map(product => ({
    ...product,
    quantity: product.quantity || 1
  }))
}

// ❌ 方法：增加数量（事件处理）
const increaseQuantity = (item) => {
  item.quantity++
}

// ❌ 方法：减少数量（事件处理）
const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--
  }
}

// ❌ 方法：删除商品（事件处理）
const removeItem = (itemId) => {
  const index = cartItems.value.findIndex(item => item.id === itemId)
  if (index > -1) {
    cartItems.value.splice(index, 1)
  }
}

// ❌ 方法：结算（事件处理，有副作用）
const checkout = () => {
  if (cartItems.value.length === 0) return
  
  const orderInfo = {
    items: cartItems.value,
    totalItems: totalItems.value,
    totalAmount: finalTotal.value
  }
  
  console.log('订单信息:', orderInfo)
  alert(`结算成功！\n商品总数: ${totalItems.value} 件\n总金额: ${formatPrice(finalTotal.value)}`)
  
  // 标记有历史记录
  hasHistory.value = true
  // 清空购物车
  cartItems.value = []
}

// ❌ 方法：清空购物车（事件处理，有副作用）
const clearCart = () => {
  if (confirm('确定要清空购物车吗？')) {
    // 标记有历史记录
    hasHistory.value = true
    cartItems.value = []
  }
}

</script>

<style scoped>
.smart-cart {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #42b983;
  text-align: center;
  margin-bottom: 30px;
  font-size: 32px;
}

.filter-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #42b983;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.cart-table thead {
  background-color: #42b983;
  color: white;
}

.cart-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 16px;
}

.cart-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.cart-table tbody tr:hover {
  background-color: #f9f9f9;
}

.product-name {
  font-weight: 600;
  color: #333;
}

.product-price {
  color: #666;
  font-weight: 500;
}

.subtotal {
  color: #42b983;
  font-weight: 600;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #42b983;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: background-color 0.3s;
}

.qty-btn:hover:not(:disabled) {
  background-color: #369974;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  font-weight: bold;
  min-width: 30px;
  text-align: center;
  font-size: 16px;
}

.remove-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #369974;
}

.cart-stats {
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cart-stats h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
}

.stats-content {
  margin-bottom: 20px;
}

.stats-content p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-message {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 20px 0;
}

.total-amount {
  font-size: 28px;
  color: #ffd700;
}

.disabled-btn {
  background-color: #ccc !important;
  color: #999 !important;
  cursor: not-allowed !important;
  opacity: 0.6;
  transform: none !important;
  box-shadow: none !important;
}

.disabled-btn:hover {
  background-color: #ccc !important;
  transform: none !important;
  box-shadow: none !important;
}

.stats-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.clear-cart-btn {
  flex: 1;
  padding: 15px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-cart-btn:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.checkout-btn {
  flex: 1;
  padding: 15px;
  background-color: #ffd700;
  color: #333;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.checkout-btn:hover {
  background-color: #ffed4e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

@media (max-width: 768px) {
  .cart-table {
    font-size: 14px;
  }
  
  .cart-table th,
  .cart-table td {
    padding: 10px 8px;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>
