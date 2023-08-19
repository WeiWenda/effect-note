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
        entitlements: './sign/entitlements.mas.plist',
        entitlementsInherit: './sign/entitlements.mas.inherit.plist',
        entitlementsLoginHelper: './sign/entitlements.mas.loginhelper.plist',
        provisioningProfile: '/Users/mac/Downloads/masdevelop.provisionprofile',
        "icon": "./public/images/icon.icns",
        hardenedRuntime: true,
        gatekeeperAssess: false,
        target: ['mas-dev'],
    }
};
