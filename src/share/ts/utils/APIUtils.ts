import {DocInfo, SubscriptionInfo} from '../types';
import {ServerConfig} from '../../../ts/server_config';
import config from '../vim';

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

export function uploadImage(file: File) {
    let formData = new FormData();
    formData.append('wangeditor-uploaded-image', file);
    return request({
        url: API_BASE_URL + '/upload_image',
        method: 'POST',
        headers: new Headers({}),
        body: formData
    });
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

export function getServerConfig() {
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        return Promise.resolve(JSON.parse(localStorage.getItem('demo_mock_server_config') || '{}'));
    } else {
        return request({
           url: API_BASE_URL + '/config',
           method: 'GET'
        });
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
            content: JSON.stringify({text: ''}),
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

export function uploadDoc(docInfo: DocInfo) {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }
    if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
        const docs = JSON.parse(localStorage.getItem('demo_mock_doc_list') || '[]');
        const docId = docs.length;
        docs.push({id: docId, filename: docInfo.name + '.effect.json', ...docInfo});
        localStorage.setItem(`demo_mock_doc_content_${docId}`, docInfo.content || JSON.stringify({text: ''}));
        localStorage.setItem('demo_mock_doc_list', JSON.stringify(docs));
        return Promise.resolve({message: 'save success', id: docId});
    } else {
        return request({
            url: API_BASE_URL + '/docs/',
            method: 'POST',
            body: JSON.stringify(docInfo)
        });
    }
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
        localStorage.setItem(`demo_mock_doc_content_${docId}`, JSON.stringify({text: ''}));
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
