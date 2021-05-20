import Vue from 'vue'
import App from './App.vue'

// 导入组件库
import xui from '../packages'
// console.log(xui)
Vue.use(xui)
Vue.use(xui.Window, {
  dynamic: true
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
