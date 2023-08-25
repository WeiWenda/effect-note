const fs = require('fs');
const packagerConfig = {
  appBundleId: 'com.effectnote.desktop',
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
if (process.argv[3] === 'mas') {
  packagerConfig.osxSign = {
    identity: 'Apple Distribution: wenda wei (8NFNDJ5TWD)',
    preEmbedProvisioningProfile: true,
    provisioningProfile: '/Users/mac/Downloads/mas.provisionprofile',
    optionsForFile: (filePath) => {
      if (filePath.endsWith("EffectNote.app")) {
        return {
          entitlements: './sign/entitlements.mas.plist'
        }
      } else if (filePath.includes("Library/LoginItems")) {
        return {
          entitlements: './sign/entitlements.mas.loginhelper.plist'
        };
      } else {
        return {
          entitlements: './sign/entitlements.mas.inherit.plist'
        };
      }
    }
  }
}
if (process.argv[3] === 'darwin') {
  packagerConfig.osxSign = {
    identity: 'Developer ID Application: wenda wei (8NFNDJ5TWD)',
    preEmbedProvisioningProfile: true,
    provisioningProfile: '/Users/mac/Downloads/nomas.provisionprofile',
  }
  packagerConfig.osxNotarize = {
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  }
}
module.exports = {
  hooks: {
    generateAssets: async () => {
      fs.writeFileSync(
          './role.json',
          JSON.stringify({
            role: process.env.PLATFORM
          })
      );
    }
  },
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
    },
    {
      name: '@electron-forge/maker-pkg',
      config: {}
    }
  ],
};
