<template>
  <div class="row col-12">
    <div class="col-8">
      <h1 class="h2">Applications</h1>
    </div>
    <div class="col text-right">
      <button class="btn btn-sm btn-outline-success" data-toggle="modal" data-target="#exampleModalCenter">Add application</button>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Add your application</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group">
                <label>Application name</label>
                <input type="text" class="form-control" placeholder="Enter app name">
                <small id="emailHelp" class="form-text text-muted" v-model="application.name">A folder will be created with this application name</small>
              </div>

              <button v-on:click="setDirectory($event)">Select directory</button>
              <br>

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
              <p>
                SocketIO?
              </p>
              <div class="btn-group btn-group-toggle" data-toggle="buttons">
                <label class="btn btn-secondary" v-on:click="updateForm('install_socket', false)">
                  <input type="radio" /> No
                </label>
                <label class="btn btn-secondary" v-on:click="updateForm('install_socket', true)">
                  <input type="radio" /> Yes
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-warning" data-dismiss="modal" v-if="!show_spinner">Close</button>
            <button type="button" class="btn btn-primary" v-on:click="createApplication()">
              <span v-if="!show_spinner">Create application</span>
              <i v-else class="fa fa-spinner fa-spin" style="font-size:24px"></i>              
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Yaml from 'json2yaml'
  const fs = require('fs')
  const {dialog} = require('electron').remote

  export default {
    name: 'landing-page',
    data: function () {
      return {
        application: {
          name: null,
          install_redis: false,
          install_socket: false,
          install_mysql: false,
          laravel_version: null,
          directory: null
        },
        show_spinner: false
      }
    },
    methods: {
      updateForm (formItem, value) {
        this.application[formItem] = value
        console.log(this.application)
      },
      createApplication () {
        this.show_spinner = true
        // Lets generate the yaml file based on the user config
        let ymlText = Yaml.stringify({
          version: '3',
          services: {
            php: {
              build: {
                context: './docker/php',
                dockerfile: 'Dockerfile'
              },
              image: this.application.name + '/php',
              volumes: [
                '.:/var/www/html'
              ],
              container_name: this.application.name + '-php'
            },
            nginx: {
              build: {
                context: './docker/nginx',
                dockerfile: 'Dockerfile'
              },
              image: this.application.name + '/nginx',
              volumes: [
                '.:/var/www/html'
              ],
              container_name: this.application.name + '-nginx'
            }
          }
        })

        fs.writeFile(this.application.directory + '/docker-compose.yaml', ymlText)
        console.log(ymlText)
      },
      setDirectory (e) {
        let path = dialog.showOpenDialog({
          properties: ['openDirectory']
        })

        this.application.directory = path
      }
    }
  }
</script>