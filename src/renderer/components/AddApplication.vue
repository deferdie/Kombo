<template>
  <div class="col-12">
    <h1 class="h2">Add application</h1>
		<form class="form">
			<div class="form-group">
				<label>Application name</label>
				<input type="text" class="form-control" placeholder="Enter app name" v-model="application.name">
				<small id="emailHelp" class="form-text text-muted">A folder will be created with this application name</small>
			</div>

			<div class="form-group">
				<button v-on:click="setDirectory($event)" class="btn btn-primary">Select directory</button>
				<small v-if="application.directory">{{application.directory[0]}}</small>
			</div>
			
			<div class="input-group mb-3">
				<div class="input-group-prepend">
					<label class="input-group-text" for="inputGroupSelect01">Laravel version</label>
				</div>
				<select class="custom-select" v-model="application.laravel_version">
					<option selected>Choose...</option>
					<option value="5.7">5.7</option>
					<option value="5.6">5.6</option>
					<option value="5.5">5.5</option>
				</select>
			</div>

			<p>
				Install MySQL?
			</p>
			<div class="btn-group btn-group-toggle" data-toggle="buttons">
				<label class="btn btn-secondary" v-on:click="updateForm('install_mysql', false)">
					<input type="radio" /> No
				</label>
				<label class="btn btn-secondary" v-on:click="updateForm('install_mysql', true)">
					<input type="radio" /> Yes
				</label>
			</div>
			<p>
				Install Redis?
			</p>
			<div class="btn-group btn-group-toggle" data-toggle="buttons">
				<label class="btn btn-secondary" v-on:click="updateForm('install_redis', false)">
					<input type="radio" /> No
				</label>
				<label class="btn btn-secondary" v-on:click="updateForm('install_redis', true)">
					<input type="radio" /> Yes
				</label>
			</div>
			<hr>
			<button class="btn btn-block btn-primary" v-on:click="createApplication()">
				<span v-if="!show_spinner">Create application</span>
				<i v-else class="fa fa-spinner fa-spin" style="font-size:24px"></i>
			</button>
		</form>
  </div>
</template>

<script>
  import Yaml from 'json2yaml'
  import { exec } from 'child_process'
  const fs = require('fs')
  const {dialog} = require('electron').remote
  const path = require('path')
  // const sqlite3 = require('sqlite3')
  // const os = require('os')
  // const db = new sqlite3.Database(path.join(os.homedir(), '.kombo', 'kombo'))
  // const yamlToJson = require('js-yaml')

  export default {
    name: 'landing-page',
    data: function () {
      return {
        application: {
          name: '',
          install_redis: false,
          install_socket: false,
          install_mysql: false,
          laravel_version: null,
          directory: null
        },
        services: {},
        dockerCompose: {
          version: '3',
          services: {},
          volumes: {}
        },
        dockerComposeYaml: '',
        show_spinner: false,
        appName: '',
        appDir: '',
        applications: []
      }
    },
    methods: {
      updateForm (formItem, value) {
        this.application[formItem] = value
        console.log(this.application)
      },
      createApplication () {
        let self = this

        if (this.show_spinner === true) {
          return
        }

        this.show_spinner = true

        this.appName = this.application.name.replace(' ', '').toLowerCase()

        this.appDir = path.join(this.application.directory[0], this.appName)

        // Create the directory
        if (!fs.existsSync(this.appDir)) {
          fs.mkdirSync(this.appDir)
        }

        // Install the selected laravel app in the selected folder
        exec(`cd ${this.appDir} && docker run --rm -v ${this.application.directory}:/app -w="/app" deferdie/php composer create-project --prefer-dist laravel/laravel ./${this.appName} "${this.application.laravel_version}.*"`, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`)
            return
          }

          // Setup docker, and other ci devops stuff
          self.setUpCiFolder()

          // Add Nginx service
          self.setServiceNginx()

          // Add PHP Service
          self.setServicePHP()

          // Add MySql
          if (self.application.install_mysql) {
            self.setServiceMySQL()
          }

          // Add Redis
          if (self.application.install_redis) {
            self.setServiceRedis()
          }

          // Generate the docker-compose file
          self.generateDockerComposeYaml()

          // Save the docker-compose generated file
          self.writeDockerComposeYaml()

          console.log(`stdout: ${stdout}`)
          console.log(`stderr: ${stderr}`)
          self.show_spinner = false
        })
      },
      setDirectory (e) {
        let path = dialog.showOpenDialog({
          properties: ['openDirectory']
        })

        this.application.directory = path
      },
      generateDockerComposeYaml () {
        this.dockerComposeYaml = Yaml.stringify(this.dockerCompose)
      },
      writeDockerComposeYaml () {
        // Add the docker-compose file
        fs.writeFile(this.appDir + '/docker-compose.yaml', this.dockerComposeYaml)
      },
      /**
       * Set up the Nginx service with folders
       */
      setServiceNginx () {
        let self = this

        // Create the Nginx folder
        fs.mkdirSync(this.appDir + '/ci/docker/nginx')

        // The nginx service
        let nginxService = {
          build: {
            context: '.',
            dockerfile: './ci/docker/nginx/Dockerfile'
          },
          ports: ['80:80'],
          image: this.appName + '/nginx',
          volumes: [
            '.:/var/www/html'
          ],
          container_name: this.appName + '-nginx'
        }

        this.dockerCompose.services['nginx'] = nginxService

        // Add the default.conf file to the Nginx folder
        fs.readFile(path.join(__dirname, '../../', 'templates', 'default.conf'), 'utf8', function (err, contents) {
          // Lets update the replace container name with the nginx container name
          let updatedNginxConfFile = contents.replace('CONTAINER_NAME', self.appName + '-php')

          // Lets write a new file based on the new contents
          fs.writeFile(self.appDir + '/ci/docker/nginx/default.conf', updatedNginxConfFile)

          if (err) {
            console.log(err)
          }
        })

        // Copy the Nginx docker file
        fs.copyFile(path.join(__dirname, '../../', 'templates', 'NginxDockerFile'), this.appDir + '/ci/docker/nginx/Dockerfile', (err) => {
          if (err) {
            console.log(err)
          }
        })
      },
      /**
       * Set up the php service with folders
       */
      setServicePHP () {
        // Create the Php folder
        fs.mkdirSync(this.appDir + '/ci/docker/php')

        let phpService = {
          build: {
            context: '.',
            dockerfile: './ci/docker/php/Dockerfile'
          },
          image: this.appName + '/php',
          volumes: [
            '.:/var/www/html'
          ],
          container_name: this.appName + '-php'
        }

        // Copy the Nginx docker file
        fs.copyFile(path.join(__dirname, '../../', 'templates', 'PhpDockerFile'), this.appDir + '/ci/docker/php/Dockerfile', (err) => {
          if (err) {
            console.log(err)
          }
        })

        fs.copyFile(path.join(__dirname, '../../', 'templates', 'www.conf'), this.appDir + '/ci/docker/php/www.conf', (err) => {
          if (err) {
            console.log(err)
          }
        })

        fs.copyFile(path.join(__dirname, '../../', 'templates', 'php-fpm.conf'), this.appDir + '/ci/docker/php/php-fpm.conf', (err) => {
          if (err) {
            console.log(err)
          }
        })

        this.dockerCompose.services['php'] = phpService
      },
      /**
       * Set up the mysql service
       */
      setServiceMySQL () {
        let mysqlService = {
          image: 'mysql:5.7',
          ports: ['3306:3306'],
          environment: {
            MYSQL_ROOT_PASSWORD: 'secret',
            MYSQL_DATABASE: this.appName,
            MYSQL_USER: 'root',
            MYSQL_PASSWORD: 'secret'
          },
          volumes: [
            'mysqldata:/var/lib/mysql'
          ],
          container_name: this.appName + '-mysql'
        }

        this.dockerCompose.volumes['mysqldata'] = {driver: 'local'}

        this.dockerCompose.services['mysql'] = mysqlService
      },
      /**
       * Set up the REDIS service
       */
      setServiceRedis () {
        let redisService = {
          image: 'redis:alpine',
          ports: ['6379:6379'],
          volumes: [
            'redisdata:/data'
          ],
          container_name: this.appName + '-redis'
        }

        this.dockerCompose.volumes['redisdata'] = {driver: 'local'}

        this.dockerCompose.services['redis'] = redisService
      },
      /**
       * Create ci folders
       */
      setUpCiFolder () {
        fs.mkdirSync(this.appDir + '/ci')
        fs.mkdirSync(this.appDir + '/ci/docker')
      }
    }
  }
</script>