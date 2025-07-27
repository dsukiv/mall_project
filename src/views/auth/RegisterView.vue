<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2 class="text-center text-2xl font-bold">用户注册</h2>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" :prefix-icon="Lock"
            show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="w-full" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>

        <div class="text-center">
          已有账号？
          <router-link to="/login" class="text-primary">
            立即登录
          </router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 检查用户名是否已存在
        const checkUser = await axios.get(`http://localhost:3000/users?username=${form.username}`)
        if (checkUser.data.length > 0) {
          ElMessage.error('用户名已存在')
          return
        }

        // 检查邮箱是否已存在
        const checkEmail = await axios.get(`http://localhost:3000/users?email=${form.email}`)
        if (checkEmail.data.length > 0) {
          ElMessage.error('邮箱已被注册')
          return
        }

        // 创建新用户
        await axios.post('http://localhost:3000/users', {
          username: form.username,
          email: form.email,
          password: form.password
        })

        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        ElMessage.error('注册失败，请稍后重试')
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 2rem 0;
}

.register-card {
  width: 100%;
  max-width: 450px;
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

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
