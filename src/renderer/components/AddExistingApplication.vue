<template>
  <div class="col-12">
    <h1 class="h2">Add Existing Application</h1>
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
			<hr>
			<button class="btn btn-block btn-primary" v-on:click="existingApplication()">
				<span v-if="!show_spinner">Add application</span>
				<i v-else class="fa fa-spinner fa-spin" style="font-size:24px"></i>      
			</button>
		</form>
  </div>
</template>

<script>
import Yaml from "json2yaml";
import { exec } from "child_process";
const fs = require("fs");
const { dialog } = require("electron").remote;
const path = require("path");
// const sqlite3 = require('sqlite3')
// const os = require('os')
// const db = new sqlite3.Database(path.join(os.homedir(), '.kombo', 'kombo'))
// const yamlToJson = require('js-yaml')

export default {
  name: "add-existing-application",
  data: function() {
    return {
      application: {
        name: "",
        directory: null
      },
      show_spinner: false
    }
  },
  methods: {
    updateForm(formItem, value) {
      this.application[formItem] = value;
      console.log(this.application);
    },
    setDirectory(e) {
      let path = dialog.showOpenDialog({
        properties: ["openDirectory"]
      });

      this.application.directory = path;
    },
    existingApplication () {
        db.run('INSERT INTO applications VALUES (?, ?)', [this.application.name, this.application.directory[0]])
    },
  }
};
</script>