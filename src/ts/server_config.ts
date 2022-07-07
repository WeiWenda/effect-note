// server-side configuration of client code
export type ServerConfig = {
  socketserver?: boolean,
  gitRemote?: string,
  gitLocalDir?: string,
  gitUsername?: string,
  gitDepth?: number,
  gitPassword?: string
};
