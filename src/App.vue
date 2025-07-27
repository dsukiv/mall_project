<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <!-- Logo区域 -->
        <router-link to="/" class="logo">
          
          <span class="logo-text">电子商城</span>
        </router-link>

        <!-- 导航菜单 -->
        <el-menu :router="true" mode="horizontal" class="nav-menu" :ellipsis="false" :default-active="$route.path">
          <el-menu-item index="/">
            <el-icon>
              <House />
            </el-icon>
            首页
          </el-menu-item>

          <el-sub-menu index="/products">
            <template #title>
              <el-icon>
                <GoodsFilled />
              </el-icon>
              商品分类
            </template>
            <el-menu-item v-for="category in categories" :key="category.id"
              :index="'/products?category=' + category.name">
              {{ category.label }}
            </el-menu-item>
          </el-sub-menu>

          <div class="flex-grow" />

          <!-- 搜索框 -->
          <div class="search-box">
            <el-input v-model="searchKeyword" placeholder="搜索商品" clearable class="search-input"
              @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" :icon="Search" @click="handleSearch" class="search-button">
              搜索
            </el-button>
          </div>

          <!-- 购物车 -->
          <el-menu-item index="/cart" v-if="isLoggedIn" class="cart-menu-item">
            <el-icon>
              <ShoppingCart />
            </el-icon>
            <span>购物车</span>
          </el-menu-item>

          <!-- 订单 -->
          <el-menu-item index="/orders" v-if="isLoggedIn">
            <el-icon>
              <Tickets />
            </el-icon>
            我的订单
          </el-menu-item>

          <!-- 用户菜单 -->
          <el-sub-menu v-if="isLoggedIn" index="/user" class="user-menu">
            <template #title>
              <el-avatar :size="32" :src="userAvatar">
                {{ username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
            </template>
            <el-menu-item index="/login" @click="handleLogout">
              <el-icon>
                <SwitchButton />
              </el-icon>
              退出登录
            </el-menu-item>
          </el-sub-menu>

          <!-- 登录注册按钮 -->
          <template v-else>
            <el-menu-item index="/login">
              <el-icon>
                <User />
              </el-icon>
              登录
            </el-menu-item>
          </template>
        </el-menu>
      </div>
    </el-header>

    <!-- 主要内容区 -->
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="$route.fullPath" />
      </router-view>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>致力于提供优质的电子产品和极致的购物体验</p>
        </div>
        <div class="footer-section">
          <h3>联系方式</h3>
          <p>电话：400-123-4567</p>
          <p>邮箱：support@example.com</p>
        </div>
        <div class="footer-section">
          <h3>快速链接</h3>
          <router-link to="/products">全部商品</router-link>
          <router-link v-if="isLoggedIn" to="/cart">购物车</router-link>
          <router-link v-if="isLoggedIn" to="/orders">我的订单</router-link>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2025 电子商城. All rights reserved.</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  Shop,
  House,
  GoodsFilled,
  Search,
  ShoppingCart,
  Tickets,
  User,
  UserFilled,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const searchKeyword = ref('')
const cartCount = ref(0)
const isLoggedIn = ref(false)
const username = ref('')
const userAvatar = ref('')
const categories = ref([])

// 获取商品分类
const fetchCategories = async () => {
  try {
    const response = await axios.get('http://localhost:3000/categories')
    categories.value = response.data
  } catch (error) {
    console.error('获取商品分类失败', error)
  }
}

// 提供登录状态给子组件使用
provide('isLoggedIn', isLoggedIn)

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value }
    })
    searchKeyword.value = ''
  }
}

// 获取购物车数量
const fetchCartCount = async () => {
  if (!isLoggedIn.value) {
    cartCount.value = 0
    return
  }

  try {
    const response = await axios.get('http://localhost:3000/cart')
    cartCount.value = response.data.reduce((sum, item) => sum + item.quantity, 0)
  } catch (error) {
    console.error('获取购物车数量失败', error)
  }
}

// 处理退出登录
const handleLogout = () => {
  isLoggedIn.value = false
  username.value = ''
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  cartCount.value = 0
  ElMessage.success('已退出登录')
  router.push('/')
}

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))
  if (token && user) {
    isLoggedIn.value = true
    username.value = user.username
    userAvatar.value = user.avatar
  } else {
    isLoggedIn.value = false
    username.value = ''
    userAvatar.value = ''
  }
}

onMounted(() => {
  checkLoginStatus()
  fetchCartCount()
  fetchCategories()

  // 监听购物车更新事件
  window.addEventListener('cart-updated', fetchCartCount)

  // 监听登录状态变化
  window.addEventListener('login-status-changed', () => {
    checkLoginStatus()
    fetchCartCount()
  })
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
}

/* 页面容器 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.app-header {
  padding: 0;
  height: 64px;
  line-height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
}

/* Logo 样式 */
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--el-color-primary);
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0 12px;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.logo:hover {
  opacity: 0.9;
  background-color: var(--el-color-primary-light-9);
}

.logo-icon {
  margin-right: 8px;
  font-size: 1.8rem;
  transition: transform 0.3s ease;
}

.logo:hover .logo-icon {
  transform: scale(1.1);
}

/* 导航菜单样式 */
.nav-menu {
  flex: 1;
  border: none;
  height: 64px;
  display: flex;
  align-items: center;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  height: 64px;
  line-height: 64px;
  padding: 0 20px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu) {

  &:hover,
  &:focus {
    background-color: var(--el-color-primary-light-9);
  }
}

.nav-menu :deep(.el-menu-item.is-active) {
  font-weight: 500;
  color: var(--el-color-primary);
}

.nav-menu :deep(.el-menu--popup) {
  min-width: 160px;
  padding: 8px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-menu :deep(.el-menu--popup .el-menu-item) {
  height: 48px;
  line-height: 48px;
  padding: 0 24px;
  margin: 0;
}

/* 购物车菜单项样式 */
.nav-menu :deep(.cart-menu-item) {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
}

.nav-menu :deep(.cart-menu-item .el-icon) {
  margin-right: 4px;
  font-size: 18px;
}

.nav-menu :deep(.cart-menu-item:hover) {
  background-color: var(--el-color-primary-light-9);
}

/* 搜索框样式 */
.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 420px;
  margin: 0 1rem;
  transition: all 0.3s ease;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper):hover,
.search-input :deep(.el-input__wrapper).is-focus {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}

.search-input :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
}

.search-input :deep(.el-input__prefix) {
  padding-left: 12px;
}

.search-button {
  white-space: nowrap;
  height: 40px;
  padding: 0 20px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
}

.search-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

@media (max-width: 992px) {
  .search-box {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .search-box {
    width: 250px;
  }

  .search-button {
    padding: 0 12px;
  }
}

@media (max-width: 576px) {
  .search-box {
    display: none;
  }

  .app-main {
    padding: 1rem;
  }
}

/* 购物车按钮样式 */
.cart-menu-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 用户菜单样式 */
.user-menu :deep(.el-sub-menu__title) {
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-menu:hover :deep(.el-sub-menu__title) {
  background-color: var(--el-color-primary-light-9);
}

.user-menu :deep(.el-avatar) {
  background-color: var(--el-color-primary);
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.user-menu:hover :deep(.el-avatar) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

/* 主要内容区域样式 */
.app-main {
  margin-top: 64px;
  min-height: calc(100vh - 64px - 300px);
  padding: 2rem 1rem;
  background-color: #f5f7fa;
}

/* 页脚样式 */
.app-footer {
  background-color: #2c3e50;
  color: #fff;
  padding: 3rem 1rem 1rem;
  margin-top: auto;
  height: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
}

.footer-section h3 {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #fff;
  font-weight: 500;
}

.footer-section p {
  color: #a8b2bc;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.footer-section a {
  display: block;
  color: #a8b2bc;
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: var(--el-color-primary);
}

.footer-bottom {
  text-align: center;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #a8b2bc;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .header-content {
    padding: 0 1rem;
  }
}

@media (max-width: 992px) {
  .search-box {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .search-box {
    width: 250px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .logo-text {
    display: none;
  }
}

@media (max-width: 576px) {
  .search-box {
    display: none;
  }

  .app-main {
    padding: 1rem;
  }
}

/* 工具类 */
.flex-grow {
  flex-grow: 1;
}

/* 购物车内容样式 */
.cart-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cart-content .el-icon {
  font-size: 18px;
  margin-right: 4px;
  transition: transform 0.3s ease;
}

.cart-menu-item:hover .el-icon {
  transform: translateY(-1px);
}
</style>