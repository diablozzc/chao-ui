import Vue from 'vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import App from './App.vue'

// 导入组件库
import xui from '../packages'
// console.log(xui)
Vue.use(ElementUI)
Vue.use(xui)
Vue.use(xui.Window, {
  dynamic: true
})

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
