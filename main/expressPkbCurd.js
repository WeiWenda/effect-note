const express = require('express'),
    router    = express.Router();
const git = require("isomorphic-git");
const fs = require("fs");
const {listPkbFiles, deleteFile, writeFile, commit, getGitConfig, store, listFiles} = require("./isomorphicGit");
const path = require("path");
const isoHttp = require("isomorphic-git/http/node");
const {docId2path, IMAGES_FOLDER} = require("./expressDocCurd");

router.post('/', (req, res) => {
    const filename = req.body.name;
    const docId = req.body.id;
    const tags = JSON.parse(req.body.tag);
    const dir = tags.shift() || '';
    const actualFilename = `${docId}#${filename}${tags.map(tag => '[' + tag.replace('/', ':') + ']').join('')}.excalidraw`
    const content = req.body.content;
    writeFile(dir, actualFilename, content).then(() => {
        commit().then(() => {
            docId2path[docId] = path.join(dir, actualFilename);
            res.send({message: 'save success', id: docId});
        })
    });
});
// this is required
module.exports = {router};
