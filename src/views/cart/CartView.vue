<template>
  <div class="cart-container container mx-auto px-4 py-8">
    <el-card shadow="never" class="cart-card">
      <template #header>
        <div class="cart-header">
          <h2 class="text-xl font-bold">我的购物车</h2>
          <el-button type="danger" plain size="small" :disabled="!selectedItems.length" @click="handleClearSelected">
            清空选中
          </el-button>
        </div>
      </template>

      <!-- 购物车为空 -->
      <el-empty v-if="!cartItems.length" description="购物车是空的">
        <el-button type="primary" @click="router.push('/products')">
          去购物
        </el-button>
      </el-empty>

      <!-- 购物车列表 -->
      <template v-else>
        <el-table ref="tableRef" :data="cartItems" style="width: 100%" @selection-change="handleSelectionChange">
          <!-- 选择框 -->
          <el-table-column type="selection" width="55" />

          <!-- 商品信息 -->
          <el-table-column label="商品信息" min-width="400">
            <template #default="{ row }">
              <div class="product-info">
                <el-image :src="row.image" class="product-image" :preview-src-list="[row.image]" />
                <div class="product-details">
                  <router-link :to="`/products/${row.productId}`" class="product-name">
                    {{ row.name }}
                  </router-link>
                  <div class="product-stock" v-if="row.stock <= 5">
                    仅剩 {{ row.stock }} 件
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 单价 -->
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>

          <!-- 数量 -->
          <el-table-column label="数量" width="200">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="row.stock || 99" size="small"
                @change="(value) => handleQuantityChange(row, value)" />
            </template>
          </el-table-column>

          <!-- 小计 -->
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="subtotal">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleRemoveItem(row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 购物车底部 -->
        <div class="cart-footer">
          <div class="cart-footer-left">
            <el-checkbox v-model="selectAll" @change="handleSelectAll">
              全选
            </el-checkbox>
            <span class="selected-count" v-if="selectedItems.length">
              已选 {{ selectedItems.length }} 件商品
            </span>
          </div>
          <div class="cart-footer-right">
            <div class="total-info">
              <span class="total-label">合计：</span>
              <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button type="primary" size="large" :disabled="!selectedItems.length" @click="handleCheckout">
              结算 ({{ selectedItems.length }})
            </el-button>
          </div>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const tableRef = ref(null)
const cartItems = ref([])
const selectedItems = ref([])
const selectAll = ref(false)

// 获取购物车数据
const fetchCartItems = async () => {
  try {
    const response = await axios.get('http://localhost:3000/cart')
    const items = response.data

    // 获取每个商品的库存信息
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const productResponse = await axios.get(`http://localhost:3000/products/${item.productId}`)
        return {
          ...item,
          stock: productResponse.data.stock
        }
      })
    )

    cartItems.value = itemsWithStock
  } catch (error) {
    ElMessage.error('获取购物车数据失败')
  }
}

// 更新商品数量
const handleQuantityChange = async (item, value) => {
  try {
    await axios.patch(`http://localhost:3000/cart/${item.id}`, {
      quantity: value
    })
    ElMessage.success('数量已更新')
  } catch (error) {
    ElMessage.error('更新失败')
    // 恢复原数量
    await fetchCartItems()
  }
}

// 移除商品
const handleRemoveItem = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定要移除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.delete(`http://localhost:3000/cart/${itemId}`)
    await fetchCartItems()
    ElMessage.success('商品已移除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

// 清空选中商品
const handleClearSelected = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空选中的商品吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await Promise.all(
      selectedItems.value.map(item =>
        axios.delete(`http://localhost:3000/cart/${item.id}`)
      )
    )

    await fetchCartItems()
    ElMessage.success('已清空选中商品')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
  selectAll.value = selection.length === cartItems.value.length
}

// 全选处理
const handleSelectAll = (val) => {
  if (val) {
    tableRef.value?.toggleAllSelection()
  } else {
    tableRef.value?.clearSelection()
  }
}

// 计算总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
})

// 结算处理
const handleCheckout = () => {
  // 创建订单
  const order = {
    items: selectedItems.value,
    totalAmount: totalPrice.value,
    status: 'pending',
    createTime: new Date().toISOString()
  }

  // 将订单信息存储到 localStorage
  localStorage.setItem('pendingOrder', JSON.stringify(order))

  // 跳转到订单确认页
  router.push('/orders/confirm')
}

// 初始化
onMounted(() => {
  fetchCartItems()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name {
  color: #303133;
  text-decoration: none;
  font-weight: 500;
}

.product-name:hover {
  color: var(--el-color-primary);
}

.product-stock {
  color: #f56c6c;
  font-size: 0.875rem;
}

.price,
.subtotal {
  color: #606266;
  font-weight: 500;
}

.cart-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-footer-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.selected-count {
  color: #606266;
  font-size: 0.875rem;
}

.total-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.total-label {
  color: #606266;
}

.total-price {
  color: #f56c6c;
  font-size: 1.5rem;
  font-weight: 600;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
