export type DialogFileData = {
    /**
     * Did user cancel dialog?
     */
    cancelled: boolean;
    /**
     * Array of file paths that user selected
     */
    filePaths: string[];
};
declare global {
    /**
     * We define all IPC APIs here to give devs auto-complete
     * use window.electron anywhere in app
     * Also note the capital "Window" here
     */
    interface Window {
        electronAPI: {
            openDirectory: () => Promise<DialogFileData>;
        };
    }
}
export {}
