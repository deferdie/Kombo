import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

// import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import 'font-awesome/css/font-awesome.min.css'

const sqlite3 = require('sqlite3')
const path = require('path')
const os = require('os')
const fs = require('fs')

if (!fs.existsSync(path.join(os.homedir(), '.kombo'))) {
  fs.mkdirSync(path.join(os.homedir(), '.kombo'))
}

const db = new sqlite3.Database(path.join(os.homedir(), '.kombo', 'kombo'))

db.serialize(function () {
  db.run('CREATE TABLE IF NOT EXISTS applications (name, path)')
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
