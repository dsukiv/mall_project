<template>
  <div class="products-container">
    <!-- 筛选栏 -->
    <div class="filter-section container mx-auto px-4 py-4">
      <el-card shadow="never">
        <div class="filter-row mb-4">
          <span class="filter-label">商品分类：</span> <el-radio-group v-model="selectedCategory"
            @change="handleCategoryChange">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button v-for="category in categories" :key="category.name" :value="category.name">
              {{ category.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="filter-row mb-4">
          <span class="filter-label">价格区间：</span>
          <el-select v-model="priceRange" placeholder="选择价格区间" @change="handlePriceChange">
            <el-option label="全部" value="" />
            <el-option label="0-1000元" value="0-1000" />
            <el-option label="1000-3000元" value="1000-3000" />
            <el-option label="3000-5000元" value="3000-5000" />
            <el-option label="5000元以上" value="5000+" />
          </el-select>
        </div>

        <div class="filter-row">
          <span class="filter-label">排序方式：</span> <el-radio-group v-model="sortBy" @change="handleSortChange">
            <el-radio-button value="default">默认</el-radio-button>
            <el-radio-button value="priceAsc">价格从低到高</el-radio-button>
            <el-radio-button value="priceDesc">价格从高到低</el-radio-button>
          </el-radio-group>
        </div>
      </el-card>
    </div>

    <!-- 商品列表 -->
    <div class="products-section container mx-auto px-4 py-4">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <el-empty v-else-if="totalProducts === 0" description="暂无商品" />

      <el-row v-else :gutter="20"> <el-col v-for="product in currentPageProducts" :key="product.id" :xs="24" :sm="12"
          :md="8" :lg="6" class="mb-4">
          <el-card shadow="hover" class="product-card h-full" @click="goToDetail(product.id)">
            <div class="product-image-container">
              <el-image :src="product.image" fit="cover" class="product-image" loading="lazy">
                <template #placeholder>
                  <div class="image-placeholder">
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="product.stock <= 5" class="stock-tag">
                仅剩{{ product.stock }}件
              </div>
            </div>

            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>

            <div class="product-footer">
              <span class="product-price">¥{{ product.price }}</span>
              <div class="cart-actions">
                <el-button type="primary" circle size="small" @click.stop="addToCart(product)">
                  <el-icon>
                    <ShoppingCart />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div v-if="totalProducts > 0" class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="totalProducts"
          :page-sizes="[12, 24, 36, 48]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Picture, ShoppingCart } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const products = ref([])
const categories = ref([])
const selectedCategory = ref('')
const priceRange = ref('')
const sortBy = ref('default')
const currentPage = ref(1)
const pageSize = ref(12)
const searchKeyword = ref('')
const isLoggedIn = inject('isLoggedIn') // 注入全局登录状态

// 从路由查询参数获取初始筛选条件
onMounted(async () => {
  const { category, price, sort, keyword } = route.query
  if (category) selectedCategory.value = category
  if (price) priceRange.value = price
  if (sort) sortBy.value = sort
  if (keyword) searchKeyword.value = keyword

  await Promise.all([
    fetchProducts(),
    fetchCategories()
  ])

  loading.value = false
})

// 获取数据
const fetchProducts = async () => {
  try {
    const response = await axios.get('http://localhost:3000/products')
    products.value = response.data
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get('http://localhost:3000/categories')
    categories.value = response.data
  } catch (error) {
    ElMessage.error('获取分类失败')
  }
}

// 商品筛选和排序
const filteredProducts = computed(() => {
  let result = [...products.value]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  // 价格筛选
  if (priceRange.value) {
    const [min, max] = priceRange.value.split('-').map(Number)
    if (priceRange.value === '5000+') {
      result = result.filter(p => p.price >= 5000)
    } else {
      result = result.filter(p => p.price >= min && p.price < max)
    }
  }

  // 排序
  if (sortBy.value === 'priceAsc') {
    result.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'priceDesc') {
    result.sort((a, b) => b.price - a.price)
  }

  return result
})

// 分页处理
const totalProducts = computed(() => filteredProducts.value.length)
const currentPageProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

// 事件处理
const handleCategoryChange = (category) => {
  currentPage.value = 1
  updateRouteQuery({ category })
}

const handlePriceChange = (price) => {
  currentPage.value = 1
  updateRouteQuery({ price })
}

const handleSortChange = (sort) => {
  currentPage.value = 1
  updateRouteQuery({ sort })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 处理搜索关键词变化
watch(() => route.query.keyword, (newKeyword) => {
  searchKeyword.value = newKeyword || ''
  currentPage.value = 1
})

const updateRouteQuery = (newQuery) => {
  router.push({
    query: {
      ...route.query,
      ...newQuery
    }
  })
}

const goToDetail = (productId) => {
  router.push(`/products/${productId}`)
}

const addToCart = async (product) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({
      path: '/login',
      query: { redirect: '/products' }
    })
    return
  }

  try {
    // 检查购物车是否已有该商品
    const existingItem = await axios.get(`http://localhost:3000/cart?productId=${product.id}`)

    if (existingItem.data.length > 0) {
      // 更新数量
      await axios.patch(`http://localhost:3000/cart/${existingItem.data[0].id}`, {
        quantity: existingItem.data[0].quantity + 1
      })
    } else {
      // 添加新商品
      await axios.post('http://localhost:3000/cart', {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      })
    }

    window.dispatchEvent(new Event('cart-updated'))
    ElMessage.success('已添加到购物车')
  } catch (error) {
    ElMessage.error('添加失败')
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}

.filter-row {
  display: flex;
  align-items: center;
}

.filter-label {
  min-width: 80px;
  color: #606266;
}

.product-card {
  height: 100%;
  transition: transform 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image-container {
  position: relative;
  padding-bottom: 100%;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
}

.stock-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(245, 108, 108, 0.9);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.product-name {
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-description {
  color: #606266;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 2.4em;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
}

.product-price {
  color: #f56c6c;
  font-size: 1.25rem;
  font-weight: 600;
}

.cart-actions {
  display: flex;
  gap: 0.5rem;
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.mb-4 {
  margin-bottom: 1rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.h-full {
  height: 100%;
}
</style>
