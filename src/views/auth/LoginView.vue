<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="text-center text-2xl font-bold">用户登录</h2>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef">        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="w-full" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>

        <div class="text-center">
          还没有账号？
          <router-link to="/register" class="text-primary">
            立即注册
          </router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.get('http://localhost:3000/users', {
          params: {
            username: form.username,
            password: form.password
          }
        })

        if (response.data.length > 0) {
          const user = response.data[0]
          localStorage.setItem('token', 'demo-token') // 在实际应用中应该使用真实的token
          localStorage.setItem('user', JSON.stringify(user))

          window.dispatchEvent(new Event('login-status-changed'))
          ElMessage.success('登录成功')

          // 如果有重定向地址，则跳转到重定向地址
          const redirect = route.query.redirect || '/'
          router.push(redirect)
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        ElMessage.error('登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.text-center {
  text-align: center;
}

.text-2xl {
  font-size: 1.5rem;
}

.font-bold {
  font-weight: 700;
}

.w-full {
  width: 100%;
}

.text-primary {
  color: var(--el-color-primary);
}
</style>
