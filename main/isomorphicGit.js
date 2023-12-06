const isoHttp = require('isomorphic-git/http/node');
const path = require('path');
const Moment = require('moment');
const { role } = require('../role.json');
const Store = require('electron-store');
const store = new Store();
const git = require("isomorphic-git");
const fs = require("fs");
const getGitConfig = () => {
    const gitRemote = store.get('gitRemote', '未配置')
    let gitHome;
    if (role === 'mas') {
        gitHome = store.get('gitHome', '默认')
    } else {
        gitHome = store.get('gitHome', '未配置')
    }
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

async function gitReset({dir, ref, branch}) {
    var re = /^HEAD~([0-9]+)$/
    var m = ref.match(re);
    if (m) {
        var count = +m[1];
        var commits = await git.log({fs, dir, depth: count + 1});
        var commit = commits.pop().oid;
        return new Promise((resolve, reject) => {
            fs.writeFile(dir + `/.git/refs/heads/${branch}`, commit, (err) => {
                if (err) {
                    return reject(err);
                }
                // clear the index (if any)
                fs.unlink(dir + '/.git/index', (err) => {
                    if (err) {
                        return reject(err);
                    }
                    // checkout the branch into the working tree
                    git.checkout({ dir, fs, ref: branch, force: true }).then(resolve);
                });
            });
        });
    }
    return Promise.reject(`Wrong ref ${ref}`);
}

async function commit() {
    const gitConfig = getGitConfig()
    try {
        const rootStatus = await git.log({fs, dir: gitConfig.gitHome})
        // console.log(rootStatus)
    } catch (e) {
        console.log('need git initialize')
        await git.init({fs, dir: gitConfig.gitHome})
    }
    const status = await git.statusMatrix({fs, dir: gitConfig.gitHome});
    if (status.every(([filepath, c1, c2, c3]) => (filepath.split('/').pop().startsWith('.') || (c1 === 1 && c2 === 1 && c3 === 1)))) {
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
        {fs, dir: gitConfig.gitHome, author: {name: 'auto saver', email : 'desktop@effectnote.com'},
            message: Moment().format('yyyy-MM-DD HH:mm:ss')}
    );
    if (gitConfig.gitRemote && gitConfig.gitRemote !== '未配置') {
        const branch = await git.currentBranch({fs, dir: gitConfig.gitHome})
        await git.push({fs,
            http: isoHttp,
            dir: gitConfig.gitHome,
            remote: 'origin',
            onAuth: () => ({ username: gitConfig.gitUsername, password: gitConfig.gitPassword}),
        }).catch(e => {
            if (e.toLocaleString().includes('Push rejected because it was not a simple fast-forward. Use "force: true" to override.')) {
                console.log('fast-forward failed, revert latest commit')
                return gitReset({dir: gitConfig.gitHome, ref: 'HEAD~1', branch: branch}).then(() => {
                    throw e
                }).catch(e => {
                    console.log(e)
                    throw e
                })
            } else {
                throw e
            }
        });
    }
}
module.exports = {getGitConfig, listFiles, writeFile, deleteFile, commit, store}

