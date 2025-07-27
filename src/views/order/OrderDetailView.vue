<template>
  <div class="order-detail container mx-auto px-4 py-8">
    <!-- 面包屑导航 -->
    <el-breadcrumb class="mb-6">
      <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
      <el-breadcrumb-item to="/orders">我的订单</el-breadcrumb-item>
      <el-breadcrumb-item>订单详情</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <el-card v-else-if="order" class="order-card" shadow="never">
      <!-- 订单状态栏 -->
      <div class="status-bar mb-6">
        <el-steps :active="getStatusStep()" finish-status="success">
          <el-step title="提交订单" :description="formatDate(order.createTime)" />
          <el-step title="付款成功" :description="order.payTime ? formatDate(order.payTime) : ''" />
          <el-step title="商品发货" :description="order.shipTime ? formatDate(order.shipTime) : ''" />
          <el-step title="交易完成" :description="order.completeTime ? formatDate(order.completeTime) : ''" />
        </el-steps>
      </div>

      <!-- 订单信息 -->
      <el-descriptions title="订单信息" :column="2" border>
        <el-descriptions-item label="订单编号">{{ order.id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType()">{{ getStatusText() }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDate(order.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="付款时间">{{ order.payTime ? formatDate(order.payTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ order.shipTime ? formatDate(order.shipTime) : '-'
          }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ order.completeTime ? formatDate(order.completeTime) : '-'
          }}</el-descriptions-item>
      </el-descriptions> <!-- 收货信息 -->
      <el-descriptions class="mt-6" title="收货信息" :column="1" border>
        <el-descriptions-item label="收货人">{{ order.delivery.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.delivery.phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ order.delivery.address }}</el-descriptions-item>
      </el-descriptions>

      <!-- 商品列表 -->
      <div class="mt-6">
        <h3 class="text-lg font-medium mb-4">商品信息</h3>
        <el-table :data="order.items" style="width: 100%">
          <el-table-column label="商品信息" min-width="400">
            <template #default="{ row }">
              <div class="product-info">
                <el-image :src="row.image" class="product-image" :preview-src-list="[row.image]" />
                <div class="product-details">
                  <router-link :to="`/products/${row.productId}`" class="product-name">
                    {{ row.name }}
                  </router-link>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <span>x{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="subtotal">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div> <!-- 订单金额信息 -->
      <div class="amount-info mt-6">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="商品总额">¥{{ calculateItemsTotal() }}</el-descriptions-item>
          <el-descriptions-item label="运费">¥{{ calculateShippingFee() }}</el-descriptions-item>
          <el-descriptions-item label="实付金额" class="total-amount">
            ¥{{ calculateTotalAmount() }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons mt-6" v-if="order.status !== 'completed'">
        <el-button v-if="order.status === 'pending'" type="primary" @click="handlePay">
          立即付款
        </el-button>
        <el-button v-if="order.status === 'shipped'" type="success" @click="handleConfirmReceive">
          确认收货
        </el-button>
        <el-button v-if="order.status === 'pending'" type="danger" plain @click="handleCancel">
          取消订单
        </el-button>
      </div>
    </el-card>

    <el-empty v-else description="订单不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:3000/orders/${route.params.id}`)
    if (!response.data) {
      ElMessage.error('订单不存在')
      router.push('/orders')
      return
    }
    order.value = response.data
  } catch (error) {
    ElMessage.error('获取订单信息失败')
    console.error('Error fetching order:', error)
  } finally {
    loading.value = false
  }
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

// 获取订单状态步骤
const getStatusStep = () => {
  const statusSteps = {
    'pending': 1,
    'paid': 2,
    'shipped': 3,
    'completed': 4,
    'cancelled': 1
  }
  return statusSteps[order.value.status] || 1
}

// 获取状态文字
const getStatusText = () => {
  const statusMap = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[order.value.status] || order.value.status
}

// 获取状态标签类型
const getStatusType = () => {
  const typeMap = {
    'pending': 'warning',
    'paid': 'info',
    'shipped': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[order.value.status] || ''
}

// 计算商品总额
const calculateItemsTotal = () => {
  if (!order.value || !order.value.items) return '0.00'
  const total = order.value.items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity))
  }, 0)
  return total.toFixed(2)
}

// 计算运费
const calculateShippingFee = () => {
  if (!order.value) return '0.00'
  return Number(order.value.shippingFee || 0).toFixed(2)
}

// 计算实付金额
const calculateTotalAmount = () => {
  const itemsTotal = Number(calculateItemsTotal())
  const shippingFee = Number(calculateShippingFee())
  return (itemsTotal + shippingFee).toFixed(2)
}

// 支付订单
const handlePay = async () => {
  try {
    await ElMessageBox.confirm('确定要支付该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await axios.patch(`http://localhost:3000/orders/${order.value.id}`, {
      status: 'paid',
      payTime: new Date().toISOString()
    })

    await fetchOrderDetail()
    ElMessage.success('支付成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败')
    }
  }
}

// 确认收货
const handleConfirmReceive = async () => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await axios.patch(`http://localhost:3000/orders/${order.value.id}`, {
      status: 'completed',
      completeTime: new Date().toISOString()
    })

    await fetchOrderDetail()
    ElMessage.success('确认收货成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 取消订单
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.patch(`http://localhost:3000/orders/${order.value.id}`, {
      status: 'cancelled',
      cancelTime: new Date().toISOString()
    })

    await fetchOrderDetail()
    ElMessage.success('订单已取消')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.status-bar {
  padding: 20px 0;
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

.product-name {
  color: #303133;
  text-decoration: none;
}

.product-name:hover {
  color: var(--el-color-primary);
}

.price,
.subtotal {
  color: #606266;
  font-weight: 500;
}

.amount-info {
  max-width: 400px;
  margin-left: auto;
}

.total-amount :deep(.el-descriptions-item__content) {
  color: #f56c6c;
  font-size: 1.25rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mt-6 {
  margin-top: 1.5rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-medium {
  font-weight: 500;
}

.loading-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
