module.exports = {
    appId: 'com.effectnote.desktop',
    "extends": null,
    asar: true,
    asarUnpack: [
        "build/**/*"
    ],
    files: [
        "./main/**",
        "./build/**"
    ],
    mac: {
        bundleVersion: "0.2.7.1",
        bundleShortVersion: "0.2.7",
        "icon": "./public/images/icon.icns",
        target: ['mas', 'mas-dev'],
    },
    masDev: {
        entitlements: './sign/entitlements.mas.plist',
        entitlementsInherit: './sign/entitlements.mas.inherit.plist',
        entitlementsLoginHelper: './sign/entitlements.mas.loginhelper.plist',
        hardenedRuntime: true,
        type: 'development',
    },
    mas: {
        entitlements: './sign/entitlements.mas.plist',
        entitlementsInherit: './sign/entitlements.mas.inherit.plist',
        entitlementsLoginHelper: './sign/entitlements.mas.loginhelper.plist',
        hardenedRuntime: true,
        provisioningProfile: '/Users/weiwenda/Downloads/embedded.provisionprofile',
        type: 'distribution',
    },
};
