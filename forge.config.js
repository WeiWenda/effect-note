module.exports = {
  packagerConfig: {
    appBundleId: 'com.effectnote.desktop',
    osxSign: {
      identity: 'Developer ID Installer: wenda wei (8NFNDJ5TWD)',
    },
    icon: './public/images/icon',
    ignore: [
      "^\\/src$",
      "^\\/server$",
      "^\\/test$",
      "^\\/docs$",
      "^\\/[.].+",
      // [...]
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-pkg',
      config: {
        identity: 'Developer ID Installer: wenda wei (8NFNDJ5TWD)'
      }
    }
  ],
};
