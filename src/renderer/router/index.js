import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/add-application',
      name: 'add-application',
      component: require('@/components/AddApplication').default
    },
    {
      path: '/add-existing-application',
      name: 'add-existing-application',
      component: require('@/components/AddExistingApplication').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
