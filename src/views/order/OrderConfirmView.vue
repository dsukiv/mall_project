<template>
  <div class="order-confirm-container">
    <el-card class="order-card">
      <template #header>
        <h2>订单确认</h2>
      </template>

      <div class="order-info">
        <h3>商品信息</h3>
        <el-table :data="orderDetails.items" style="width: 100%">
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="单价" width="120">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120" />
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥{{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="delivery-info mt-6">
          <h3>收货信息</h3>
          <el-form :model="deliveryInfo" label-width="100px">
            <el-form-item label="收货人">
              <el-input v-model="deliveryInfo.name" placeholder="请输入收货人姓名" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="deliveryInfo.phone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="收货地址">
              <el-input v-model="deliveryInfo.address" type="textarea" placeholder="请输入详细地址" />
            </el-form-item>
          </el-form>
        </div>

        <div class="payment-info mt-6">
          <h3>支付信息</h3>
          <el-radio-group v-model="paymentMethod">
            <el-radio value="alipay">支付宝支付</el-radio>
            <el-radio value="wechat">微信支付</el-radio>
          </el-radio-group>
        </div>
        <div class="order-summary mt-6">
          <div class="flex justify-between items-center">
            <span>商品总价：</span>
            <span class="text-xl text-primary">¥{{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span>运费：</span>
            <span>¥{{ deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center mt-2 text-lg font-bold">
            <span>应付总额：</span>
            <span class="text-danger">¥{{ totalAmount }}</span>
          </div>
        </div>

        <div class="actions mt-6 text-right">
          <el-button @click="$router.back()">返回购物车</el-button>
          <el-button type="primary" @click="submitOrder" :loading="submitting">
            提交订单
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const orderDetails = ref({
  items: [],
  total: 0
})
const deliveryInfo = ref({
  name: '',
  phone: '',
  address: ''
})
const paymentMethod = ref('alipay')
const submitting = ref(false)
const deliveryFee = ref(0) // 设置运费的初始值

// 计算商品总价
const subtotal = computed(() => {
  return orderDetails.value.items.reduce((total, item) => {
    return total + (Number(item.price) * Number(item.quantity))
  }, 0)
})

// 计算总金额
const totalAmount = computed(() => {
  return (subtotal.value + Number(deliveryFee.value)).toFixed(2)
})

// 初始化订单信息
onMounted(() => {
  const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'))
  if (!pendingOrder) {
    ElMessage.error('订单信息不存在')
    router.push('/cart')
    return
  }
  orderDetails.value = pendingOrder
})

// 提交订单
const submitOrder = async () => {
  if (!deliveryInfo.value.name || !deliveryInfo.value.phone || !deliveryInfo.value.address) {
    ElMessage.warning('请填写完整的收货信息')
    return
  }

  try {
    submitting.value = true
    const orderData = {
      items: orderDetails.value.items,
      subtotal: subtotal.value,
      deliveryFee: deliveryFee.value,
      total: Number(totalAmount.value),
      delivery: deliveryInfo.value,
      paymentMethod: paymentMethod.value,
      status: 'pending',
      createTime: new Date().toISOString()
    }

    // 创建订单
    const response = await axios.post('http://localhost:3000/orders', orderData)

    // 清空购物车
    const cartItems = orderDetails.value.items.map(item => item.id)
    await Promise.all(cartItems.map(id =>
      axios.delete(`http://localhost:3000/cart/${id}`)
    ))

    // 清除暂存的订单信息
    localStorage.removeItem('pendingOrder')

    ElMessage.success('订单提交成功！')
    router.push(`/orders/${response.data.id}`)
  } catch (error) {
    ElMessage.error('订单提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.order-confirm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.order-card {
  margin-bottom: 20px;
}

.mt-6 {
  margin-top: 1.5rem;
}

.text-primary {
  color: var(--el-color-primary);
}

.text-danger {
  color: var(--el-color-danger);
}

.text-xl {
  font-size: 1.25rem;
}

.font-bold {
  font-weight: bold;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.text-right {
  text-align: right;
}
</style>
