import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Index',
    component: () => import('./pages/index')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('./pages/about')
  }
]

export default new VueRouter({
  mode: 'hash',
  routes: routes
})
