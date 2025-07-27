import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue')
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/product/ProductListView.vue')
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('../views/product/ProductDetailView.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/cart/CartView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/order/OrderListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: () => import('../views/order/OrderDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/confirm',
      name: 'order-confirm',
      component: () => import('../views/order/OrderConfirmView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    ElMessage.warning('请先登录')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
