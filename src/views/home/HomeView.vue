<template>
  <div class="home">
    <el-carousel height="400px" class="mb-8">
      <el-carousel-item v-for="i in 4" :key="i">
        <img :src="`https://picsum.photos/1168/400?random=${i}`" class="w-full h-full object-cover" />
      </el-carousel-item>
    </el-carousel>

    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">热门分类</h2>
      <el-row :gutter="20" class="mb-8">
        <el-col :span="8" v-for="category in categories" :key="category.id">
          <el-card shadow="hover" @click="router.push(`/products?category=${category.name}`)">
            <div class="flex items-center justify-center py-6 cursor-pointer">
              <span class="text-lg">{{ category.label }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="all-products-section mb-8 text-center">
        <el-button type="primary" size="large" class="all-products-btn" @click="router.push('/products')">
          <el-icon class="mr-2">
            <Grid />
          </el-icon>
          浏览全部商品
        </el-button>
      </div>

      <h2 class="text-2xl font-bold mb-6">推荐商品</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="product in featuredProducts" :key="product.id">
          <el-card shadow="hover" class="mb-4" @click="router.push(`/products/${product.id}`)">
            <div class="product-card-content">
              <img :src="product.image" class="w-full h-48 object-cover mb-4" />
              <h3 class="text-lg font-medium mb-2">{{ product.name }}</h3>
              <div class="product-footer">
                <span class="text-red-600 text-xl">¥{{ product.price }}</span> <el-button type="primary" size="small"
                  @click.stop="addToCart(product)">
                  {{ isLoggedIn ? '加入购物车' : '登录后购买' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Grid } from '@element-plus/icons-vue'

const router = useRouter()
const isLoggedIn = inject('isLoggedIn')  // 注入登录状态
const categories = ref([])
const featuredProducts = ref([])

const addToCart = async (product) => {
  // 检查用户是否已登录
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    await axios.post('http://localhost:3000/cart', {
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: product.price,
      image: product.image
    })
    ElMessage.success('已添加到购物车')
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

onMounted(async () => {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      axios.get('http://localhost:3000/categories'),
      axios.get('http://localhost:3000/products')
    ])
    // 只取前3个分类
    categories.value = categoriesRes.data.slice(0, 3)
    featuredProducts.value = productsRes.data
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.product-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.mb-8 {
  margin-bottom: 2rem;
  width: 1168px;
  margin-left: auto;
  margin-right: auto;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.text-2xl {
  font-size: 1.5rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.h-48 {
  height: 12rem;
}

.object-cover {
  object-fit: cover;
}

.text-red-600 {
  color: #dc2626;
}

.mr-2 {
  margin-right: 0.5rem;
}

.all-products-section {
  padding: 2rem 0;
  background: linear-gradient(to right, #f3f4f6, #ffffff, #f3f4f6);
  border-radius: 8px;
}

.all-products-btn {
  font-size: 1.25rem;
  padding: 12px 36px;
  transition: transform 0.2s;
}

.all-products-btn:hover {
  transform: scale(1.05);
}
</style>
