import {DocInfo, SubscriptionInfo} from '../types';
import {ServerConfig} from '../../../ts/server_config';

export const API_BASE_URL = 'http://localhost:51223/api';
export let API_BASE_URL2 = '/api';
export const ACCESS_TOKEN = 'accessToken';

if (process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    API_BASE_URL2 = API_BASE_URL;
}

const request = (options: any) => {
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

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
    return request({
       url: API_BASE_URL2 + '/config',
       method: 'GET'
    });
}

export function setServerConfig(serverConfig: ServerConfig) {
    return request({
        url: API_BASE_URL2 + '/config',
        method: 'POST',
        body: JSON.stringify(serverConfig)
    });
}

export function applyGitConfig() {
    return request({
        url: API_BASE_URL2 + '/config/git_refresh',
        method: 'GET'
    });
}

export function updateDoc(docId: number, docInfo: DocInfo) {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }

    return request({
        url: API_BASE_URL2 + '/docs/' + docId,
        method: 'PUT',
        body: JSON.stringify(docInfo)
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

export function getSubscriptionFiles(dir: string) {
    return request({
        url: API_BASE_URL + `/subscription/file_tree?dir=${dir}`,
        method: 'GET',
    });
}

export function searchSubscription(query: string) {
    return request({
       url: API_BASE_URL + `/search_subscription?search=${query}`,
       method: 'GET',
    });
}

export function getSubscriptionFileContent(filepath: string) {
    return request({
       url: API_BASE_URL + `/subscription/file_content?filepath=${filepath}`,
       method: 'GET',
    });
}

export function uploadDoc(docInfo: DocInfo) {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }

    return request({
        url: API_BASE_URL2 + '/docs/',
        method: 'POST',
        body: JSON.stringify(docInfo)
    });
}

export function getDocVersions(docId: number) {
    return request({
        url: API_BASE_URL2 + '/docs/' + docId + '/versions',
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

    return request({
        url: `${API_BASE_URL2}/docs/${docId}?version=${version}`,
        method: 'GET',
    });
}

export function deleteDocContent(docId: number) {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }
    return request({
        url: API_BASE_URL + '/docs/' + docId,
        method: 'DELETE'
    });
}

export function getCurrentUserDocs() {
    // if (!localStorage.getItem(ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
    //     return Promise.reject('No access token set.');
    // }

    return request({
        url: API_BASE_URL2 + '/docs',
        method: 'GET'
    });
}
