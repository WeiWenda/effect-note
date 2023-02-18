const express = require('express'),
    router    = express.Router();
const git = require("isomorphic-git");
const fs = require("fs");
const {listFiles, deleteFile, writeFile, commit, getGitConfig, store} = require("./isomorphicGit");
const path = require("path");
const lunr = require("lunr");
const jieba = require('@node-rs/jieba');
jieba.load();
require("lunr-languages/lunr.stemmer.support")(lunr)
require('lunr-languages/lunr.multi')(lunr)
require('lunr-languages/lunr.zh')(lunr)
const punctuationSplit = function (builder) {
    const pipelineFunction = function (token) {
        // console.log('token:' + token.toString());
        return token.toString().split(new RegExp("[^\u4E00-\u9FA5a-zA-Z0-9]")).flatMap(function (str) {
            return jieba.cut(str, true).map(word => {
                return token.clone().update(function () {
                    return word
                })
            })
        })
    }
    const stopWordFilter = lunr.generateStopWordFilter(
        '的 一 不 在 人 有 是 为 以 于 上 他 而 后 之 来 及 了 因 下 可 到 由 这 与 也 此 但 并 个 其 已 无 小 我 们 起 最 再 今 去 好 只 又 或 很 亦 某 把 那 你 乃 它 吧 被 比 别 趁 当 从 到 得 打 凡 儿 尔 该 各 给 跟 和 何 还 即 几 既 看 据 距 靠 啦 了 另 么 每 们 嘛 拿 哪 那 您 凭 且 却 让 仍 啥 如 若 使 谁 虽 随 同 所 她 哇 嗡 往 哪 些 向 沿 哟 用 于 咱 则 怎 曾 至 致 着 诸 自'.split(' '));
    lunr.Pipeline.registerFunction(stopWordFilter, 'stopWordFilter2');
    lunr.Pipeline.registerFunction(pipelineFunction, 'punctuationSplit')
    builder.pipeline.add(pipelineFunction)
    builder.pipeline.add(stopWordFilter)
}

let subscriptionIndex = null;
async function refreshIndex() {
    const files = await listFiles();
    subscriptionIndex = lunr(function() {
        this.use(lunr.multiLanguage('en', 'zh'))
        this.use(punctuationSplit)
        this.ref("id")
        this.field("title")
        this.field("content")
        // this.add({
        //     'id': 1,
        //     'title': '欢迎文档草稿',
        //     'content': '欢迎文档草稿123214',
        // })
        const gitHome = getGitConfig().gitHome;
        files.forEach((filepath, index) => {
            const content = fs.readFileSync(path.join(gitHome, filepath), {encoding: 'utf-8'});
            this.add({
                'id': index,
                'title': filepath,
                'content': content,
            })
        }, this)
    })
}
refreshIndex();
function constructDocInfo(content, filepath, id) {
    const paths = filepath.split('/');
    const nameSplits = paths.pop().split(new RegExp('[\[\\]\.]'));
    const name = nameSplits.shift();
    const tag = paths.join('/');
    const otherTags = nameSplits.filter(split => {
        return split && split !== 'json' && split !== 'effect'
    })
    return {name,
        filename: filepath.split('/').pop(),
        tag: tag ? JSON.stringify([tag].concat(otherTags)) : JSON.stringify([]), content, id}
}

router.get('/search', (req, res) => {
    res.send(subscriptionIndex.search(req.query.search))
})

router.get('/', (req, res, next) => {
    listFiles().then(files => {
        const result = [{name: '欢迎使用Effect笔记', filename: 'help.effect.json', tag: JSON.stringify([]), id: -1}].concat(
            files.map((file, index) => {
                return constructDocInfo(undefined, file, index);
            })
        );
        res.send({content: result});
    }).catch(() => {
        res.send({content: []});
    });
});


router.post('/', (req, res) => {
    const filename = req.body.name;
    const tags = JSON.parse(req.body.tag);
    const dir = tags.shift() || '';
    const actualFilename = `${filename}${tags.map(tag => '[' + tag.replace('/', ':') + ']').join('')}.effect.json`
    const content = req.body.content;
    writeFile(dir, actualFilename, content).then(() => {
        commit().then(() => {
            listFiles().then(files => {
                res.send({message: 'save success', id: files.indexOf(path.join(dir, actualFilename))});
            });
        })
    });
});

router.get('/:docId/versions', async (req, res) => {
    const {gitHome} = getGitConfig();
    const docId = Number(req.params.docId);
    const files = await listFiles();
    const filepath = files[docId];
    const commits = await git.log({ fs, dir: gitHome })
    let lastSHA = null
    let lastCommit = null
    const commitsThatMatter = []
    for (const commit of commits) {
        try {
            const o = await git.readObject({ fs, dir: gitHome, oid: commit.oid, filepath })
            if (o.oid !== lastSHA) {
                if (lastSHA !== null) commitsThatMatter.push(lastCommit)
                lastSHA = o.oid
            }
        } catch (err) {
            // file no longer there
            commitsThatMatter.push(lastCommit)
            break
        }
        lastCommit = commit
    }
    res.send(commitsThatMatter.map(commit => {
        return {commitId: commit.oid, time: commit.commit.author.timestamp};
    }))
})
router.get('/:docId', async (req, res) => {
    const {gitHome} = getGitConfig();
    const docId = Number(req.params.docId);
    const files = await listFiles();
    const filepath = files[docId];
    let commitOid = req.query.version
    if (commitOid === 'HEAD') {
        commitOid = await git.resolveRef({ fs, dir: gitHome, ref: 'HEAD' });
    }
    const { blob } = await git.readBlob({
        fs,
        dir: gitHome,
        oid: commitOid,
        filepath: filepath
    });
    res.send(constructDocInfo(Buffer.from(blob).toString('utf8'), filepath, docId));
});

router.delete('/:docId', async (req, res) => {
    const {gitHome} = getGitConfig();
    const docId = Number(req.params.docId);
    const files = await listFiles();
    const filepath = files[docId];
    deleteFile(path.join(gitHome, filepath)).then(() => {
        commit().then(() => {
            res.send({message: 'delete success!'});
        })
    })
})

router.put('/:docId', async (req, res) => {
    if (req.params.docId === '-1') {
        res.send({message: '帮助文档无法保存', id: req.params.docId});
    } else {
        const {gitHome} = getGitConfig();
        const docId = Number(req.params.docId);
        const files = await listFiles();
        const oldFilepath = files[docId].split('/');
        const oldFilename = oldFilepath.pop();
        const oldDir = oldFilepath.join('/');
        const filename = req.body.name;
        const tags = JSON.parse(req.body.tag);
        const dir = tags.shift() || '';
        const actualFilename = `${filename}${tags.map(tag => '[' + tag.replace('/', ':') + ']').join('')}.effect.json`
        const content = req.body.content;
        if (actualFilename === oldFilename && dir === oldDir) {
            console.log('仅修改内容')
            // 仅修改内容
            writeFile(dir, actualFilename, content).then(() => {
                commit().then(() => {
                    refreshIndex();
                    res.send({message: 'save success', id: req.params.docId});
                })
            });
        } else {
            console.log('重命名或移动目录')
            // 重命名或移动目录
            deleteFile(path.join(gitHome, files[docId])).then(() => {
                writeFile(dir, actualFilename, content).then(() => {
                    commit().then(() => {
                        refreshIndex();
                        res.send({message: 'save success', id: req.params.docId});
                    })
                });
            })
        }
    }
});

// this is required
module.exports = {router, punctuationSplit};
