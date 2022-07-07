import { ServerConfig } from './server_config';

export const SERVER_CONFIG: ServerConfig = JSON.parse(process.env.REACT_APP_SERVER_CONFIG || '{}');

