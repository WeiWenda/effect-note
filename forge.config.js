const packagerConfig = {
  appBundleId: 'com.effectnote.desktop',
  osxSign: {
    identity: 'Developer ID Application: wenda wei (8NFNDJ5TWD)',
  },
  // osxNotarize: {
  //   tool: 'notarytool',
  //   appleId: process.env.APPLE_ID,
  //   appleIdPassword: process.env.APPLE_PASSWORD,
  //   teamId: process.env.APPLE_TEAM_ID,
  // },
  icon: './public/images/icon',
  ignore: [
    "^\\/src$",
    "^\\/server$",
    "^\\/test$",
    "^\\/docs$",
    "^\\/public$",
    "^\\/dist$",
    "^\\/[.].+",
    // [...]
  ]
};
module.exports = {
  packagerConfig: packagerConfig,
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './public/images/icon.icns',
        name: 'EffectNote'
      }
    }
  ],
};
