<template>
  <div class="orders-container container mx-auto px-4 py-8">
    <!-- 订单筛选 -->
    <el-card shadow="never" class="mb-6">
      <div class="filter-section">
        <el-radio-group v-model="currentStatus" @change="handleStatusChange">
          <el-radio-button label="">全部订单</el-radio-button>
          <el-radio-button label="pending">待付款</el-radio-button>
          <el-radio-button label="paid">已付款</el-radio-button>
          <el-radio-button label="shipped">已发货</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="cancelled">已取消</el-radio-button>
        </el-radio-group>

        <div class="search-section">
          <el-input v-model="searchKeyword" placeholder="搜索订单号或商品名称" clearable @clear="handleSearch"
            @keyup.enter="handleSearch">
            <template #append>
              <el-button @click="handleSearch">
                <el-icon>
                  <Search />
                </el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- 订单列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <el-empty v-else-if="!orders.length" :description="currentStatus ? `暂无${getStatusText(currentStatus)}订单` : '暂无订单'">
      <el-button type="primary" @click="$router.push('/products')">
        去购物
      </el-button>
    </el-empty>

    <template v-else>
      <el-card v-for="order in orders" :key="order.id" class="order-card mb-4" shadow="hover">
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="order-info">
            <span class="order-time">{{ formatDate(order.createTime) }}</span>
            <el-divider direction="vertical" />
            <span class="order-id">订单号：{{ order.id }}</span>
          </div>
          <el-tag :type="getStatusType(order.status)">
            {{ getStatusText(order.status) }}
          </el-tag>
        </div>

        <!-- 订单商品 -->
        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item"
            @click="$router.push(`/products/${item.productId}`)">
            <el-image :src="item.image" class="item-image" :preview-src-list="[item.image]" />
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">
                <span class="price">¥{{ item.price }}</span>
                <span class="quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 订单底部 -->
        <div class="order-footer">
          <div class="order-amount">
            <span>共 {{ getTotalItems(order) }} 件商品</span>
            <span class="total-label">实付金额：</span>
            <span class="total-amount">¥{{ calculateTotalAmount(order) }}</span>
          </div>

          <div class="order-actions">
            <el-button v-if="order.status === 'pending'" type="primary" @click="handlePay(order)">
              立即付款
            </el-button>
            <el-button v-if="order.status === 'shipped'" type="success" @click="handleConfirmReceive(order)">
              确认收货
            </el-button>
            <el-button v-if="order.status === 'pending'" type="danger" plain @click="handleCancel(order)">
              取消订单
            </el-button>
            <el-button plain @click="$router.push(`/orders/${order.id}`)">
              查看详情
            </el-button>
            <el-button v-if="order.status === 'completed'" type="primary" plain @click="handleBuyAgain(order)">
              再次购买
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="totalOrders"
          :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 状态管理
const loading = ref(true)
const orders = ref([])
const currentStatus = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalOrders = ref(0)

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    let params = {
      _sort: 'createTime',
      _order: 'desc'
    }
    
    // 添加筛选条件
    if (currentStatus.value) {
      params.status = currentStatus.value
    }
    if (searchKeyword.value) {
      params.q = searchKeyword.value
    }

    // 获取总数的请求
    const totalRequest = axios.get('http://localhost:3000/orders', { params })

    // 添加分页参数到请求
    const pageParams = {
      ...params,
      _page: currentPage.value,
      _limit: pageSize.value
    }

    // 获取分页数据的请求
    const pageRequest = axios.get('http://localhost:3000/orders', { 
      params: pageParams,
      // 添加验证以确保响应头包含总数
      validateStatus: function (status) {
        return status >= 200 && status < 300
      }
    })

    // 并行执行请求
    const [totalResponse, ordersResponse] = await Promise.all([
      totalRequest,
      pageRequest
    ])

    orders.value = ordersResponse.data
    totalOrders.value = totalResponse.data.length
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 状态文字
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'paid': 'info',
    'shipped': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || ''
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 计算订单商品总数
const getTotalItems = (order) => {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

// 计算订单总金额
const calculateTotalAmount = (order) => {
  // 计算商品总价
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity))
  }, 0)

  // 添加运费（如果有）
  const shippingFee = Number(order.shippingFee || 0)

  // 返回总金额
  return (itemsTotal + shippingFee).toFixed(2)
}

// 处理状态变化
const handleStatusChange = () => {
  currentPage.value = 1
  fetchOrders()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

// 处理分页
const handleSizeChange = () => {
  currentPage.value = 1
  fetchOrders()
}

const handleCurrentChange = () => {
  fetchOrders()
}

// 支付订单
const handlePay = async (order) => {
  try {
    await ElMessageBox.confirm('确定要支付该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await axios.patch(`http://localhost:3000/orders/${order.id}`, {
      status: 'paid',
      payTime: new Date().toISOString()
    })

    await fetchOrders()
    ElMessage.success('支付成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败')
    }
  }
}

// 确认收货
const handleConfirmReceive = async (order) => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await axios.patch(`http://localhost:3000/orders/${order.id}`, {
      status: 'completed',
      completeTime: new Date().toISOString()
    })

    await fetchOrders()
    ElMessage.success('确认收货成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 取消订单
const handleCancel = async (order) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.patch(`http://localhost:3000/orders/${order.id}`, {
      status: 'cancelled',
      cancelTime: new Date().toISOString()
    })

    await fetchOrders()
    ElMessage.success('订单已取消')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 再次购买
const handleBuyAgain = async (order) => {
  try {
    // 将商品添加到购物车
    await Promise.all(
      order.items.map(item =>
        axios.post('http://localhost:3000/cart', {
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity
        })
      )
    )

    ElMessage.success('已添加到购物车')
    router.push('/cart')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-section {
  width: 300px;
}

.order-card {
  transition: all 0.3s;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #606266;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 0;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.order-item:hover {
  background-color: #f5f7fa;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.item-info {
  flex: 1;
  min-width: 200px;
}

.item-name {
  margin-bottom: 0.5rem;
  color: #303133;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price {
  color: #f56c6c;
  font-weight: 500;
}

.quantity {
  color: #909399;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #ebeef5;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.total-label {
  color: #606266;
}

.total-amount {
  color: #f56c6c;
  font-size: 1.25rem;
  font-weight: 600;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
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
