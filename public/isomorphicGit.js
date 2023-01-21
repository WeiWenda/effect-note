const isoHttp = require('isomorphic-git/http/node');
const path = require('path');
const Moment = require('moment');

const Store = require('electron-store');
const store = new Store();
const git = require("isomorphic-git");
const fs = require("fs");
const getGitConfig = () => {
    const gitRemote = store.get('gitRemote', 'https://gitee.com/xxx/xxx')
    const gitHome = store.get('gitHome', '未配置')
    const gitUsername = store.get('gitUsername', '未配置')
    const gitPassword = store.get('gitPassword', '未配置')
    const gitDepth = store.get('gitDepth', 100)
    return {gitRemote, gitHome, gitUsername, gitPassword, gitDepth};
}
const listFiles = async () => {
    const gitConfig = getGitConfig()
    if (gitConfig.gitHome !== '未配置') {
        const files = await git.listFiles({fs, dir: gitConfig.gitHome})
        const effectFiles = files.filter(file => file.endsWith('.effect.json'))
        return effectFiles;
    } else {
        return [];
    }
}

async function writeFile(dirs, filename, content) {
    const gitConfig = getGitConfig()
    await fs.promises.mkdir(path.join(gitConfig.gitHome, dirs), {recursive: true}).then(() => {
        return fs.promises.writeFile(path.join(gitConfig.gitHome, dirs, filename), content)
    });
}

async function deleteFile(file) {
    return fs.promises.unlink(file)
}

async function commit() {
    const gitConfig = getGitConfig()
    const status = await git.statusMatrix({fs, dir: gitConfig.gitHome});
    if (status.every(([filepath, c1, c2, c3]) => c1 === 1 && c2 === 1 && c3 === 1)) {
        console.log('nothing changed!')
        return;
    }
    await Promise.all(
        status.filter(([filepath, _]) => {
            return !filepath.split('/').pop().startsWith('.');
        }).map(([filepath, , worktreeStatus]) =>
            worktreeStatus ? git.add({fs, dir: gitConfig.gitHome, filepath }) : git.remove({fs, dir: gitConfig.gitHome, filepath })
        )
    )
    await git.commit(
        {fs, dir: gitConfig.gitHome, author: {name: 'auto saver', email : '994184916@qq.com'},
            message: Moment().format('yyyy-MM-DD HH:mm:ss')}
    );
    await git.push({fs,
        http: isoHttp,
        dir: gitConfig.gitHome,
        remote: 'origin',
        onAuth: () => ({ username: gitConfig.gitUsername, password: gitConfig.gitPassword}),
    });
}
module.exports = {getGitConfig, listFiles, writeFile, deleteFile, commit, store}

