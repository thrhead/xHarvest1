const React = require('react');

function IconComponent() {
  return null;
}

IconComponent.getImageSource = function() { return Promise.resolve({ uri: '' }); };
IconComponent.getImageSourceSync = function() { return { uri: '' }; };
IconComponent.loadFont = function() { return Promise.resolve(); };
IconComponent.hasIcon = function() { return true; };
IconComponent.Button = function() { return null; };
IconComponent.TabBarItem = function() { return null; };
IconComponent.TabBarItemIOS = function() { return null; };

IconComponent.default = IconComponent;
IconComponent.Icon = IconComponent;

module.exports = IconComponent;
module.exports.default = IconComponent;
module.exports.Icon = IconComponent;
module.exports.getImageSource = IconComponent.getImageSource;
module.exports.getImageSourceSync = IconComponent.getImageSourceSync;
module.exports.loadFont = IconComponent.loadFont;
module.exports.hasIcon = IconComponent.hasIcon;
module.exports.Button = IconComponent.Button;
module.exports.TabBarItem = IconComponent.TabBarItem;
module.exports.TabBarItemIOS = IconComponent.TabBarItemIOS;
