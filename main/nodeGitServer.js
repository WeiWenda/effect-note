const { Git } = require('node-git-server');
const Store = require("electron-store");
const store = new Store();
let repos = null;

async function startGitServer() {
  const sycDirectory = store.get('sycDirectory', '未配置');
  if (sycDirectory === '未配置') {
    if (repos != null) {
      repos.close();
    }
  } else {
    repos = new Git(sycDirectory, {
      autoCreate: true,
    });

    repos.on('push', (push) => {
      console.log(`push ${push.repo}/${push.commit} ( ${push.branch} )`);
      push.accept();
    });

    repos.on('fetch', (fetch) => {
      console.log(`fetch ${fetch.commit}`);
      fetch.accept();
    });

    repos.listen(30124, {type: 'http'}, () => {
      console.log(`node-git-server running at http://localhost:${30124}`);
    });
  }
}

module.exports={startGitServer}

