var AWS = require('aws-sdk'),
  Promise = require('bluebird'),
  _ = require('lodash');

var child_process = Promise.promisifyAll(require('child_process'));

AWS.config.update({region: process.env.AWS_REGION || 'us-east-1'});
var codecommit = Promise.promisifyAll(new AWS.CodeCommit());

var gitlab = require('gitlab')({
  url:   process.env.GITLAB_URL,
  token: process.env.GITLAB_TOKEN
});
// No idea how gitlab sdk will handle errors.
Promise.promisifyAll(gitlab.projects, {
  promisifier: function(originalMethod) {
    return function promisified() {
      return new Promise(function(resolve, reject){
        originalMethod(function(result) {
          return resolve(result);
        });
      });
    }
  }
});



child_process.execAsync('mkdir repos')
.catch(function() {
  console.log("WARNING: Directory repos could not be created, does it exist already?");
}).then(function() {
  return gitlab.projects.allAsync();
}).then(function(repositories){
  var selectedRepos = process.argv.slice(2);
  if (selectedRepos[0]) {
    console.log("Migrating ", selectedRepos.join());
    repositories = _.filter(repositories, function(repo) {
      return _.contains(selectedRepos, repo.name);
    });
  } else {
    console.log("Migrating all repositories");
  }
  return Promise.map(repositories, function(repository){
    console.log(repository.name_with_namespace, ": Cloning");
    return child_process.execAsync('git clone --mirror ' +  repository.ssh_url_to_repo + " " + repository.name, {
      cwd: 'repos'
    }).then(function(stdout, stderr) {
      console.log(repository.name_with_namespace, ": Creating codecommit repo");
      return codecommit.createRepositoryAsync({
        repositoryName: repository.name,
        repositoryDescription: repository.description
      });
    }).then(function(ccRepository) {
      console.log(repository.name_with_namespace, ": Pushing to codecommit");
      url = ccRepository.repositoryMetadata.cloneUrlSsh;
      if (process.env.AWS_KEY_ID) { //Required on WIndows
        url = url.replace('ssh://', 'ssh://' + process.env.AWS_KEY_ID + "@");
      }
      return child_process.execAsync("git push " + url + " --all", {
        cwd: 'repos/' + repository.name
      });
    }).then(function(stdout, stderr) {
      console.log(repository.name_with_namespace, ": Finished");
      return repository.name;
    });
  });
}).then(function(repos) {
  console.log("Migrated: ");
  console.log(repos.join('\n'));
}).catch(console.error.bind(console));
