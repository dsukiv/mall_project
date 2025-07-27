<template>
  <div v-if="product" class="product-detail container mx-auto px-4 py-8">
    <el-breadcrumb class="mb-6">
      <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/products', query: { category: product.category } }">
        {{ getCategoryLabel(product.category) }}
      </el-breadcrumb-item>
      <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="product-content">
      <el-row :gutter="40">
        <!-- 商品图片 -->
        <el-col :span="12">
          <div class="image-container">
            <el-image :src="product.image" fit="contain" :preview-src-list="[product.image]" class="product-image" />
          </div>
        </el-col>

        <!-- 商品信息 -->
        <el-col :span="12">
          <div class="product-info">
            <h1 class="product-title">{{ product.name }}</h1>

            <div class="price-section">
              <div class="current-price">
                <span class="price-label">价格</span>
                <span class="price-value">¥{{ product.price }}</span>
              </div>
            </div>

            <div class="stock-info mb-6">
              <span class="stock-label">库存</span>
              <span class="stock-value" :class="{ 'text-red-500': product.stock < 10 }">
                {{ product.stock }} 件
              </span>
            </div>

            <div class="description mb-6">
              <h3 class="description-title">商品描述</h3>
              <p class="description-content">{{ product.description }}</p>
            </div>

            <div class="purchase-section">
              <el-input-number v-model="quantity" :min="1" :max="product.stock" class="mr-4" />
              <el-button type="primary" size="large" :disabled="product.stock === 0" @click="addToCart">
                <el-icon class="mr-2">
                  <ShoppingCart />
                </el-icon>
                加入购物车
              </el-button>
              <el-button type="danger" size="large" :disabled="product.stock === 0" @click="buyNow">
                立即购买
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 商品详细信息标签页 -->
      <div class="product-tabs mt-8">
        <el-tabs>
          <el-tab-pane label="商品详情">
            <div class="detail-content">
              <h3 class="mb-4">产品特点</h3>
              <ul class="feature-list">
                <li v-for="(feature, index) in productFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
            </div>
          </el-tab-pane>
          <el-tab-pane label="用户评价">
            <!-- 评价列表 -->
            <div class="reviews-section">
              <div v-if="reviews.length === 0" class="no-reviews">
                暂无评价
              </div>
              <el-timeline v-else>
                <el-timeline-item v-for="review in reviews" :key="review.id" :timestamp="review.date">
                  <div class="review-content">
                    <div class="review-header">
                      <span class="reviewer">{{ review.username }}</span>
                      <el-rate v-model="review.rating" disabled class="ml-4" />
                    </div>
                    <p class="review-text">{{ review.content }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  <div v-else class="container mx-auto px-4 py-8 text-center">
    <el-empty description="商品不存在或已下架" />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const product = ref(null)
const quantity = ref(1)
const reviews = ref([])
const isLoggedIn = inject('isLoggedIn') // 注入全局登录状态

// 示例评论数据
const productFeatures = [
  '品质保证，正品行货',
  '全国联保，提供发票',
  '终身售后服务',
  '7天无理由退换',
  '72小时发货'
]

const getCategoryLabel = (category) => {
  const categoryMap = {
    phones: '手机',
    laptops: '笔记本',
    accessories: '配件'
  }
  return categoryMap[category] || category
}

const addToCart = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({
      path: '/login',
      query: { redirect: `/products/${product.value.id}` }
    })
    return
  }

  try {
    const cartItem = {
      productId: product.value.id,
      name: product.value.name,
      price: product.value.price,
      image: product.value.image,
      quantity: quantity.value
    }

    // 检查购物车是否已有该商品
    const existingItem = await axios.get(`http://localhost:3000/cart?productId=${product.value.id}`)

    if (existingItem.data.length > 0) {
      // 更新数量
      const newQuantity = existingItem.data[0].quantity + quantity.value
      await axios.patch(`http://localhost:3000/cart/${existingItem.data[0].id}`, {
        quantity: newQuantity
      })
    } else {
      // 添加新商品
      await axios.post('http://localhost:3000/cart', cartItem)
    }

    window.dispatchEvent(new Event('cart-updated'))
    ElMessage.success('已添加到购物车')
  } catch (error) {
    ElMessage.error('添加失败，请重试')
  }
}

const buyNow = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({
      path: '/login',
      query: { redirect: `/products/${product.value.id}` }
    })
    return
  }

  // 创建临时订单数据
  const orderData = {
    items: [{
      productId: product.value.id,
      name: product.value.name,
      price: product.value.price,
      image: product.value.image,
      quantity: quantity.value
    }],
    total: Number(product.value.price * quantity.value)
  }

  // 将订单数据暂存到 localStorage
  localStorage.setItem('pendingOrder', JSON.stringify(orderData))

  // 跳转到订单确认页
  router.push('/orders/confirm')
}

onMounted(async () => {
  try {
    const response = await axios.get(`http://localhost:3000/products/${route.params.id}`)
    product.value = response.data
  } catch (error) {
    ElMessage.error('获取商品信息失败')
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mt-8 {
  margin-top: 2rem;
}

.mr-4 {
  margin-right: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.image-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 400px;
}

.product-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

.price-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.price-label {
  font-size: 1rem;
  color: #666;
  margin-right: 1rem;
}

.price-value {
  font-size: 2rem;
  color: #f56c6c;
  font-weight: 600;
}

.stock-info {
  font-size: 1rem;
}

.stock-label {
  color: #666;
  margin-right: 1rem;
}

.text-red-500 {
  color: #f56c6c;
}

.description-title {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.description-content {
  color: #666;
  line-height: 1.6;
}

.feature-list {
  list-style-type: none;
  padding: 0;
}

.feature-list li {
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.feature-list li::before {
  content: "✓";
  color: #67c23a;
  position: absolute;
  left: 0;
}

.reviews-section {
  padding: 1rem 0;
}

.review-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reviewer {
  font-weight: 500;
}

.review-text {
  color: #666;
  margin: 0;
}

.no-reviews {
  text-align: center;
  color: #909399;
  padding: 2rem;
}
</style>
