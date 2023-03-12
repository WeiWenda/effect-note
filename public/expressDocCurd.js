const express = require('express'),
    router    = express.Router();
const git = require("isomorphic-git");
const fs = require("fs");
const {listFiles, deleteFile, writeFile, commit, getGitConfig, store} = require("./isomorphicGit");
const path = require("path");
const lunr = require("lunr");
const jieba = require('@node-rs/jieba');
const docId2path = {};
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
    lunr.Pipeline.registerFunction(pipelineFunction, 'punctuationSplit')
    builder.pipeline.add(pipelineFunction)
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
            const docId = filepath.split('/').pop().split('#').shift()
            docId2path[docId] = filepath;
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
function constructDocInfo(content, filepath) {
    const paths = filepath.split('/');
    const nameSplits = paths.pop().split(new RegExp('[#\[\\]\.]'));
    const id = Number(nameSplits.shift());
    const name = nameSplits.shift();
    const tag = paths.join('/');
    const otherTags = nameSplits.filter(split => {
        return split && split !== 'json' && split !== 'effect'
    })
    return {name,
        filename: filepath.split('/').pop(),
        tag: tag ? JSON.stringify([tag].concat(otherTags)) : JSON.stringify([]), content, id}
}
router.get('/reindex', (req, res) => {
    refreshIndex().then(() => {
        res.send({message: '更新成功！'})
    })
})

router.get('/search', (req, res) => {
    res.send(subscriptionIndex.search(req.query.search))
})

router.get('/', (req, res, next) => {
    listFiles().then(files => {
        const result = [{name: '欢迎使用Effect笔记', filename: 'help.effect.json', tag: JSON.stringify([]), id: -1}].concat(
            files.map((file, index) => {
                return constructDocInfo(undefined, file);
            })
        );
        res.send({content: result});
    }).catch(() => {
        res.send({content: []});
    });
});


router.post('/', (req, res) => {
    const filename = req.body.name;
    const docId = req.body.id;
    const tags = JSON.parse(req.body.tag);
    const dir = tags.shift() || '';
    const actualFilename = `${docId}#${filename}${tags.map(tag => '[' + tag.replace('/', ':') + ']').join('')}.effect.json`
    const content = req.body.content;
    writeFile(dir, actualFilename, content).then(() => {
        commit().then(() => {
            docId2path[docId] = path.join(dir, actualFilename);
            res.send({message: 'save success', id: docId});
        })
    });
});

router.get('/:docId/versions', async (req, res) => {
    const {gitHome} = getGitConfig();
    const docId = Number(req.params.docId);
    const filepath = docId2path[docId];
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
    const filepath = docId2path[docId];
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
    res.send(constructDocInfo(Buffer.from(blob).toString('utf8'), filepath));
});

router.delete('/:docId', async (req, res) => {
    const {gitHome} = getGitConfig();
    const docId = Number(req.params.docId);
    const filepath = docId2path[docId];
    delete docId2path[docId];
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
        const oldFilepath = docId2path[docId].split('/');
        const oldFilename = oldFilepath.pop();
        const oldDir = oldFilepath.join('/');
        const filename = req.body.name;
        const tags = JSON.parse(req.body.tag);
        const dir = tags.shift() || '';
        const actualFilename = `${docId}#${filename}${tags.map(tag => '[' + tag.replace('/', ':') + ']').join('')}.effect.json`
        const content = req.body.content;
        if (actualFilename === oldFilename && dir === oldDir) {
            console.log('仅修改内容')
            // 仅修改内容
            writeFile(dir, actualFilename, content).then(() => {
                commit().then(() => {
                    res.send({message: 'save success', id: req.params.docId});
                })
            });
        } else {
            console.log('重命名或移动目录')
            // 重命名或移动目录
            deleteFile(path.join(gitHome, docId2path[docId])).then(() => {
                writeFile(dir, actualFilename, content).then(() => {
                    commit().then(() => {
                        docId2path[docId] = path.join(dir, actualFilename);
                        res.send({message: 'save success', id: req.params.docId});
                    })
                });
            })
        }
    }
});

// this is required
module.exports = {router, punctuationSplit};
