import {DocInfo, EMPTY_BLOCK, SubscriptionInfo} from '../types';
import {ServerConfig} from '../../../ts/server_config';
import config from '../vim';
import COS from 'cos-js-sdk-v5';
import {themes} from '../themes';

export const API_BASE_URL = 'http://localhost:51223/api';
export const ACCESS_TOKEN = 'accessToken';

const request = (options: any) => {
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        return Promise.reject('Demo部署环境下，该功能不可用');
    }

    if (localStorage.getItem(ACCESS_TOKEN)) {
        headers.append('Authorization', 'Bearer ' + localStorage.getItem(ACCESS_TOKEN));
    }

    const defaults = {headers: headers};
    options = Object.assign({}, defaults, options);

    // return fetch(window.location.origin + options.url, options)
    return fetch(options.url, options)
    .then(response =>
        response.json().then(json => {
            if (!response.ok) {
                return Promise.reject(json);
            }
            return json;
        })
    );
};

const requestText = (options: any) => {
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

    if (localStorage.getItem(ACCESS_TOKEN)) {
        headers.append('Authorization', 'Bearer ' + localStorage.getItem(ACCESS_TOKEN));
    }

    const defaults = {headers: headers};
    options = Object.assign({}, defaults, options);

    return fetch( options.url, options)
        .then( (response ) => {
            if ( response.ok ) {
                const a = response.text();
                return a;
            } else {
                throw `http error code ${response.status}`;
            }
        });
};

export function login(loginRequest: any) {
    return request({
        url: API_BASE_URL + '/auth/signin',
        method: 'POST',
        body: JSON.stringify(loginRequest)
    });
}

export async function uploadJson(jsonContent: string, docId: number, imgur: {type: string, url: string}) {
    const file = new File([jsonContent], 'share-doc', {type: 'application/json'});
    let formData = new FormData();
    formData.append('uploaded-json', file);
    return request({
        url: API_BASE_URL + '/upload_json/' + docId,
        method: 'POST',
        headers: new Headers({}),
        body: formData
    }).then(res => {
        return request({
            url: imgur.url,
            method: 'POST',
            body: JSON.stringify({list: [res.data]}),
            headers: new Headers({}),
        }).then(res => {
            return res.result[0] as string;
        });
    });
}

export async function uploadImage(file: File, docId: number, imgur: {type: string, url: string} | undefined) {
    if (imgur === undefined || imgur.type === 'local') {
        let formData = new FormData();
        formData.append('wangeditor-uploaded-image', file);
        return request({
            url: API_BASE_URL + '/upload_image/' + docId,
            method: 'POST',
            headers: new Headers({}),
            body: formData
        });
    } else {
        await navigator.clipboard.write([
            new ClipboardItem({[file.type]: file})
        ]);
        return request({
            url: imgur.url,
            method: 'POST',
            headers: new Headers({}),
        }).then(res => {
            const urls = res.result.map((u: any) => {
                return {url: u, alt: 'image.png', href: u};
            });
            return {
                errno: 0,
                data: urls,
            };
        });
    }
}

export function ocrFile(file: File) {
    let formData = new FormData();
    formData.append('file', file);
    return request({
        url: API_BASE_URL + '/ocr_image',
        method: 'POST',
        headers: new Headers({}),
        body: formData
    });
};

export function downloadImage(url: string) {
    return request({
        url: API_BASE_URL + '/download_image',
        method: 'POST',
        body: JSON.stringify({url})
    });
}

export function setCategory(key: string, value: string) {
    return requestText({
        url: API_BASE_URL + `/categories/set`,
        method: 'POST',
        body: JSON.stringify({key: key, value: value})
    });
}

export function getCategory(key: string) {
    return requestText({
        url: API_BASE_URL + `/categories/get?key=${key}`,
        method: 'GET'
    });
}

export function signup(signupRequest: any) {
    return request({
        url: API_BASE_URL + '/auth/signup',
        method: 'POST',
        body: JSON.stringify(signupRequest)
    });
}

export function checkUsernameAvailability(username: string) {
    return request({
        url: API_BASE_URL + '/user/checkUsernameAvailability?username=' + username,
        method: 'GET'
    });
}

export async function getServerConfig(): Promise<ServerConfig> {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const serverConfig = JSON.parse(localStorage.getItem('demo_mock_server_config') || '{}');
        return {themes: themes, ...serverConfig};
    } else {
        const serverConfig = await request({
           url: API_BASE_URL + '/config',
           method: 'GET'
        });
        return {themes: themes, ...serverConfig};
    }
}

export function setServerConfig(serverConfig: ServerConfig) {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        localStorage.setItem('demo_mock_server_config', JSON.stringify(serverConfig));
        return Promise.resolve();
    } else {
        return request({
            url: API_BASE_URL + '/config',
            method: 'POST',
            body: JSON.stringify(serverConfig)
        });
    }
}

export function workspaceRebuild() {
    return request({
        url: API_BASE_URL + '/config/git_refresh',
        method: 'GET'
    });
}

export function addSubscription(info: SubscriptionInfo) {
    return request({
        url: API_BASE_URL + '/subscription',
        method: 'POST',
        body: JSON.stringify(info)
    });
}

export function getSubscriptions() {
    return request({
        url: API_BASE_URL + '/subscription',
        method: 'GET'
    });
}

export function updateSubscriptions(body: any) {
    return request({
        url: API_BASE_URL + '/subscription',
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

export function getSubscriptionFiles(dir: string) {
    return request({
        url: API_BASE_URL + `/subscription/file_tree?dir=${dir}`,
        method: 'GET',
    });
}

export function searchSubscription(query: string) {
    return request({
       url: API_BASE_URL + `/subscription/search?search=${query}`,
       method: 'GET',
    });
}

export function reindexWorkSpace() {
    return request({
        url: API_BASE_URL + `/docs/reindex`,
        method: 'GET',
    });
}

export function searchDoc(query: string) {
    return request({
        url: API_BASE_URL + `/docs/search?search=${query}`,
        method: 'GET',
    });
}

export function getSubscriptionFileContent(filepath: string) {
    return request({
       url: API_BASE_URL + `/subscription/file_content?filepath=${filepath}`,
       method: 'GET',
    });
}

export function updateDoc(docId: number, docInfo: DocInfo) {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const docs = JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]') as any[];
        localStorage.setItem('demo_mock_doc_list', JSON.stringify([{
            content: JSON.stringify(EMPTY_BLOCK),
            ...docInfo}].concat(
              docs.filter(d => d.id !== docId)
        )));
        localStorage.setItem(`demo_mock_doc_content_${docId}`, docInfo.content!);
        return Promise.resolve({message: 'save success', id: docId});
    }
    return request({
        url: API_BASE_URL + '/docs/' + docId,
        method: 'PUT',
        body: JSON.stringify(docInfo)
    });
}

export function uploadPKB(docInfo: DocInfo) {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const docs = JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]');
        const docId = docs.length;
        docs.push({id: docId, filename: docInfo.name + '.excalidraw', ...docInfo});
        localStorage.setItem(`demo_mock_doc_content_${docId}`, docInfo.content || JSON.stringify(EMPTY_BLOCK));
        localStorage.setItem('demo_mock_doc_list', JSON.stringify(docs));
        return Promise.resolve({message: 'save success', id: docId});
    }
    return request({
        url: API_BASE_URL + '/pkb/',
        method: 'POST',
        body: JSON.stringify(docInfo)
    });
}

export function uploadDoc(docInfo: DocInfo) {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const docs = JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]');
        const docId = docs.length;
        docs.push({id: docId, filename: docInfo.name + '.effect.json', ...docInfo});
        localStorage.setItem(`demo_mock_doc_content_${docId}`, docInfo.content || JSON.stringify(EMPTY_BLOCK));
        localStorage.setItem('demo_mock_doc_list', JSON.stringify(docs));
        return Promise.resolve({message: 'save success', id: docId});
    }
    return request({
        url: API_BASE_URL + '/docs/',
        method: 'POST',
        body: JSON.stringify(docInfo)
    });
}

function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function shareDoc(content: string) {
    const Bucket = 'fileserver-1314328063';
    const Region = 'ap-beijing';
    const cos = new COS({
        SecretId: 'xxx',
        SecretKey: 'xxx',
    });
    const randomId = makeid(10) + '.effect.json';
    return cos.uploadFile({
        Bucket,
        Region,
        Key: randomId,
        Body: content,
        SliceSize: 1024 * 1024 * 5,
    }).then((err: any) => {
        if (err) {
            return randomId;
        } else {
            return '';
        }
    });
}

export function getDocVersions(docId: number) {
    return request({
        url: API_BASE_URL + '/docs/' + docId + '/versions',
        method: 'GET',
    });
}

export function getCurrentUser() {
    // if (!localStorage.getItem(ACCESS_TOKEN)) {
    //     return Promise.reject('No access token set.');
    // }

    return request({
        url: API_BASE_URL + '/user/me',
        method: 'GET'
    });
}

export function getShareDocContent(filename: string) {
    return new Promise(function (resolve, reject) {
        fetch(filename, {}).then(response =>
          response.text().then(json => {
              if (!response.ok) {
                  reject(json);
              }
              resolve(json);
          })
        );
    });
}

export function getDocContent(docId: number, version: string = 'HEAD') {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }
    if (docId === -1) {
        return Promise.resolve({content: config.getDefaultData()});
    }
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        return Promise.resolve({content: localStorage.getItem(`demo_mock_doc_content_${docId}`)!});
    }
    return request({
        url: `${API_BASE_URL}/docs/${docId}?version=${version}`,
        method: 'GET',
    });
}

export function deleteDocContent(docId: number) {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const docs = JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]') as DocInfo[];
        localStorage.setItem('demo_mock_doc_list', JSON.stringify(docs.filter(d => d.id !== docId)));
        localStorage.setItem(`demo_mock_doc_content_${docId}`, JSON.stringify(EMPTY_BLOCK));
        return Promise.resolve();
    }
    return request({
        url: API_BASE_URL + '/docs/' + docId,
        method: 'DELETE'
    });
}

export function getCurrentUserDocs() {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        return Promise.resolve( {
            content: [{name: '欢迎使用Effect笔记', filename: 'help.effect.json', tag: JSON.stringify([]), id: -1}].concat(
              JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]')
            )
        });
    }
    return request({
        url: API_BASE_URL + '/docs',
        method: 'GET'
    });
}
