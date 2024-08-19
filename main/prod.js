const http = require('http');
const client = require('https');
const fs = require('fs');
const os = require('os')
const path = require('path');
const isoHttp = require('isomorphic-git/http/node');
const multer = require('multer')
const cors = require('cors');
// const { createWorker } = require('tesseract.js');
const express = require('express');
const git = require('isomorphic-git');
const {store, getGitConfig} = require("./isomorphicGit");
const {IMAGES_FOLDER, SHARES_FOLDER, refreshIndex} = require("./expressDocCurd");
const isWindows = os.type().toLowerCase().indexOf('windows') >= 0

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
  const app = express();
  // const worker = await createWorker({
  //   cachePath: path.join(__dirname, 'lang-data'),
  //   logger: m => console.log(m),
  // }).then(async (worker) => {
  //   const lang = 'eng+chi_sim';
  //   return worker.loadLanguage(lang).then(() => {
  //      return worker.initialize(lang).then(() => {
  //        return worker;
  //      });
  //   });
  // });
  app.use(express.json({limit: '50mb'}));
  app.use(cors({
    origin: 'http://localhost:3000'
  }));
  app.use('/api/docs', require('./expressDocCurd').router);
  app.use('/api/pkb', require('./expressPkbCurd').router);
  app.use('/api/subscription', require('./expressSubscribeCurd'));
  app.post('/api/upload_image/:docId', multer().array('wangeditor-uploaded-image'), async function (req, res) {
    const {gitHome} = getGitConfig();
    const storePath = path.resolve(gitHome, IMAGES_FOLDER, req.params.docId)
    const data = await saveFiles(req.files, storePath, req.params.docId)
    res.send(data)
  })
  app.post('/api/upload_json/:docId', multer().array('uploaded-json'), async function (req, res) {
    const {gitHome} = getGitConfig();
    const storePath = path.resolve(gitHome, SHARES_FOLDER, req.params.docId)
    const data = await saveFiles(req.files, storePath, req.params.docId)
    res.send({data: storePath + '/' + data.data[0].alt})
  })
  app.post('/api/download_image', async function (req, res) {
    const picUrl = req.body.url
    const {gitHome} = getGitConfig();
    const filename = picUrl.split('/').pop().replace(/[^\w]/g, '')
    const distinctFileName = genRandomFileName(filename)
    downloadImage(picUrl, path.join(gitHome, IMAGES_FOLDER, distinctFileName)).then(() => {
      res.send({msg: '', code: 0, data: {originalURL: picUrl, url: `http://localhost:${port}/api/${IMAGES_FOLDER}/${distinctFileName}`}})
    }).catch(() => {
      res.send({msg: '', code: 0, data: {originalURL: picUrl, url: picUrl}})
    })
  })
  // app.post('/api/ocr_image', multer().single('file'), async function(req, res) {
  //   const { data: { text } } = await worker.recognize(req.file.buffer);
  //   console.log(text);
  //   // await worker.terminate();
  //   res.send({content: text});
  // });

  app.get('/api/config', (_, res) => {
    const {gitRemote, gitHome, gitUsername, gitPassword, gitDepth} = getGitConfig();
    const serverConfig = store.get('serverConfig', JSON.stringify({
      workspaces: [{
        active: true,
        gitLocalDir: gitHome,
        sycType: 'never'}]
    }));
    res.send(serverConfig);
  });
  app.get('/api/config/git_refresh', async (_, res) => {
    const {gitRemote, gitHome, gitUsername, gitPassword, gitDepth} = getGitConfig();
    if (fs.existsSync(gitHome)) {
      await fs.rmdirSync(gitHome, {recursive: true, force: true})
    }
    if (gitRemote.includes('http://localhost:30124')) {
      const sycDirectory = store.get('sycDirectory', '未配置');
      const sycProject = store.get('sycProject', '未配置');
      const finalDirectory = path.join(sycDirectory, sycProject);
      if (!fs.existsSync(finalDirectory)) {
        await git.init({fs, bare: true, dir: finalDirectory})
      }
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
    await refreshIndex();
    res.send({message: 'apply success'});
  })
  app.post('/api/config', async (req, res) => {
    const activeWorkSpace = req.body.workspaces.find(i => i.active)
    if (activeWorkSpace) {
      const {gitHome} = getGitConfig();
      store.set('gitHome', activeWorkSpace.gitLocalDir);
      if (gitHome !== activeWorkSpace.gitLocalDir) {
        await refreshIndex();
      }
      if (activeWorkSpace.sycType === 'never') {
        store.delete('gitRemote')
      }
      if (activeWorkSpace.sycType === 'webdav') {
        store.set('gitRemote', activeWorkSpace.gitRemote);
        store.set('sycDirectory', activeWorkSpace.sycDirectory);
        store.set('sycProject', activeWorkSpace.sycProject);
      } else {
        store.delete('sycDirectory');
        store.delete('sycProject');
      }
      if (activeWorkSpace.sycType === 'gitee') {
        store.set('gitRemote', activeWorkSpace.gitRemote);
        store.set('gitUsername', activeWorkSpace.gitUsername);
        store.set('gitPassword', activeWorkSpace.gitPassword);
        store.set('gitDepth', activeWorkSpace.gitDepth);
      }
    }
    store.set('serverConfig', JSON.stringify(req.body))
    res.send({message: 'save success'});
  });

  app.get(`/api/${IMAGES_FOLDER}/*`, function (req, res) {
    const {gitHome} = getGitConfig();
    const pictureName = req.params[0] ? req.params[0] : 'index.html';
    res.sendFile(pictureName, {root: gitHome + '/' + IMAGES_FOLDER})
  })
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    res.sendFile(buildDir + '/index.html');
  })
  const server = http.createServer(app);
  server.listen(port, host, (err) => {
    const address_info = server.address();
  });
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

  function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      client.get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(fs.createWriteStream(filepath))
              .on('error', reject)
              .once('close', () => resolve(filepath));
        } else {
          // Consume response data to free up memory
          res.resume();
          reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
        }
      });
    });
  }

  /**
   * 保存上传的文件
   * @param {Object} req request
   * @param {number} time time 用于测试超时
   */
  function saveFiles(files, storePath, docId) {
    return new Promise((resolve, reject) => {
      const imgLinks = []
        // 存储图片的文件夹
        if (!fs.existsSync(storePath)) {
          fs.mkdirSync(storePath, {recursive: true})
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
          const url = `http://localhost:${port}/api/${IMAGES_FOLDER}/${docId}/${fileName}`
          imgLinks.push({ url, alt: fileName, href: url })
        })
        resolve({
          errno: 0,
          data: imgLinks,
        })
      })
  }
}

module.exports={startExpress}
