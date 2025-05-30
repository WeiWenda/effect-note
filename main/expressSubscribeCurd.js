const express = require('express'),
    router    = express.Router();
const fs = require("fs");
const path = require("path");
const git = require("isomorphic-git");
const isoHttp = require("isomorphic-git/http/node");
const {store, getGitConfig} = require("./isomorphicGit");
const lunr = require("lunr")
require("lunr-languages/lunr.stemmer.support")(lunr)
require('lunr-languages/lunr.multi')(lunr)
require('lunr-languages/lunr.zh')(lunr)
let subscriptionIndex = null;
function getSearchDir() {
    return path.join(path.dirname(getGitConfig().gitHome), 'effectnote')
}
async function refreshIndex() {
    const existList = JSON.parse(store.get('subscription_list', '{}'))
    subscriptionIndex = lunr(function() {
        this.use(lunr.multiLanguage('en', 'zh'))
        this.use(require('./expressDocCurd').punctuationSplit)
        this.ref("path")
        this.field("title")
        this.field("content")
        Object.keys(existList).forEach(async (sub) => {
            await addDocToIndex(sub, this)
        })
    })
}
refreshIndex();
async function addDocToIndex(dir, lunrIdx) {
    fs.readdirSync(path.join(getSearchDir(), dir), {withFileTypes: true})
        .forEach(async (item) => {
            if (item.isDirectory()) {
                await addDocToIndex(path.join(dir, item.name), lunrIdx)
            } else {
                // console.log(item.name)
                if (item.name.endsWith('.md') || item.name.endsWith('.effect.json')) {
                    const content = fs.readFileSync(path.join(getSearchDir(), dir, item.name), {encoding: 'utf-8'});
                    lunrIdx.add({
                        'path': path.join(dir, item.name),
                        'title': item.name,
                        'content': content,
                    })
                }
            }
        })
}

async function addSubscribe(dirname, gitRemote, rootDir, gitPull, res) {
    const localDir = path.join(getSearchDir(), dirname + '_whole')
    const existList = JSON.parse(store.get('subscription_list', '{}'))
    if (existList.hasOwnProperty(dirname)) {
        if (gitPull) {
            await git.pull({
                fs,
                http: isoHttp,
                dir: path.join(getSearchDir(), dirname + '_whole'),
                singleBranch: true,
                author: {
                    name: 'effect',
                    email: 'effect@effect.com'
                }
            })
            refreshIndex()
            res.send({message: 'git pull success'})
        } else {
            res.status(500).send({message: '名称重复'})
        }
    } else {
        existList[dirname] = {name: dirname, gitRemote, rootDir};
        store.set('subscription_list', JSON.stringify(existList))
        if (fs.existsSync(path.join(getSearchDir(), dirname))) {
            await fs.unlinkSync(path.join(getSearchDir(), dirname))
        }
        await git.clone({
            fs,
            http: isoHttp,
            dir: path.join(getSearchDir(), dirname + '_whole'),
            url: gitRemote,
            singleBranch: true,
            depth: 1,
        })
        fs.symlinkSync(path.join(localDir, rootDir), path.join(getSearchDir(), dirname))
        refreshIndex()
        res.send({message: 'subscription success'})
    }
}
router.get('/', async (req, res) => {
    const existList = JSON.parse(store.get('subscription_list', '{}'))
    res.send({data: existList})
})
router.get('/file_tree', (req, res) => {
    const dir = req.query.dir;
    const data = fs.readdirSync(path.join(getSearchDir(), dir), {withFileTypes: true}).map(file => {
        return {
            title: file.name,
            key: path.join(dir, file.name),
            isLeaf: !file.isDirectory()
        }
    });
    res.send({data})
})
router.get(`/img/*`, function (req, res) {
    const pictureName = req.params[0] ? req.params[0] : 'index.html';
    res.sendFile(pictureName, {root: getSearchDir()})
})
router.get('/file_content', (req, res) => {
    const filepath = req.query.filepath;
    const name = filepath.split('/').pop()
    const content = fs.readFileSync(path.join(getSearchDir(), filepath), {encoding: 'utf-8'});
    res.send({name, tag: JSON.stringify([]), content, id: -2});
})
router.put('/', (req, res) => {
    store.set('subscription_list', JSON.stringify(req.body))
    refreshIndex()
    res.send({message: 'update subscription success'})
})

router.get('/quick_add', async (req, res) => {
    addSubscribe(req.query.name, req.query.remote, req.query.dir || '', false, res)
})
router.post('/', async (req, res) => {
    addSubscribe(req.body.name, req.body.gitRemote, req.body.rootDir, req.body.gitPull, res)
})
router.get('/refresh', async (req, res) => {
    await refreshIndex()
    res.send({message: '索引构建成功'})
})
router.get('/search', (req, res) => {
    if (req.query.search.includes(' ')) {
        res.send(subscriptionIndex.search(req.query.search));
    } else {
        const terms = require('./expressDocCurd').searchSplitFunction(req.query.search);
        console.debug(terms);
        res.send(subscriptionIndex.search(terms.map(t => `+${t}`).join(' ')))
    }
})

module.exports = router;
