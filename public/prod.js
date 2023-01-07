const http = require('http');
const fs = require('fs');
const os = require('os')
const path = require('path');
const isoHttp = require('isomorphic-git/http/node');
const Moment = require('moment');
const multer = require('multer')
const cors = require('cors');
const { createWorker } = require('tesseract.js');
const lunr = require("lunr")
require("lunr-languages/lunr.stemmer.support")(lunr)
require('lunr-languages/lunr.multi')(lunr)
require("lunr-languages/lunr.zh")(lunr)

const express = require('express');
const git = require('isomorphic-git');
const isWindows = os.type().toLowerCase().indexOf('windows') >= 0
const IMAGES_FOLDER = 'images'

async function startExpress(args) {
  if (args.help || args.h) {
    process.stdout.write(`
      Usage: ./node_modules/.bin/ts-node ${process.argv[1]}
          -h, --help: help menu

          --host $hostname: Host to listen on
          --port $portnumber: Port to run on

          --db $dbtype: If a db is set, we will additionally run a socket server.
            Available options:
            - 'sqlite' to use sqlite backend
            Any other value currently defaults to an in-memory backend.
          --password: password to protect database with (defaults to empty)

          --dbfolder: For sqlite backend only.  Folder for sqlite to store data
            (defaults to in-memory if unspecified)

          --buildDir: Where build assets should be served from.  Defaults to the \`build\`
            folder at the repo root.

    `, () => {
      process.exit(0);
    });
    return;
  }

  const buildDir = path.resolve(__dirname + '/../build');
  let port = args.port || 3000;
  let host = args.host || 'localhost';
  let gitRemote = args.store.get('gitRemote', 'https://gitee.com/xxx/xxx')
  let gitHome = args.store.get('gitHome', '未配置')
  let gitUsername = args.store.get('gitUsername', '未配置')
  let gitPassword = args.store.get('gitPassword', '未配置')
  let gitDepth = args.store.get('gitDepth', 100)
  let subscriptionIndex = lunr(function() {
    this.ref("path")
    this.field("title")
    this.field("content")
  })
  const app = express();
  const worker = await createWorker({
    cachePath: path.join(__dirname, 'lang-data'),
    logger: m => console.log(m),
  }).then(async (worker) => {
    const lang = 'eng+chi_sim';
    return worker.loadLanguage(lang).then(() => {
       return worker.initialize(lang).then(() => {
         return worker;
       });
    });
  });
  const listFiles = async () => {
    if (gitHome !== '未配置') {
      const files = await git.listFiles({fs, dir: gitHome})
      const effectFiles = files.filter(file => file.endsWith('.effect.json'))
      return effectFiles;
    } else {
      return [];
    }
  }
  app.use(express.json({limit: '50mb'}));
  app.use(cors({
    origin: 'http://localhost:3000'
  }));
  app.post('/api/upload_image', multer().array('wangeditor-uploaded-image'), async function (req, res) {
    const data = await saveFiles(req.files)
    res.send(data)
  })
  app.post('/api/ocr_image', multer().single('file'), async function(req, res) {
    const { data: { text } } = await worker.recognize(req.file.buffer);
    console.log(text);
    // await worker.terminate();
    res.send({content: text});
  });

  app.get('/api/docs', (_, res) => {
      listFiles().then(files => {
        const result = [{name: '欢迎使用Effect笔记', tag: JSON.stringify([]), id: -1}].concat(
          files.map((file, index) => {
            return constructDocInfo(undefined, file, index);
          })
        );
        res.send({content: result});
      }).catch(() => {
        res.send({content: []});
      });
  });
  app.post('/api/docs', (req, res) => {
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
  app.post('/api/subscription', async (req, res) => {
    const dirname = req.body.name;
    const gitRemote = req.body.gitRemote;
    const rootDir = req.body.rootDir;
    const localDir = path.join(path.dirname(gitHome), 'effectnote', dirname + '_whole')
    const existList = JSON.parse(args.store.get('subscription_list', '{}'))
    if (existList.hasOwnProperty(dirname)) {
      res.status(500).send({message: '名称重复'})
    } else {
      existList[dirname] = req.body;
      args.store.set('subscription_list', JSON.stringify(existList))
      await git.clone({
        fs,
        http: isoHttp,
        dir: path.join(path.dirname(gitHome), 'effectnote', dirname + '_whole'),
        url: gitRemote,
        singleBranch: true,
        depth: 1,
      })
      fs.symlinkSync(path.join(localDir, rootDir), path.join(path.dirname(gitHome), 'effectnote', dirname))
      refreshIndex()
      res.send({message: 'subscription success'})
    }
  })
  app.get('/api/refresh_subscription', async (req, res) => {
    await refreshIndex()
    res.send({message: '索引构建成功'})
  })
  app.get('/api/search_subscription', (req, res) => {
    res.send(subscriptionIndex.search(req.query.search))
  })
  app.get('/api/docs/:docId/versions', async (req, res) => {
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
  app.delete('/api/docs/:docId', async (req, res) => {
    const docId = Number(req.params.docId);
    const files = await listFiles();
    const filepath = files[docId];
    deleteFile(path.join(gitHome, filepath)).then(() => {
      commit().then(() => {
        res.send({message: 'delete success!'});
      })
    })
  })
  app.get('/api/docs/:docId', async (req, res) => {
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
  app.get('/api/config', (_, res) => {
    res.send({ gitRemote: gitRemote,
      gitLocalDir: gitHome,
      gitUsername,
      gitPassword,
      gitDepth});
  });
  app.get('/api/config/git_refresh', async (_, res) => {
    if (fs.existsSync(gitHome)) {
      await fs.rmdirSync(gitHome, {recursive: true, force: true})
    }
    await git.clone({
      fs,
      http: isoHttp,
      dir: gitHome,
      url: gitRemote,
      singleBranch: true,
      depth: gitDepth,
      onAuth: () => ({ username: gitUsername, password: gitPassword}),
    })
    res.send({message: 'apply success'});
  })
  app.post('/api/config', async (req, res) => {
    gitRemote = req.body.gitRemote;
    args.store.set('gitRemote', gitRemote);
    gitHome = req.body.gitLocalDir;
    args.store.set('gitHome', gitHome);
    gitUsername = req.body.gitUsername;
    args.store.set('gitUsername', gitUsername);
    gitPassword = req.body.gitPassword;
    args.store.set('gitPassword', gitPassword);
    gitDepth = req.body.gitDepth;
    args.store.set('gitDepth', gitDepth);
    res.send({message: 'save success'});
  });
  app.put('/api/docs/:docId', async (req, res) => {
    if (req.params.docId === '-1') {
      res.send({message: '帮助文档无法保存', id: req.params.docId});
    } else {
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
            res.send({message: 'save success', id: req.params.docId});
          })
        });
      } else {
        console.log('重命名或移动目录')
        // 重命名或移动目录
        deleteFile(path.join(gitHome, files[docId])).then(() => {
          writeFile(dir, actualFilename, content).then(() => {
            commit().then(() => {
              res.send({message: 'save success', id: req.params.docId});
            })
          });
        })
      }
    }
  });
  app.get(`/api/${IMAGES_FOLDER}/*`, function (req, res) {
    const pictureName = req.params[0] ? req.params[0] : 'index.html';
    res.sendFile(pictureName, {root: gitHome + '/' + IMAGES_FOLDER})
  })
  app.use(express.static(buildDir));
  const server = http.createServer(app);
  server.listen(port, host, (err) => {
    const address_info = server.address();
  });

  async function refreshIndex() {
    const existList = JSON.parse(args.store.get('subscription_list', '{}'))
    subscriptionIndex = lunr(function() {
      this.use(lunr.multiLanguage('en', 'zh'))
      this.ref("path")
      this.field("title")
      this.field("content")
      Object.keys(existList).forEach(async (sub) => {
        const dir = path.join(path.dirname(gitHome), 'effectnote', sub)
        await addDocToIndex(dir, this)
      })
    })
  }

  async function addDocToIndex(dir, lunrIdx) {
    fs.readdirSync(dir, {withFileTypes: true})
      .forEach(async (item) => {
        if (item.isDirectory()) {
          await addDocToIndex(path.join(dir, item.name), lunrIdx)
        } else {
          console.log(item.name)
          if (item.name.endsWith('.md') || item.name.endsWith('.effect.json')) {
            const content = fs.readFileSync(path.join(dir, item.name), {encoding: 'utf-8'});
            lunrIdx.add({
              'path': path.join(dir, item.name),
              'title': item.name,
              'content': content,
            })
          }
        }
      })
  }

  function constructDocInfo(content, filepath, id) {
    const paths = filepath.split('/');
    const nameSplits = paths.pop().split(new RegExp('[\[\\]\.]'));
    const name = nameSplits.shift();
    const tag = paths.join('/');
    const otherTags = nameSplits.filter(split => {
      return split && split !== 'json' && split !== 'effect'
    })
    return {name, tag: tag ? JSON.stringify([tag].concat(otherTags)) : JSON.stringify([]), content, id}
  }

  /**
   * 获取随机数
   */
  function getRandom() {
    return Math.random().toString(36).slice(-3)
  }

  /**
   * 给文件名加后缀，如 a.png 转换为 a-123123.png
   * @param {string} fileName 文件名
   */
  function genRandomFileName(fileName = '') {
    // 如 fileName === 'a.123.png'

    const r = getRandom()
    if (!fileName) return r

    const length = fileName.length // 9
    const pointLastIndexOf = fileName.lastIndexOf('.') // 5
    if (pointLastIndexOf < 0) return `${fileName}-${r}`

    const fileNameWithOutExt = fileName.slice(0, pointLastIndexOf) // "a.123"
    const ext = fileName.slice(pointLastIndexOf + 1, length) // "png"
    return `${fileNameWithOutExt}-${r}.${ext}`
  }

  /**
   * 保存上传的文件
   * @param {Object} req request
   * @param {number} time time 用于测试超时
   */
  function saveFiles(files) {
    return new Promise((resolve, reject) => {
      const imgLinks = []
        // 存储图片的文件夹
        const storePath = path.resolve(gitHome, IMAGES_FOLDER)
        if (!fs.existsSync(storePath)) {
          fs.mkdirSync(storePath)
        }
        files.forEach(fileForm => {
          const name = Buffer.from(fileForm.originalname, "latin1").toString(
              "utf8"
          );
          console.log('name...', name)
          // 图片名称和路径
          const fileName = genRandomFileName(name) // 为文件名增加一个随机数，防止同名文件覆盖
          console.log('fileName...', fileName)
          const fullFileName = path.join(storePath, fileName)
          console.log('fullFileName...', fullFileName)
          // 将临时文件保存为正式文件
          fs.writeFileSync(fullFileName, fileForm.buffer)
          // 存储链接
          const url = `http://localhost:${port}/api/${IMAGES_FOLDER}/${fileName}`
          imgLinks.push({ url, alt: fileName, href: url })
        })
        resolve({
          errno: 0,
          data: imgLinks,
        })
      })
  }

  async function deleteFile(file) {
    return fs.promises.unlink(file)
  }

  async function commit() {
    const status = await git.statusMatrix({fs, dir: gitHome});
    if (status.every(([filepath, c1, c2, c3]) => c1 === 1 && c2 === 1 && c3 === 1)) {
      console.log('nothing changed!')
      return;
    }
    await Promise.all(
        status.filter(([filepath, _]) => {
          return !filepath.split('/').pop().startsWith('.');
        }).map(([filepath, , worktreeStatus]) =>
            worktreeStatus ? git.add({fs, dir: gitHome, filepath }) : git.remove({fs, dir: gitHome, filepath })
        )
    )
    await git.commit(
        {fs, dir: gitHome, author: {name: 'auto saver', email : '994184916@qq.com'},
          message: Moment().format('yyyy-MM-DD HH:mm:ss')}
    );
    await git.push({fs,
      http: isoHttp,
      dir: gitHome,
      remote: 'origin',
      onAuth: () => ({ username: gitUsername, password: gitPassword}),
    });
  }

  async function writeFile(dirs, filename, content) {
    await fs.promises.mkdir(path.join(gitHome, dirs), {recursive: true}).then(() => {
      return fs.promises.writeFile(path.join(gitHome, dirs, filename), content)
    });
  }
}

module.exports={startExpress}
