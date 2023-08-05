module.exports = {
  packagerConfig: {
    osxSign: {},
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
      config: {}
    }
  ],
};
