const packagerConfig = {
  appBundleId: 'com.effectnote.desktop',
  osxSign: {
    identity: 'Developer ID Application: wenda wei (8NFNDJ5TWD)',
    preEmbedProvisioningProfile: true,
    provisioningProfile: '/Users/weiwenda/Downloads/nonmas.provisionprofile',
    optionsForFile: (filePath) => {
      // Here, we keep it simple and return a single entitlements.plist file.
      // You can use this callback to map different sets of entitlements
      // to specific files in your packaged app.
      return {
        entitlements: './sign/entitlements.nomas.plist'
      };
    }
  },
  osxNotarize: {
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  },
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
